import {
  IR_SCHEMA_VERSION,
  type EdgeInsets,
  type IRDocument,
  type IRNode,
  type Layout,
  type NodeRole,
  type SizeMode,
  type StyleBindings,
  type TokenRef,
} from "@parity/ir";
import type { FigmaAxisAlign, FigmaNode, FigmaSizing } from "./figma-types.js";

export interface ExtractOptions {
  /**
   * Resolve a Figma variable id or style id to a design-token reference (e.g.
   * "color.bg.accent"). Figma gives us ids, not names; the caller supplies the map
   * (typically from the Variables API or the token-sync layer). Return undefined to omit.
   */
  tokenResolver?: (idOrStyleId: string) => TokenRef | undefined;
  /** Assign a durable anchor slot to a node (Phase 0: hand-authored map by Figma id). */
  anchorResolver?: (figmaNodeId: string) => string | undefined;
  /** Force the role of the root node (e.g. "button"), since Figma type alone is ambiguous. */
  rootRole?: NodeRole;
}

/** Map a Figma node type to a coarse semantic role. */
function roleForType(type: string): NodeRole {
  switch (type) {
    case "TEXT":
      return "text";
    case "VECTOR":
    case "STAR":
    case "LINE":
    case "ELLIPSE":
    case "REGULAR_POLYGON":
    case "BOOLEAN_OPERATION":
      return "icon";
    case "RECTANGLE":
      return "image";
    case "FRAME":
    case "GROUP":
    case "COMPONENT":
    case "COMPONENT_SET":
    case "INSTANCE":
      return "container";
    default:
      return "unknown";
  }
}

function alignFor(a: FigmaAxisAlign | undefined): Layout["align"] | undefined {
  switch (a) {
    case "MIN":
      return "start";
    case "CENTER":
      return "center";
    case "MAX":
      return "end";
    case "SPACE_BETWEEN":
      return "space-between";
    default:
      return undefined;
  }
}

function sizeMode(s: FigmaSizing | undefined, px: number | undefined): SizeMode | undefined {
  switch (s) {
    case "HUG":
      return "hug";
    case "FILL":
      return "fill";
    case "FIXED":
      return px !== undefined ? { fixed: px } : undefined;
    default:
      return undefined;
  }
}

function extractLayout(node: FigmaNode): Layout | undefined {
  const mode = node.layoutMode;
  if (!mode || mode === "NONE") {
    // Only emit layout when there is auto-layout intent to capture (rule #3, ir-schema.md).
    return undefined;
  }
  const padding: EdgeInsets | undefined =
    node.paddingTop ?? node.paddingRight ?? node.paddingBottom ?? node.paddingLeft
      ? {
          top: node.paddingTop ?? 0,
          right: node.paddingRight ?? 0,
          bottom: node.paddingBottom ?? 0,
          left: node.paddingLeft ?? 0,
        }
      : undefined;

  const width = sizeMode(node.layoutSizingHorizontal, node.absoluteBoundingBox?.width);
  const height = sizeMode(node.layoutSizingVertical, node.absoluteBoundingBox?.height);

  return {
    direction: mode === "HORIZONTAL" ? "row" : "column",
    gap: node.itemSpacing,
    padding,
    align: alignFor(node.primaryAxisAlignItems),
    sizing: width && height ? { width, height } : undefined,
  };
}

function extractStyle(node: FigmaNode, opts: ExtractOptions): StyleBindings | undefined {
  const resolve = opts.tokenResolver ?? (() => undefined);
  const fillVar = node.boundVariables?.fills?.[0]?.id;
  const strokeVar = node.boundVariables?.strokes?.[0]?.id;
  const radiusVar = node.boundVariables?.topLeftRadius?.id;
  const typographyStyleId = node.styles?.["text"];

  const style: StyleBindings = {};
  if (fillVar) style.fill = resolve(fillVar);
  else if (node.styles?.["fill"]) style.fill = resolve(node.styles["fill"]);
  if (strokeVar) style.stroke = resolve(strokeVar);
  if (radiusVar) style.radius = resolve(radiusVar);
  else if (node.cornerRadius !== undefined) style.radius = node.cornerRadius;
  if (typographyStyleId) style.typography = resolve(typographyStyleId);

  // Drop empty style objects so the IR stays lean.
  return Object.values(style).some((v) => v !== undefined) ? style : undefined;
}

function nodeToIR(node: FigmaNode, opts: ExtractOptions, isRoot: boolean): IRNode {
  const role = isRoot && opts.rootRole ? opts.rootRole : roleForType(node.type);
  const irNode: IRNode = {
    figmaNodeId: node.id,
    anchorId: opts.anchorResolver?.(node.id),
    role,
    name: node.name,
    layout: extractLayout(node),
    style: extractStyle(node, opts),
    children: (node.children ?? []).map((c) => nodeToIR(c, opts, false)),
  };
  if (role === "text" && node.characters !== undefined) {
    irNode.text = { raw: node.characters, maxLines: node.style?.maxLines };
  }
  return irNode;
}

/** Extract a normalized IR document from a Figma node (e.g. a REST `GET /files/:key/nodes` node). */
export function extractIR(
  node: FigmaNode,
  source: { figmaFileKey: string; extractedAt?: string },
  opts: ExtractOptions = {},
): IRDocument {
  return {
    schemaVersion: IR_SCHEMA_VERSION,
    source: {
      figmaFileKey: source.figmaFileKey,
      figmaNodeId: node.id,
      extractedAt: source.extractedAt ?? new Date().toISOString(),
    },
    root: nodeToIR(node, opts, true),
  };
}
