# Normalized IR schema (draft)

The **contract everything speaks** (PRD §8, [architecture.md](architecture.md)). The IR is
the semantic skeleton of a Figma node — layout, tokens, hierarchy, bindings — with raw
Figma JSON stripped out. Goal: ~1 order of magnitude smaller than source, stable across
cosmetic Figma edits, and diffable.

**Status:** Draft — resolves part of open-question Q-003. Ratify before Epic 0.4.

## Design rules

1. **Semantic, not visual.** Store `token: "color.bg.surface"`, never `#FFFFFF`. Resolved
   values belong to the theme, not the IR — that's what makes token drift detectable.
2. **Stable IDs.** Every node carries its Figma node ID *and* a stable anchor slot, so a
   node survives rename/reorder without breaking the diff.
3. **Layout as intent, not pixels.** Capture auto-layout semantics (direction, gap, padding,
   alignment, sizing mode) — not absolute x/y. Absolute coordinates don't survive a device
   size change and would generate false positives.
4. **Only what the diff needs.** If a field can't change the answer to "does the app match
   intent?", it doesn't belong in the IR.

## Shape (illustrative TypeScript)

```ts
/** One extracted screen/component tree. */
interface IRDocument {
  schemaVersion: 1;
  source: { figmaFileKey: string; figmaNodeId: string; extractedAt: string };
  root: IRNode;
}

interface IRNode {
  figmaNodeId: string;
  anchorId?: string;          // stable binding slot → code (Piece 1). Optional in MVP.
  role: NodeRole;             // semantic role, not Figma type
  name: string;

  layout?: Layout;            // auto-layout intent
  style?: StyleBindings;      // token references, never resolved values
  text?: TextContent;         // present iff role === "text"
  children: IRNode[];
}

type NodeRole =
  | "screen" | "container" | "text" | "image" | "icon"
  | "button" | "input" | "list" | "list-item" | "unknown";

interface Layout {
  direction: "row" | "column" | "none";
  gap?: number;
  padding?: { top: number; right: number; bottom: number; left: number };
  align?: "start" | "center" | "end" | "stretch" | "space-between";
  sizing?: { width: SizeMode; height: SizeMode };  // "hug" | "fill" | "fixed"
}
type SizeMode = "hug" | "fill" | { fixed: number };

interface StyleBindings {
  fill?: TokenRef;            // e.g. "color.bg.surface"
  stroke?: TokenRef;
  radius?: TokenRef | number;
  typography?: TokenRef;      // e.g. "type.body.default"
  // resolved values deliberately absent — see rule #1
}
type TokenRef = string;

interface TextContent {
  raw: string;                // design-time string; note truncation risk at largest type
  maxLines?: number;
  // i18n: the enumerator (Piece 4) substitutes long-string locales over this
}
```

## What is deliberately excluded

- Absolute x/y/width/height in pixels (rule #3 — device-size-fragile).
- Resolved color hex / font px (rule #1 — lives in the theme).
- Figma-only metadata: component-set variants noise, plugin data, export settings, effects
  the diff can't judge (revisit if a real divergence needs one).

## How each consumer uses it

| Consumer | Uses |
|----------|------|
| **Diff pass 1 (structural)** | Compares captured runtime layout tree vs `IRNode` tree by role + layout + token refs. |
| **Token sync (Piece 2)** | `StyleBindings.*` TokenRefs are the join key to `theme.ts`. |
| **Anchors (Piece 1)** | `anchorId` is the durable slot; `figmaNodeId` is the volatile one. |
| **Enumeration (Piece 4)** | `text.raw` + `role` seed loading/empty/error/long-string variants. |

## Open sub-questions

- Does "design intent" = IR alone, or IR + an annotated reference frame? (Q-003) The IR
  covers structure/tokens; it does **not** encode "the CTA should clear the safe-area
  inset." That kind of runtime assertion may need an annotation layer on top of the IR.
- Anchor-slot granularity: per-node, or only per-binding-point? (feeds Q-002, Phase 2)
