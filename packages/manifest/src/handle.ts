import { z } from "zod";

/**
 * A content-addressed reference to a heavy artifact (frame capture, crop) living in
 * object storage. This is how the data plane hands bytes to the control plane WITHOUT
 * the bytes crossing MCP — only the handle travels. See docs/architecture.md.
 */
export const ArtifactKind = z.enum(["frame", "crop"]);
export type ArtifactKind = z.infer<typeof ArtifactKind>;

export const Handle = z.object({
  /** Content hash (e.g. sha256 hex) — the address in object storage. */
  hash: z.string().min(1),
  kind: ArtifactKind,
  /** Pixel dimensions, kept for sanity checks / crop-size budget assertions. */
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});
export type Handle = z.infer<typeof Handle>;
