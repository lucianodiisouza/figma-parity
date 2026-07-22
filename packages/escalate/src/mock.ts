import type { Divergence, DivergenceKind, Verdict } from "@parity/manifest";
import type { EscalationInput, Judge } from "./types.js";

/**
 * Deterministic, rule-based judge — no model, no API key. It exists so the ENTIRE
 * pipeline and eval harness run headless (token-limited sessions can still make
 * progress), and so tests are reproducible. The rules encode a plausible-but-fixed
 * intent-vs-bug policy; the real signal comes from AnthropicJudge.
 *
 * Policy: truncation / missing-element / layout-shift / overflow read as bugs; RTL
 * mirroring and extra-element read as intent; everything else defaults to bug (precision
 * is the metric that matters, but the mock errs toward surfacing for eval visibility).
 */
const VERDICT_BY_KIND: Partial<Record<DivergenceKind, Verdict>> = {
  truncation: "bug",
  overflow: "bug",
  "missing-element": "bug",
  "layout-shift": "bug",
  "safe-area-inset": "bug",
  "token-mismatch": "bug",
  contrast: "bug",
  "rtl-mirroring": "intent",
  "extra-element": "intent",
};

export class MockJudge implements Judge {
  // eslint-disable-next-line @typescript-eslint/require-await
  async judge(input: EscalationInput): Promise<Divergence[]> {
    return input.findings.map((f) => ({
      cellId: input.cellId,
      anchorId: f.anchorId,
      kind: f.kind,
      detail: f.detail,
      severity: f.severity,
      verdict: VERDICT_BY_KIND[f.kind] ?? "bug",
      confidence: 1,
    }));
  }
}
