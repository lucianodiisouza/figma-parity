import { describe, it, expect } from "vitest";
import {
  MVP_AXES,
  MVP_CELL_COUNT,
  MVP_CONTEXT,
  MVP_MATRIX,
  cellId,
  generateMatrix,
} from "../src/index.js";

describe("MVP matrix", () => {
  it("has exactly 8 cells (2×2×2)", () => {
    expect(MVP_MATRIX).toHaveLength(MVP_CELL_COUNT);
  });

  it("has 8 unique, stable cell ids", () => {
    const ids = MVP_MATRIX.map((c) => c.id);
    expect(new Set(ids).size).toBe(8);
    // ordering is deterministic: appearance → dynamicType → direction
    expect(ids).toEqual([
      "light.default.ltr",
      "light.default.rtl",
      "light.largest.ltr",
      "light.largest.rtl",
      "dark.default.ltr",
      "dark.default.rtl",
      "dark.largest.ltr",
      "dark.largest.rtl",
    ]);
  });

  it("stamps every cell with the fixed MVP context", () => {
    for (const cell of MVP_MATRIX) {
      expect(cell.platform).toBe(MVP_CONTEXT.platform);
      expect(cell.device).toBe(MVP_CONTEXT.device);
      expect(cell.locale).toBe(MVP_CONTEXT.locale);
    }
  });

  it("covers the full cartesian product of axes", () => {
    for (const appearance of MVP_AXES.appearance) {
      for (const dynamicType of MVP_AXES.dynamicType) {
        for (const direction of MVP_AXES.direction) {
          const id = cellId(appearance, dynamicType, direction);
          expect(MVP_MATRIX.find((c) => c.id === id)).toBeDefined();
        }
      }
    }
  });
});

describe("generateMatrix", () => {
  it("produces axisLengths product cells", () => {
    const cells = generateMatrix(
      { appearance: ["light"], dynamicType: ["default", "largest"], direction: ["ltr"] },
      MVP_CONTEXT,
    );
    expect(cells.map((c) => c.id)).toEqual(["light.default.ltr", "light.largest.ltr"]);
  });

  it("is empty when any axis is empty", () => {
    const cells = generateMatrix(
      { appearance: [], dynamicType: ["default"], direction: ["ltr"] },
      MVP_CONTEXT,
    );
    expect(cells).toHaveLength(0);
  });
});
