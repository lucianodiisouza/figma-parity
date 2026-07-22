import { describe, it, expect } from "vitest";
import {
  IR_SCHEMA_VERSION,
  countNodes,
  findByAnchor,
  findByFigmaId,
  nodes,
  walk,
  type IRDocument,
  type IRNode,
} from "../src/index.js";

const leaf = (id: string, extra: Partial<IRNode> = {}): IRNode => ({
  figmaNodeId: id,
  role: "text",
  name: id,
  children: [],
  ...extra,
});

const doc: IRDocument = {
  schemaVersion: IR_SCHEMA_VERSION,
  source: { figmaFileKey: "F", figmaNodeId: "0:1", extractedAt: "2026-07-22T00:00:00Z" },
  root: {
    figmaNodeId: "0:1",
    anchorId: "screen.root",
    role: "screen",
    name: "Screen",
    children: [
      leaf("1:1", { anchorId: "cta.label", text: { raw: "Continue" } }),
      {
        figmaNodeId: "1:2",
        role: "container",
        name: "Row",
        children: [leaf("2:1"), leaf("2:2")],
      },
    ],
  },
};

describe("walk / nodes", () => {
  it("visits every node pre-order (root first)", () => {
    const ids = nodes(doc).map((n) => n.figmaNodeId);
    expect(ids).toEqual(["0:1", "1:1", "1:2", "2:1", "2:2"]);
  });

  it("countNodes counts the subtree including itself", () => {
    expect(countNodes(doc.root)).toBe(5);
    const row = [...walk(doc.root)].find((n) => n.name === "Row")!;
    expect(countNodes(row)).toBe(3);
  });
});

describe("lookup helpers", () => {
  it("finds by durable anchor slot", () => {
    expect(findByAnchor(doc, "cta.label")?.figmaNodeId).toBe("1:1");
    expect(findByAnchor(doc, "missing")).toBeUndefined();
  });

  it("finds by volatile figma id", () => {
    expect(findByFigmaId(doc, "2:2")?.name).toBe("2:2");
  });
});
