/**
 * Normalized IR — the semantic skeleton of a Figma node.
 *
 * The contract every component speaks. See docs/ir-schema.md for the design rules.
 * Core invariants:
 *  1. Semantic, not visual — token *references*, never resolved hex/px.
 *  2. Stable IDs — figmaNodeId (volatile) + anchorId (durable slot to code).
 *  3. Layout as intent — auto-layout semantics, never absolute x/y pixels.
 *  4. Only what the diff needs.
 */

/** Current IR schema version. Bump on breaking shape changes. */
export const IR_SCHEMA_VERSION = 1 as const;

/** A reference to a design token, e.g. "color.bg.surface". Never a resolved value. */
export type TokenRef = string;

/** Semantic role of a node — deliberately coarser than Figma's node types. */
export type NodeRole =
  | "screen"
  | "container"
  | "text"
  | "image"
  | "icon"
  | "button"
  | "input"
  | "list"
  | "list-item"
  | "unknown";

/** Auto-layout sizing behaviour along one axis. */
export type SizeMode = "hug" | "fill" | { fixed: number };

export interface EdgeInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/** Auto-layout intent for a node. Absolute coordinates are intentionally absent. */
export interface Layout {
  direction: "row" | "column" | "none";
  gap?: number;
  padding?: EdgeInsets;
  align?: "start" | "center" | "end" | "stretch" | "space-between";
  sizing?: { width: SizeMode; height: SizeMode };
}

/** Style expressed only as token references (rule #1). */
export interface StyleBindings {
  fill?: TokenRef;
  stroke?: TokenRef;
  /** Radius may be a token or a raw number where no token applies. */
  radius?: TokenRef | number;
  typography?: TokenRef;
}

/** Text content for role === "text". */
export interface TextContent {
  /** Design-time string. The enumerator substitutes locales/long strings over this. */
  raw: string;
  maxLines?: number;
}

/** One node in the IR tree. */
export interface IRNode {
  /** Volatile Figma node id. Survives nothing but a no-op edit. */
  figmaNodeId: string;
  /** Durable binding slot to code (Piece 1 / anchors). Optional in the MVP. */
  anchorId?: string;
  role: NodeRole;
  name: string;
  layout?: Layout;
  style?: StyleBindings;
  /** Present iff role === "text". */
  text?: TextContent;
  children: IRNode[];
}

/** Provenance of an extracted document. */
export interface IRSource {
  figmaFileKey: string;
  figmaNodeId: string;
  /** ISO-8601 timestamp of extraction. */
  extractedAt: string;
}

/** One extracted screen/component tree — the unit the diff compares against. */
export interface IRDocument {
  schemaVersion: typeof IR_SCHEMA_VERSION;
  source: IRSource;
  root: IRNode;
}
