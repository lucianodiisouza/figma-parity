import { describe, it, expect } from "vitest";
import { findByAnchor, walk } from "@parity/ir";
import { extractIR, type FigmaNode } from "../src/index.js";

// A realistic Figma REST `document` for an auto-layout button with a text child.
const figmaButton: FigmaNode = {
  id: "10:0",
  name: "PrimaryButton",
  type: "COMPONENT",
  layoutMode: "HORIZONTAL",
  itemSpacing: 8,
  paddingTop: 12,
  paddingRight: 16,
  paddingBottom: 12,
  paddingLeft: 16,
  primaryAxisAlignItems: "CENTER",
  layoutSizingHorizontal: "HUG",
  layoutSizingVertical: "HUG",
  cornerRadius: 8,
  boundVariables: { fills: [{ type: "VARIABLE_ALIAS", id: "VariableID:1:2" }] },
  children: [
    {
      id: "10:1",
      name: "Label",
      type: "TEXT",
      characters: "Continue",
      style: { maxLines: 1 },
      styles: { text: "S:typography-label" },
      boundVariables: { fills: [{ type: "VARIABLE_ALIAS", id: "VariableID:3:4" }] },
    },
  ],
};

// Caller-supplied token map (Figma gives ids, not names).
const tokenResolver = (id: string): string | undefined =>
  ({
    "VariableID:1:2": "color.bg.accent",
    "VariableID:3:4": "color.text.on-accent",
    "S:typography-label": "type.label.default",
  })[id];

const anchorResolver = (figmaId: string): string | undefined =>
  ({ "10:0": "cta.root", "10:1": "cta.label" })[figmaId];

describe("extractIR", () => {
  const ir = extractIR(
    figmaButton,
    { figmaFileKey: "FILE123", extractedAt: "2026-07-22T00:00:00Z" },
    { tokenResolver, anchorResolver, rootRole: "button" },
  );

  it("maps the root with the forced role and provenance", () => {
    expect(ir.source.figmaFileKey).toBe("FILE123");
    expect(ir.root.role).toBe("button");
    expect(ir.root.figmaNodeId).toBe("10:0");
  });

  it("maps auto-layout to layout intent (no absolute pixels)", () => {
    expect(ir.root.layout).toEqual({
      direction: "row",
      gap: 8,
      padding: { top: 12, right: 16, bottom: 12, left: 16 },
      align: "center",
      sizing: { width: "hug", height: "hug" },
    });
  });

  it("resolves bound variables and styles to token references", () => {
    expect(ir.root.style?.fill).toBe("color.bg.accent");
    expect(ir.root.style?.radius).toBe(8); // no radius variable → raw number
    const label = findByAnchor(ir, "cta.label")!;
    expect(label.style?.fill).toBe("color.text.on-accent");
    expect(label.style?.typography).toBe("type.label.default");
  });

  it("extracts text content and durable anchors", () => {
    const label = findByAnchor(ir, "cta.label")!;
    expect(label.role).toBe("text");
    expect(label.text).toEqual({ raw: "Continue", maxLines: 1 });
    expect(findByAnchor(ir, "cta.root")?.name).toBe("PrimaryButton");
  });

  it("never emits absolute coordinates in the IR", () => {
    const serialized = JSON.stringify(ir);
    expect(serialized).not.toContain("absoluteBoundingBox");
    expect(serialized).not.toContain("\"x\":");
  });

  it("omits layout when there is no auto-layout intent", () => {
    const plain = extractIR({ id: "1", name: "n", type: "FRAME" }, { figmaFileKey: "F" });
    expect([...walk(plain.root)][0]?.layout).toBeUndefined();
  });
});
