import type { NodeRole } from "@parity/ir";
import type { Handle } from "@parity/manifest";

/**
 * The data-plane capture contract. The renderer (B5) PRODUCES a CellCapture per matrix
 * cell; the diff engine (B6) CONSUMES it. Both sides depend on this package so neither
 * depends on the other. Everything here is compact/observable — no raw pixels (those
 * live behind the `frame` Handle in object storage).
 */

/** Runtime-observed text, including whether it actually clipped on device. */
export interface CapturedText {
  raw: string;
  /** True if the platform truncated the string (e.g. numberOfLines clipping). */
  truncated: boolean;
  /** Rendered line count. */
  lines: number;
}

/** Window-relative bounds of an observed node, in logical points (not pixels). */
export interface CapturedRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** One node observed in the running app's tree. Mirrors the IR skeleton, plus runtime facts. */
export interface CapturedNode {
  /** Durable anchor slot, resolved from a testID/accessibility hook when present. */
  anchorId?: string;
  role: NodeRole;
  text?: CapturedText;
  /** Measured bounds — what makes crop extraction possible for escalation. */
  rect?: CapturedRect;
  children: CapturedNode[];
}

/** Everything captured for one matrix cell. */
export interface CellCapture {
  cellId: string;
  /** Hash-addressed reference to the full frame in object storage. */
  frame: Handle;
  /** Perceptual hash of the frame (hex string). Compared via Hamming distance. */
  phash: string;
  /** The observed runtime tree. */
  tree: CapturedNode;
  /** Pixels per logical point of the frame (e.g. 3 on an iPhone 17 Pro). Needed to map
      tree rects (points) onto frame pixels for crop extraction. */
  scale?: number;
}
