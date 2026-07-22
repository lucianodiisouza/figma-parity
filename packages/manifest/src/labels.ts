import { z } from "zod";

/**
 * Ground-truth labels for the eval harness (Phase 0 gate). A human labels each rendered
 * (component, cell) case as one of three truths; the harness compares the tool's verdict
 * against these to compute the false-positive rate. See docs/phase-0-mvp.md.
 *
 *  - "match"              → app matches intent; tool should stay silent.
 *  - "divergence:intent"  → differs, but a legitimate un-drawn state; tool must NOT call it a bug.
 *  - "divergence:bug"     → a real defect; tool SHOULD catch it (recall).
 *
 * A false positive = tool says "bug" on a case labeled "match" or "divergence:intent".
 * That is the number that decides viability (PRD §7, §9).
 */
export const GroundTruth = z.enum(["match", "divergence:intent", "divergence:bug"]);
export type GroundTruth = z.infer<typeof GroundTruth>;

export const LabeledCase = z.object({
  component: z.string().min(1),
  cellId: z.string().min(1),
  truth: GroundTruth,
  /** Optional human note on why this label — invaluable when tuning the diff. */
  note: z.string().optional(),
});
export type LabeledCase = z.infer<typeof LabeledCase>;

export const LabelSet = z.object({
  schemaVersion: z.literal(1),
  cases: z.array(LabeledCase),
});
export type LabelSet = z.infer<typeof LabelSet>;

/** Whether a ground-truth label represents an actionable bug. */
export function isBug(truth: GroundTruth): boolean {
  return truth === "divergence:bug";
}
