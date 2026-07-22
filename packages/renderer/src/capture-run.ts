import { readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { MatrixCell } from "@parity/matrix";
import type { CapturedNode, CellCapture } from "@parity/capture";
import { applyCellConfig, ensureBooted, openUrl, screenshot } from "./simctl.js";
import { imageSize, phashFromImage } from "./phash.js";
import { CaptureStore } from "./store.js";

/**
 * Supplies the observed runtime tree (and the device pixel ratio) for a cell. Tree
 * capture requires cooperation from the app under test (the Expo harness reports its
 * tree); simctl alone cannot see inside the app. Callers may pass a stub — the frame +
 * pHash capture is real either way.
 */
export type TreeProvider = (
  cell: MatrixCell,
) => Promise<{ tree: CapturedNode; scale?: number }>;

export interface CaptureRunOptions {
  cells: MatrixCell[];
  storeDir: string;
  treeProvider: TreeProvider;
  /**
   * Deep-link template opened before each capture so the harness app can apply app-level
   * axes (direction/RTL, component state). `{cellId}` is substituted. Optional — without
   * it we capture whatever is on screen (smoke-test mode).
   */
  deepLinkTemplate?: string;
  /** Settle time after applying a cell config, ms. Rendering needs a beat. */
  settleMs?: number;
  preferDevice?: string;
  log?: (line: string) => void;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Drive a live simulator across the matrix: per cell — apply appearance/dynamic type,
 * optionally deep-link the harness app (direction + state), screenshot, hash, store.
 * Produces real CellCaptures for the diff engine. Pure data plane: no model, no MCP.
 */
export async function captureRun(opts: CaptureRunOptions): Promise<CellCapture[]> {
  const log = opts.log ?? (() => {});
  const settleMs = opts.settleMs ?? 800;
  const store = new CaptureStore(opts.storeDir);
  const device = await ensureBooted(opts.preferDevice);
  log(`device: ${device.name} (${device.udid})`);

  const captures: CellCapture[] = [];
  for (const cell of opts.cells) {
    await applyCellConfig(device.udid, cell);
    if (opts.deepLinkTemplate) {
      await openUrl(device.udid, opts.deepLinkTemplate.replaceAll("{cellId}", cell.id));
    }
    await sleep(settleMs);

    const tmpPath = join(tmpdir(), `parity-${cell.id}-${Date.now()}.png`);
    await screenshot(device.udid, tmpPath);
    const png = await readFile(tmpPath);
    await rm(tmpPath, { force: true });

    const [size, phash, report] = await Promise.all([
      imageSize(png),
      phashFromImage(png),
      opts.treeProvider(cell),
    ]);
    const frame = await store.put(png, "frame", size);
    log(`${cell.id}: ${size.width}x${size.height} phash=${phash} → ${frame.hash.slice(0, 12)}…`);

    captures.push({ cellId: cell.id, frame, phash, tree: report.tree, scale: report.scale });
  }
  return captures;
}
