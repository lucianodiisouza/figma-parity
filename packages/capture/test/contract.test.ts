import { describe, it, expect } from "vitest";
import type { CellCapture } from "../src/index.js";

// The capture package is types-only (a shared contract). This test simply pins the
// shape so an accidental breaking change to the renderer↔diff contract fails loudly.
describe("CellCapture contract", () => {
  it("accepts a well-formed capture", () => {
    const c: CellCapture = {
      cellId: "light.default.ltr",
      frame: { hash: "abc", kind: "frame", width: 390, height: 844 },
      phash: "0f0f0f0f",
      tree: {
        anchorId: "cta.root",
        role: "button",
        children: [
          { anchorId: "cta.label", role: "text", text: { raw: "Go", truncated: false, lines: 1 }, children: [] },
        ],
      },
    };
    expect(c.tree.children[0]?.anchorId).toBe("cta.label");
  });
});
