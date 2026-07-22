import { DivergenceManifest, LabelSet, type DivergenceManifest as TManifest } from "@parity/manifest";
import { evaluate, type EvalReport } from "@parity/eval-harness";

/**
 * Pure control-plane operations exposed over MCP. Everything here takes and returns
 * MANIFESTS and REPORTS only — kilobytes, never pixels (PRD §5/§8). Keeping the logic
 * here (not inline in the server) makes it unit-testable without an MCP transport.
 */

/** The compact summary that crosses the agent boundary — the canonical kilobyte payload. */
export interface ManifestSummary {
  component: string;
  coverage: string | null; // "3/19" or null
  cells: number;
  flagged: number;
  mismatches: number;
  bugs: { cellId: string; anchorId?: string; kind: string; severity: string }[];
}

/** Reduce a full manifest to the summary an agent should see. Validates input first. */
export function summarizeManifest(input: unknown): ManifestSummary {
  const m: TManifest = DivergenceManifest.parse(input);
  return {
    component: m.component,
    coverage: m.coverage ? `${m.coverage.covered}/${m.coverage.total}` : null,
    cells: m.cells.length,
    flagged: m.cells.filter((c) => c.flagged).length,
    mismatches: m.mismatches,
    bugs: m.divergences
      .filter((d) => d.verdict === "bug")
      .map((d) => ({ cellId: d.cellId, anchorId: d.anchorId, kind: d.kind, severity: d.severity })),
  };
}

/** Evaluate a manifest against a labeled set → the false-positive-rate report. */
export function evaluateManifest(input: { manifest: unknown; labels: unknown }): EvalReport {
  const manifest = DivergenceManifest.parse(input.manifest);
  const labels = LabelSet.parse(input.labels);
  return evaluate(manifest, labels);
}
