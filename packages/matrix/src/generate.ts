import type {
  Appearance,
  Direction,
  DynamicType,
  MatrixAxes,
  MatrixCell,
  MatrixContext,
} from "./types.js";

/** Deterministic cell id from the varying axes. */
export function cellId(
  appearance: Appearance,
  dynamicType: DynamicType,
  direction: Direction,
): string {
  return `${appearance}.${dynamicType}.${direction}`;
}

/**
 * Generate the cartesian product of the axes under a fixed context.
 *
 * Ordering is stable: appearance (outer) → dynamicType → direction (inner), so cell
 * order never shifts between runs — important for reproducible manifests and eval diffs.
 */
export function generateMatrix(
  axes: MatrixAxes,
  context: MatrixContext,
): MatrixCell[] {
  const cells: MatrixCell[] = [];
  for (const appearance of axes.appearance) {
    for (const dynamicType of axes.dynamicType) {
      for (const direction of axes.direction) {
        cells.push({
          id: cellId(appearance, dynamicType, direction),
          appearance,
          dynamicType,
          direction,
          ...context,
        });
      }
    }
  }
  return cells;
}
