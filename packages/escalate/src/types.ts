import type { Divergence } from "@parity/manifest";
import type { Pass1Finding } from "@parity/diff";

/**
 * Input to pass 2 for one escalated cell. Per the plane discipline, the model sees only
 * the failing CROP (~200px, base64) plus a compact intent summary and the pass-1 findings
 * — never the full frame or the whole matrix. See docs/architecture.md, PRD §5/§8.
 */
export interface EscalationInput {
  component: string;
  cellId: string;
  /** Deterministic pass-1 findings for this cell (kind + severity, pre-verdict). */
  findings: Pass1Finding[];
  /** Base64 of the failing crop. Omitted in dry-run (MockJudge ignores it). */
  cropBase64?: string;
  /** Media type of the crop, e.g. "image/png". */
  cropMediaType?: string;
  /** Compact, human-readable summary of the design intent for context (from the IR). */
  intentSummary: string;
}

/**
 * A Judge answers the one irreducibly fuzzy question (PRD §5): for each candidate
 * finding, is this an intentional un-drawn state, a real bug, or actually a match?
 * It returns full Divergences (verdict assigned), ready for the manifest.
 */
export interface Judge {
  judge(input: EscalationInput): Promise<Divergence[]>;
}
