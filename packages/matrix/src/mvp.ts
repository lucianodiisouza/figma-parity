import { generateMatrix } from "./generate.js";
import type { MatrixAxes, MatrixCell, MatrixContext } from "./types.js";

/**
 * The reduced MVP matrix axes: light/dark × default/largest dynamic type × LTR/RTL.
 * = 2 × 2 × 2 = 8 cells. See docs/matrix.md for why exactly these three.
 */
export const MVP_AXES: MatrixAxes = {
  appearance: ["light", "dark"],
  dynamicType: ["default", "largest"],
  direction: ["ltr", "rtl"],
};

/** Fixed context for the MVP — iOS simulator, one device, EN locale. */
export const MVP_CONTEXT: MatrixContext = {
  platform: "ios",
  device: "iPhone 15",
  locale: "en",
};

/** The concrete 8-cell MVP matrix. */
export const MVP_MATRIX: MatrixCell[] = generateMatrix(MVP_AXES, MVP_CONTEXT);

/** Expected MVP cell count — asserted in tests to catch accidental axis edits. */
export const MVP_CELL_COUNT = 8 as const;
