import type { IRDocument } from "@parity/ir";
import type { CellCapture } from "@parity/capture";
import { pass1, type Pass1Thresholds } from "@parity/diff";
import { buildManifest, type Coverage, type DivergenceManifest } from "@parity/manifest";
import type { Judge } from "@parity/escalate";
import { summarizeIntent } from "./summarize.js";

/** Supplies the failing crop (base64) for an escalated cell, from the data-plane store. */
export type CropProvider = (
  cellId: string,
) => Promise<{ base64: string; mediaType: string } | undefined>;

export interface RunParityOptions {
  component: string;
  ir: IRDocument;
  captures: CellCapture[];
  judge: Judge;
  /** Per-cell intent perceptual hash, if available. Enables the pHash pass-1 signal. */
  referencePhash?: Record<string, string>;
  /** Fetches the crop for escalated cells. Omit for dry-run (no image reaches the model). */
  cropProvider?: CropProvider;
  thresholds?: Pass1Thresholds;
  coverage?: Coverage;
  /** ISO timestamp for the run; defaults to now. Injectable for reproducible tests. */
  ranAt?: string;
}

/**
 * Orchestrates one parity run end-to-end:
 *   pass 1 (deterministic) per cell → escalate only flagged cells → pass 2 (judge) on the
 *   crop → aggregate into a kilobyte manifest. This is the control-plane assembly; the
 *   heavy render/capture already happened in the data plane (captures are inputs here).
 */
export async function runParity(opts: RunParityOptions): Promise<DivergenceManifest> {
  const intentSummary = summarizeIntent(opts.ir);
  const cellOutcomes = [];
  const divergences = [];

  for (const capture of opts.captures) {
    const { outcome, findings } = pass1(opts.ir, capture, {
      referencePhash: opts.referencePhash?.[capture.cellId],
      thresholds: opts.thresholds,
    });
    cellOutcomes.push(outcome);

    if (outcome.escalated && findings.length > 0) {
      const crop = await opts.cropProvider?.(capture.cellId);
      const judged = await opts.judge.judge({
        component: opts.component,
        cellId: capture.cellId,
        findings,
        cropBase64: crop?.base64,
        cropMediaType: crop?.mediaType,
        intentSummary,
      });
      divergences.push(...judged);
    }
  }

  return buildManifest({
    component: opts.component,
    ranAt: opts.ranAt ?? new Date().toISOString(),
    cells: cellOutcomes,
    divergences,
    coverage: opts.coverage,
  });
}
