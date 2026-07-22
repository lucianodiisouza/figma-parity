/**
 * Hand-authored anchor map for the fixture (Phase 0 uses hand-authored anchors — no
 * inference). Maps a durable anchor slot → the Figma node id and the code binding. In
 * Phase 2 this graduates into the in-repo anchor store; here it is inline and typed.
 */
export interface AnchorEntry {
  /** Durable slot id, stable across refactors and design restructures. */
  anchorId: string;
  /** Volatile Figma node id at extraction time. */
  figmaNodeId: string;
  /** Code binding — component and optional prop/sub-element. */
  code: { component: string; part?: string };
}

export const primaryButtonAnchors: AnchorEntry[] = [
  { anchorId: "cta.root", figmaNodeId: "10:0", code: { component: "PrimaryButton" } },
  { anchorId: "cta.label", figmaNodeId: "10:1", code: { component: "PrimaryButton", part: "label" } },
  { anchorId: "cta.spinner", figmaNodeId: "10:2", code: { component: "PrimaryButton", part: "spinner" } },
];
