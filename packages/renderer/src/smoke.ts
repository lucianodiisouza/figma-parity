#!/usr/bin/env node
/**
 * Live smoke run: boots (or reuses) an iOS simulator and drives the full 8-cell MVP
 * matrix — appearance + dynamic type applied per cell, real screenshot, real pHash,
 * hash-addressed store. Uses a stub tree provider (tree capture arrives with the Expo
 * harness app). Proves the data-plane capture path end-to-end on real device output.
 *
 * Run:  node packages/renderer/dist/smoke.js [storeDir]
 */
import { MVP_MATRIX } from "@parity/matrix";
import type { CapturedNode } from "@parity/capture";
import { captureRun } from "./capture-run.js";

const storeDir = process.argv[2] ?? "captures";

// Stub tree until the harness app reports its real accessibility tree.
const stubTree = async () => ({ tree: { role: "screen", children: [] } as CapturedNode });

const captures = await captureRun({
  cells: MVP_MATRIX,
  storeDir,
  treeProvider: stubTree,
  log: (line) => console.log(line),
});

console.log("─".repeat(64));
console.log(`captured ${captures.length} cells → ${storeDir}/`);
for (const c of captures) {
  console.log(`  ${c.cellId.padEnd(20)} phash=${c.phash} frame=${c.frame.hash.slice(0, 12)}…`);
}
