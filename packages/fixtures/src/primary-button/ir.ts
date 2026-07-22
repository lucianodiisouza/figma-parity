import type { IRDocument } from "@parity/ir";

/**
 * The normalized IR extracted from the PrimaryButton's Figma frame — the design intent
 * the runtime capture is diffed against. Tokens are references, layout is auto-layout
 * intent (no absolute pixels). See docs/ir-schema.md.
 */
export const primaryButtonIR: IRDocument = {
  schemaVersion: 1,
  source: {
    figmaFileKey: "FIXTURE",
    figmaNodeId: "10:0",
    extractedAt: "2026-07-22T00:00:00Z",
  },
  root: {
    figmaNodeId: "10:0",
    anchorId: "cta.root",
    role: "button",
    name: "PrimaryButton",
    layout: {
      direction: "row",
      gap: 8,
      padding: { top: 12, right: 16, bottom: 12, left: 16 },
      align: "center",
      sizing: { width: "hug", height: "hug" },
    },
    style: {
      fill: "color.bg.accent",
      radius: "radius.md",
    },
    children: [
      {
        figmaNodeId: "10:1",
        anchorId: "cta.label",
        role: "text",
        name: "Label",
        style: { typography: "type.label.default", fill: "color.text.on-accent" },
        text: { raw: "Continue", maxLines: 1 },
        children: [],
      },
    ],
  },
};
