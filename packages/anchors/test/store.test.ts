import { describe, it, expect } from "vitest";
import { primaryButtonIR } from "@parity/fixtures";
import { AnchorStore, type AnchorStoreFile } from "../src/index.js";

const file: AnchorStoreFile = {
  schemaVersion: 1,
  figmaFileKey: "FIXTURE",
  anchors: [
    { anchorId: "cta.root", figmaNodeId: "10:0", code: { component: "PrimaryButton" } },
    { anchorId: "cta.label", figmaNodeId: "10:1", code: { component: "PrimaryButton", part: "label" } },
    { anchorId: "cta.spinner", figmaNodeId: "10:2", code: { component: "PrimaryButton", part: "spinner" } },
  ],
};

describe("AnchorStore", () => {
  it("queries both directions of the boundary", () => {
    const store = AnchorStore.fromFile(file);
    expect(store.get("cta.label")?.code.part).toBe("label");
    expect(store.getByFigmaId("10:0")?.anchorId).toBe("cta.root");
    expect(store.get("nope")).toBeUndefined();
  });

  it("rejects duplicate slot ids", () => {
    const dup = { ...file, anchors: [...file.anchors, file.anchors[0]!] };
    expect(() => AnchorStore.fromFile(dup)).toThrow(/duplicate/);
  });

  it("serves as the extractor's anchorResolver", () => {
    const resolve = AnchorStore.fromFile(file).anchorResolver();
    expect(resolve("10:1")).toBe("cta.label");
    expect(resolve("99:9")).toBeUndefined();
  });

  it("validates cleanly against the fixture IR (spinner is stale by design)", () => {
    const store = AnchorStore.fromFile(file);
    const { staleAnchors, unanchoredNodes } = store.validateAgainst(primaryButtonIR);
    // The IR frame doesn't depict the loading state, so cta.spinner's node is absent —
    // exactly the "state nobody drew" situation; the anchor is still valid for code.
    expect(staleAnchors).toEqual(["cta.spinner"]);
    expect(unanchoredNodes).toEqual([]);
  });

  it("detects drift both ways and supports re-pointing", () => {
    const store = AnchorStore.fromFile(file);
    // Design restructure: the label's Figma node id changed 10:1 → 20:5.
    store.repointFigma("cta.label", "20:5");
    expect(store.getByFigmaId("20:5")?.anchorId).toBe("cta.label");
    expect(store.getByFigmaId("10:1")).toBeUndefined();
    // The old id is now stale relative to the fixture IR (which still uses 10:1).
    const { staleAnchors } = store.validateAgainst(primaryButtonIR);
    expect(staleAnchors).toContain("cta.label");
  });
});
