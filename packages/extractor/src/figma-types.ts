/**
 * The minimal subset of the Figma REST node shape we consume. Figma nodes carry far more;
 * we deliberately read only what maps to the IR's semantic skeleton (layout, tokens,
 * hierarchy) — the normalization step that drops ~an order of magnitude (PRD §8).
 */

export type FigmaNodeType =
  | "DOCUMENT" | "CANVAS" | "FRAME" | "GROUP" | "COMPONENT" | "COMPONENT_SET"
  | "INSTANCE" | "TEXT" | "RECTANGLE" | "VECTOR" | "ELLIPSE" | "LINE"
  | "STAR" | "REGULAR_POLYGON" | "BOOLEAN_OPERATION" | string;

export type FigmaLayoutMode = "NONE" | "HORIZONTAL" | "VERTICAL";
export type FigmaAxisAlign = "MIN" | "CENTER" | "MAX" | "SPACE_BETWEEN";
export type FigmaSizing = "FIXED" | "HUG" | "FILL";

/** A bound variable reference (Figma Variables → design tokens). */
export interface FigmaVariableAlias {
  type: "VARIABLE_ALIAS";
  id: string;
}

export interface FigmaNode {
  id: string;
  name: string;
  type: FigmaNodeType;
  children?: FigmaNode[];

  // Auto-layout (present on FRAME/COMPONENT/INSTANCE with layout)
  layoutMode?: FigmaLayoutMode;
  itemSpacing?: number;
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  primaryAxisAlignItems?: FigmaAxisAlign;
  layoutSizingHorizontal?: FigmaSizing;
  layoutSizingVertical?: FigmaSizing;
  absoluteBoundingBox?: { width: number; height: number };

  // Style
  cornerRadius?: number;
  boundVariables?: {
    fills?: FigmaVariableAlias[];
    strokes?: FigmaVariableAlias[];
    topLeftRadius?: FigmaVariableAlias;
  };
  /** Map of styleType ("fill"|"text"|"stroke") → styleId. */
  styles?: Record<string, string>;

  // Text
  characters?: string;
  style?: { maxLines?: number };
}
