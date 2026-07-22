import { z } from "zod";

/**
 * Token sync (Piece 2, PRD §6): keep Figma Variables and the app theme in lockstep.
 * The centerpiece rule: a token change produces ONLY a token diff — never a regenerated
 * component. Both sides normalize into the same flat TokenSet, diffed key-by-key.
 */

/** A resolved token value. Colors are normalized to lowercase #rrggbb[aa]. */
export const TokenValue = z.union([z.string(), z.number()]);
export type TokenValue = z.infer<typeof TokenValue>;

/** Flat map of token ref → value, e.g. { "color.bg.accent": "#2563eb" }. */
export const TokenSet = z.record(z.string(), TokenValue);
export type TokenSet = z.infer<typeof TokenSet>;

/** One entry in a token diff. */
export interface TokenChange {
  ref: string;
  kind: "added" | "removed" | "changed";
  /** Value on the design side (Figma). Absent for "removed". */
  design?: TokenValue;
  /** Value on the code side (theme). Absent for "added". */
  code?: TokenValue;
}

export interface TokenDiff {
  changes: TokenChange[];
  /** True when both sides agree completely. */
  inSync: boolean;
}
