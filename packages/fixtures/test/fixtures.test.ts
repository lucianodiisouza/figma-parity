import { describe, it, expect } from "vitest";
import { findByAnchor } from "@parity/ir";
import { LabelSet, isBug } from "@parity/manifest";
import {
  primaryButtonAnchors,
  primaryButtonIR,
  primaryButtonLabels,
} from "../src/index.js";
import { MVP_MATRIX } from "@parity/matrix";

describe("PrimaryButton fixture", () => {
  it("IR is anchored and reachable by anchor slot", () => {
    expect(findByAnchor(primaryButtonIR, "cta.root")?.role).toBe("button");
    expect(findByAnchor(primaryButtonIR, "cta.label")?.text?.raw).toBe("Continue");
  });

  it("every IR anchor has a matching anchor-map entry", () => {
    const mapped = new Set(primaryButtonAnchors.map((a) => a.anchorId));
    for (const anchorId of ["cta.root", "cta.label"]) {
      expect(mapped.has(anchorId)).toBe(true);
    }
  });

  it("labels validate and cover exactly the 8 MVP cells", () => {
    expect(() => LabelSet.parse(primaryButtonLabels)).not.toThrow();
    const labelled = new Set(primaryButtonLabels.cases.map((c) => c.cellId));
    const cells = new Set(MVP_MATRIX.map((c) => c.id));
    expect(labelled).toEqual(cells);
  });

  it("has a mix of match / intent / bug for a meaningful eval", () => {
    const bugs = primaryButtonLabels.cases.filter((c) => isBug(c.truth)).length;
    const nonBugs = primaryButtonLabels.cases.length - bugs;
    expect(bugs).toBeGreaterThan(0);
    expect(nonBugs).toBeGreaterThan(0);
  });
});
