import { describe, it, expect } from "vitest";
import {
  primaryButtonDesignedStates,
  primaryButtonStateSpace,
} from "@parity/fixtures";
import { coverage, enumerateStates, type StateSpace } from "../src/index.js";

describe("enumerateStates", () => {
  it("expands the cartesian product with stable ordering and ids", () => {
    const space: StateSpace = {
      component: "X",
      axes: [
        { name: "a", values: ["1", "2"] },
        { name: "b", values: ["x", "y"] },
      ],
    };
    expect(enumerateStates(space).map((s) => s.id)).toEqual([
      "1.x",
      "1.y",
      "2.x",
      "2.y",
    ]);
  });

  it("applies constraints to remove unreachable states", () => {
    const space: StateSpace = {
      component: "X",
      axes: [
        { name: "a", values: ["1", "2"] },
        { name: "b", values: ["x", "y"] },
      ],
      constraints: [(s) => !(s["a"] === "2" && s["b"] === "y")],
    };
    expect(enumerateStates(space)).toHaveLength(3);
  });

  it("returns empty for an empty axis list", () => {
    expect(enumerateStates({ component: "X", axes: [] })).toEqual([]);
  });
});

describe("PrimaryButton state space (the demo piece)", () => {
  it("enumerates 14 realistic states (3×3×2 minus 4 unreachable loading combos)", () => {
    const states = enumerateStates(primaryButtonStateSpace);
    // 3 interaction × 3 content × 2 direction = 18, minus loading×{long,overflow}×{ltr,rtl} = 4
    expect(states).toHaveLength(14);
    const ids = states.map((s) => s.id);
    expect(ids).toContain("default.overflow.rtl");
    expect(ids).not.toContain("loading.long.ltr"); // unreachable by constraint
  });

  it("reports design coverage — the pitch number", () => {
    const report = coverage(primaryButtonStateSpace, {
      coveredStateIds: primaryButtonDesignedStates,
    });
    expect(report.headline).toBe("3/14");
    expect(report.covered).toBe(3);
    expect(report.uncoveredStates).toHaveLength(11);
    expect(report.unknownIds).toEqual([]);
    // the un-drawn states include exactly the classes of bug the harness hunts
    expect(report.uncoveredStates.map((s) => s.id)).toContain("default.overflow.ltr");
  });

  it("surfaces claimed-covered ids that don't exist (labeling mistakes)", () => {
    const report = coverage(primaryButtonStateSpace, {
      coveredStateIds: ["default.short.ltr", "loading.overflow.ltr"],
    });
    expect(report.unknownIds).toEqual(["loading.overflow.ltr"]);
    expect(report.covered).toBe(1);
  });
});
