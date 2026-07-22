/**
 * Runtime matrix types. See docs/matrix.md.
 *
 * A `MatrixCell` is one concrete rendering configuration. The MVP fixes platform,
 * device, and locale, and varies the three axes that each expose a class of divergence
 * Figma cannot represent: appearance, dynamic type, and text direction.
 */

export type Appearance = "light" | "dark";
export type DynamicType = "default" | "largest";
export type Direction = "ltr" | "rtl";
export type Platform = "ios" | "android";

/** The axes that vary in the MVP. Fixed context lives on the cell but isn't permuted. */
export interface MatrixAxes {
  appearance: readonly Appearance[];
  dynamicType: readonly DynamicType[];
  direction: readonly Direction[];
}

/** Context held constant across a matrix in the MVP (varied only in Phase 4). */
export interface MatrixContext {
  platform: Platform;
  /** e.g. "iPhone 15". */
  device: string;
  /** e.g. "en". */
  locale: string;
}

/** One point in the matrix — a fully-specified rendering configuration. */
export interface MatrixCell extends MatrixContext {
  /** Stable id derived from the varying axes, e.g. "dark.largest.rtl". */
  id: string;
  appearance: Appearance;
  dynamicType: DynamicType;
  direction: Direction;
}
