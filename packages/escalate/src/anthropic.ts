import Anthropic from "@anthropic-ai/sdk";
import { Divergence, Severity, Verdict, type Divergence as TDivergence } from "@parity/manifest";
import type { EscalationInput, Judge } from "./types.js";

const MODEL = "claude-opus-4-8";

/** JSON schema for the structured verdict the model returns (one entry per finding). */
const VERDICT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    verdicts: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          index: { type: "integer" },
          verdict: { type: "string", enum: ["bug", "intent", "match"] },
          severity: { type: "string", enum: ["critical", "major", "minor"] },
          confidence: { type: "number" },
          detail: { type: "string" },
        },
        required: ["index", "verdict", "severity", "confidence", "detail"],
      },
    },
  },
  required: ["verdicts"],
} as const;

const SYSTEM = [
  "You audit whether a running mobile UI matches its design intent.",
  "You are shown ONLY a small crop of the region a deterministic pass already flagged, plus a summary of the design intent and the candidate findings.",
  "For each finding, decide: is the mismatch a real BUG, an INTENTional state the designer simply never drew, or actually a MATCH (false alarm)?",
  "Precision matters more than recall: when unsure a finding is a real defect, prefer 'intent' or 'match' over 'bug'. A false 'bug' is the worst outcome.",
  "Return one verdict per finding, by index.",
].join(" ");

/**
 * Real pass-2 judge. Calls Claude with ONLY the failing crop + compact context, and maps
 * the model's per-finding verdict back onto the deterministic findings (kind/anchor stay
 * authoritative from pass 1; the model supplies verdict/severity/confidence). This is the
 * single place a model runs in the whole system (PRD §5).
 */
export class AnthropicJudge implements Judge {
  private readonly client: Anthropic;

  constructor(client?: Anthropic) {
    // Zero-arg construction resolves credentials from the environment (ANTHROPIC_API_KEY
    // or an `ant auth login` profile). Never hardcode a key.
    this.client = client ?? new Anthropic();
  }

  async judge(input: EscalationInput): Promise<TDivergence[]> {
    if (input.findings.length === 0) return [];

    const findingsList = input.findings
      .map((f, i) => `#${i} [${f.kind}] ${f.detail}`)
      .join("\n");

    const content: Anthropic.ContentBlockParam[] = [];
    if (input.cropBase64 && input.cropMediaType) {
      content.push({
        type: "image",
        source: {
          type: "base64",
          media_type: input.cropMediaType as "image/png" | "image/jpeg" | "image/gif" | "image/webp",
          data: input.cropBase64,
        },
      });
    }
    content.push({
      type: "text",
      text:
        `Component: ${input.component}\nMatrix cell: ${input.cellId}\n\n` +
        `Design intent:\n${input.intentSummary}\n\n` +
        `Candidate findings:\n${findingsList}`,
    });

    // `thinking: {type: "adaptive"}` and `output_config` are accepted by the API on
    // claude-opus-4-8 but aren't in this SDK version's request types yet — cast the body.
    const params = {
      model: MODEL,
      max_tokens: 16000,
      thinking: { type: "adaptive" },
      output_config: { effort: "high", format: { type: "json_schema", schema: VERDICT_SCHEMA } },
      system: SYSTEM,
      messages: [{ role: "user", content }],
    } as unknown as Anthropic.MessageCreateParamsNonStreaming;

    const response = await this.client.messages.create(params);
    return this.mapVerdicts(input, this.extractJson(response));
  }

  /** Pull the first text block and parse it as the structured verdict payload. */
  private extractJson(response: Anthropic.Message): { verdicts: unknown[] } {
    const text = response.content.find((b): b is Anthropic.TextBlock => b.type === "text")?.text;
    if (!text) throw new Error("escalation: model returned no text block");
    const parsed = JSON.parse(text) as { verdicts?: unknown[] };
    return { verdicts: parsed.verdicts ?? [] };
  }

  /** Merge model verdicts back onto the pass-1 findings, keeping kind/anchor authoritative. */
  private mapVerdicts(input: EscalationInput, payload: { verdicts: unknown[] }): TDivergence[] {
    const out: TDivergence[] = [];
    for (const raw of payload.verdicts) {
      const v = raw as { index: number; verdict: string; severity: string; confidence: number; detail?: string };
      const finding = input.findings[v.index];
      if (!finding) continue;
      out.push(
        Divergence.parse({
          cellId: input.cellId,
          anchorId: finding.anchorId,
          kind: finding.kind,
          detail: v.detail ?? finding.detail,
          severity: Severity.parse(v.severity),
          verdict: Verdict.parse(v.verdict),
          confidence: Math.max(0, Math.min(1, v.confidence)),
        }),
      );
    }
    return out;
  }
}
