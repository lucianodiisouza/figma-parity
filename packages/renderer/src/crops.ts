import sharp from "sharp";
import type { CellCapture, CapturedNode, CapturedRect } from "@parity/capture";
import type { CropProvider } from "@parity/reporter";
import { CaptureStore } from "./store.js";

/**
 * Crop extraction (data plane). For an escalated cell, cut the failing region out of the
 * stored full frame so pass 2 sees ONLY the crop — never the whole screenshot. This is
 * the "only the failing crop (~200px)" rule from PRD §5/§8 made concrete.
 *
 * Geometry: tree rects are window-relative logical points; the frame is device pixels.
 * pixelRect = rect × capture.scale, padded, clamped to the frame.
 */

const PAD_PT = 12;

function findRect(node: CapturedNode): CapturedRect | undefined {
  if (node.rect) return node.rect;
  for (const child of node.children) {
    const r = findRect(child);
    if (r) return r;
  }
  return undefined;
}

export interface CropResult {
  base64: string;
  mediaType: string;
}

/** Extract the (padded, clamped) crop around the tree's reported rect. */
export async function extractCrop(
  store: CaptureStore,
  capture: CellCapture,
): Promise<CropResult | undefined> {
  const rect = findRect(capture.tree);
  const scale = capture.scale;
  if (!rect || !scale) return undefined;

  const png = await store.get(capture.frame);
  const left = Math.max(0, Math.round((rect.x - PAD_PT) * scale));
  const top = Math.max(0, Math.round((rect.y - PAD_PT) * scale));
  const width = Math.min(
    capture.frame.width - left,
    Math.round((rect.width + PAD_PT * 2) * scale),
  );
  const height = Math.min(
    capture.frame.height - top,
    Math.round((rect.height + PAD_PT * 2) * scale),
  );
  if (width <= 0 || height <= 0) return undefined;

  const crop = await sharp(png).extract({ left, top, width, height }).png().toBuffer();
  return { base64: crop.toString("base64"), mediaType: "image/png" };
}

/**
 * CropProvider for the pipeline: cellId → crop of that cell's failing region. Also
 * stores each crop in the CaptureStore (kind "crop") so it is auditable after the run.
 */
export function makeCropProvider(store: CaptureStore, captures: CellCapture[]): CropProvider {
  const byCell = new Map(captures.map((c) => [c.cellId, c]));
  return async (cellId: string) => {
    const capture = byCell.get(cellId);
    if (!capture) return undefined;
    const crop = await extractCrop(store, capture);
    if (!crop) return undefined;
    const png = Buffer.from(crop.base64, "base64");
    const meta = await sharp(png).metadata();
    await store.put(png, "crop", { width: meta.width ?? 0, height: meta.height ?? 0 });
    return crop;
  };
}
