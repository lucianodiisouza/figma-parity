import { isBug, type DivergenceManifest, type LabelSet } from "@parity/manifest";

/**
 * The Phase 0 gate. Compares the tool's verdicts against a human-labeled ground-truth set
 * and computes the number that decides whether the product exists: the false-positive rate
 * (PRD §7, §9). Precision is primary; recall is secondary.
 *
 * Per cell:
 *   toolSaysBug = the manifest carries a `bug` divergence for that cell.
 *   truthIsBug  = the label is `divergence:bug`.
 * A false positive is toolSaysBug on a cell whose truth is NOT a bug (match / intent).
 */
export interface EvalReport {
  component: string;
  /** Cells evaluated (present in both manifest cells and the label set). */
  total: number;
  truePositives: number;
  falsePositives: number;
  trueNegatives: number;
  falseNegatives: number;
  /** FP / (FP + TN) — over non-bug cells. THE metric. NaN if there are no non-bug cells. */
  falsePositiveRate: number;
  /** TP / (TP + FP). NaN if the tool flagged nothing. */
  precision: number;
  /** TP / (TP + FN). NaN if there are no real bugs. */
  recall: number;
  /** Cells the tool wrongly called bugs — the crops to inspect when tuning. */
  falsePositiveCells: string[];
  /** Real bugs the tool missed. */
  falseNegativeCells: string[];
}

function safeDiv(numerator: number, denominator: number): number {
  return denominator === 0 ? Number.NaN : numerator / denominator;
}

export function evaluate(manifest: DivergenceManifest, labels: LabelSet): EvalReport {
  // Which cells did the tool call a bug?
  const toolBugCells = new Set(
    manifest.divergences.filter((d) => d.verdict === "bug").map((d) => d.cellId),
  );

  let tp = 0;
  let fp = 0;
  let tn = 0;
  let fn = 0;
  const falsePositiveCells: string[] = [];
  const falseNegativeCells: string[] = [];

  for (const c of labels.cases) {
    if (c.component !== manifest.component) continue;
    const toolSaysBug = toolBugCells.has(c.cellId);
    const truthIsBug = isBug(c.truth);

    if (toolSaysBug && truthIsBug) tp++;
    else if (toolSaysBug && !truthIsBug) {
      fp++;
      falsePositiveCells.push(c.cellId);
    } else if (!toolSaysBug && truthIsBug) {
      fn++;
      falseNegativeCells.push(c.cellId);
    } else {
      tn++;
    }
  }

  return {
    component: manifest.component,
    total: tp + fp + tn + fn,
    truePositives: tp,
    falsePositives: fp,
    trueNegatives: tn,
    falseNegatives: fn,
    falsePositiveRate: safeDiv(fp, fp + tn),
    precision: safeDiv(tp, tp + fp),
    recall: safeDiv(tp, tp + fn),
    falsePositiveCells,
    falseNegativeCells,
  };
}
