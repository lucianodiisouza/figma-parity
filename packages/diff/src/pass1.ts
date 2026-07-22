import type { IRDocument } from "@parity/ir";
import type { CellCapture } from "@parity/capture";
import type { CellOutcome } from "@parity/manifest";
import { phashDistance } from "./phash.js";
import { structuralDiff, type Pass1Finding } from "./structural.js";

/** Thresholds governing when pass 1 flags a cell for escalation. */
export interface Pass1Thresholds {
  /** pHash Hamming distance above which a cell is flagged even with no structural finding. */
  phashFlag: number;
}

export const DEFAULT_THRESHOLDS: Pass1Thresholds = {
  // Conservative default; the real value is tuned against the labeled set (Q-001, B9).
  phashFlag: 10,
};

export interface Pass1Result {
  outcome: CellOutcome;
  /** Candidate findings for escalated cells; pass 2 assigns intent/bug verdicts. */
  findings: Pass1Finding[];
}

/**
 * Deterministic first pass for one cell: structural diff + optional perceptual-hash
 * distance against per-cell intent. Produces a compact CellOutcome and the candidate
 * findings. NO model runs here. A cell is escalated iff it is flagged — "escalate,
 * don't stream": only flagged cells (and, downstream, only their crop) reach pass 2.
 */
export function pass1(
  ir: IRDocument,
  capture: CellCapture,
  opts: { referencePhash?: string; thresholds?: Pass1Thresholds } = {},
): Pass1Result {
  const thresholds = opts.thresholds ?? DEFAULT_THRESHOLDS;
  const findings = structuralDiff(ir, capture);
  const structuralDistance = findings.length;
  const phashDist =
    opts.referencePhash !== undefined
      ? phashDistance(capture.phash, opts.referencePhash)
      : 0;

  const flagged = structuralDistance > 0 || phashDist > thresholds.phashFlag;

  return {
    outcome: {
      cellId: capture.cellId,
      structuralDistance,
      phashDistance: phashDist,
      flagged,
      escalated: flagged,
    },
    findings: flagged ? findings : [],
  };
}
