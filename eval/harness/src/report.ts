import type { EvalReport } from "./evaluate.js";

function pct(n: number): string {
  return Number.isNaN(n) ? "n/a" : `${(n * 100).toFixed(1)}%`;
}

/**
 * Render the eval as a human report. The false-positive rate is the headline — it is the
 * number that decides viability (PRD §7). `threshold` optionally marks pass/fail against
 * the "keep it on" bar (open-question Q-001, set during labeling).
 */
export function renderEvalReport(r: EvalReport, threshold?: number): string {
  const lines: string[] = [];
  lines.push(`Eval — ${r.component}  (${r.total} labeled cells)`);
  lines.push("");
  lines.push(`False-positive rate: ${pct(r.falsePositiveRate)}   ← the number that decides viability`);
  lines.push(`Precision:           ${pct(r.precision)}`);
  lines.push(`Recall:              ${pct(r.recall)}`);
  lines.push(`Confusion: TP=${r.truePositives} FP=${r.falsePositives} TN=${r.trueNegatives} FN=${r.falseNegatives}`);

  if (threshold !== undefined && !Number.isNaN(r.falsePositiveRate)) {
    const verdict = r.falsePositiveRate <= threshold ? "PASS" : "FAIL";
    lines.push("");
    lines.push(`Gate (FP ≤ ${pct(threshold)}): ${verdict}`);
  }

  if (r.falsePositiveCells.length > 0) {
    lines.push("");
    lines.push(`False positives (inspect these crops): ${r.falsePositiveCells.join(", ")}`);
  }
  if (r.falseNegativeCells.length > 0) {
    lines.push(`Missed bugs: ${r.falseNegativeCells.join(", ")}`);
  }

  return lines.join("\n");
}
