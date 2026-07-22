import { z } from "zod";

/**
 * The durable in-repo anchor store (Piece 1, PRD §6). Anchors are the source-map
 * primitive across the design↔code boundary: a stable slot id binding a Figma node to a
 * code location. Stored as `.parity/anchors.json`, versioned alongside code, so the map
 * survives both design edits (figmaNodeId can be re-pointed) and refactors (code binding
 * can be re-pointed) without the slot id — what everything else references — changing.
 */

export const CodeBinding = z.object({
  /** Component name, e.g. "PrimaryButton". */
  component: z.string().min(1),
  /** Optional sub-element within the component, e.g. "label". */
  part: z.string().optional(),
  /** Repo-relative file path of the component, when known. Survives via re-pointing. */
  file: z.string().optional(),
});
export type CodeBinding = z.infer<typeof CodeBinding>;

export const Anchor = z.object({
  /** The durable slot id, e.g. "cta.label". NEVER changes once assigned. */
  anchorId: z.string().min(1),
  /** Volatile Figma node id at last extraction. Re-pointed when the design restructures. */
  figmaNodeId: z.string().min(1),
  code: CodeBinding,
  /** Free-text note on what this slot is, for humans doing re-pointing. */
  note: z.string().optional(),
});
export type Anchor = z.infer<typeof Anchor>;

export const AnchorStoreFile = z.object({
  schemaVersion: z.literal(1),
  /** Figma file this store maps against. */
  figmaFileKey: z.string().min(1),
  anchors: z.array(Anchor),
});
export type AnchorStoreFile = z.infer<typeof AnchorStoreFile>;
