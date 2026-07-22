import { z } from "zod";
import { Handle } from "./handle.js";

/**
 * Classes of divergence the harness reports — many of them things Figma literally
 * cannot represent (PRD §3, §6). Open-ended: `other` carries a free-text kind so a
 * novel finding is never lost, but known kinds stay enumerable for reporting.
 */
export const DivergenceKind = z.enum([
  "safe-area-inset", // e.g. "CTA sits 4px low — dropped safe-area inset"
  "truncation", // e.g. "label truncates at largest dynamic type"
  "overflow",
  "token-mismatch", // resolved value diverges from the design token
  "layout-shift", // structural position/order differs from intent
  "missing-element",
  "extra-element",
  "contrast", // e.g. dark-mode legibility
  "rtl-mirroring",
  "other",
]);
export type DivergenceKind = z.infer<typeof DivergenceKind>;

/** Severity of a confirmed divergence. Precision-first: we'd rather under-report. */
export const Severity = z.enum(["critical", "major", "minor"]);
export type Severity = z.infer<typeof Severity>;

/**
 * The pass-2 (LLM) judgment on a failing cell: is this mismatch the design's *intent*
 * (a state the designer legitimately never drew) or a *bug*? Only bugs are actionable
 * divergences; intent findings feed coverage, not the false-positive count.
 */
export const Verdict = z.enum(["bug", "intent", "match"]);
export type Verdict = z.infer<typeof Verdict>;

/** One reported divergence, anchored to where it occurred. */
export const Divergence = z.object({
  /** Which matrix cell surfaced it, e.g. "dark.largest.rtl". */
  cellId: z.string().min(1),
  /** Durable code binding if known (Piece 1). */
  anchorId: z.string().optional(),
  kind: DivergenceKind,
  /** Free-text detail when kind === "other", or extra context otherwise. */
  detail: z.string().optional(),
  severity: Severity,
  verdict: Verdict,
  /** The failing crop that was (or would be) escalated — never a full frame. */
  crop: Handle.optional(),
  /** Model confidence in the verdict, 0..1, present only for escalated cells. */
  confidence: z.number().min(0).max(1).optional(),
});
export type Divergence = z.infer<typeof Divergence>;
