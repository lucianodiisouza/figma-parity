#!/usr/bin/env node
/**
 * The REAL Phase 0 run: drives the Expo harness app (apps/example-expo, via Expo Go)
 * across the 8-cell MVP matrix — appearance + dynamic type via simctl, direction via
 * deep link, REAL screenshots, REAL pHashes, and REAL observed trees reported by the
 * app to the TreeCollector. Prints the captures as JSON for the pipeline.
 *
 * Prereqs: `npx expo start` running in apps/example-expo, Expo Go installed on a booted
 * simulator (see HANDOFF N1b).
 *
 * Run:  node packages/renderer/dist/real-run.js <exp-host> [storeDir] [state]
 *   exp-host  e.g. "192.168.0.3:8081" (from the expo start output)
 *   state     component state, default "default.short"
 */
import { writeFile } from "node:fs/promises";
import { MVP_MATRIX } from "@parity/matrix";
import { captureRun } from "./capture-run.js";
import { TreeCollector } from "./tree-server.js";

const expHost = process.argv[2];
if (!expHost) {
  console.error("usage: real-run.js <exp-host:port> [storeDir] [state]");
  process.exit(1);
}
const storeDir = process.argv[3] ?? "captures";
const state = process.argv[4] ?? "default.short";

const collector = new TreeCollector();
await collector.start();
collector.reset();

try {
  const captures = await captureRun({
    cells: MVP_MATRIX,
    storeDir,
    treeProvider: collector.providerFor({ timeoutMs: 20_000 }),
    // `t` busts the app's URL memo so the effect re-fires (and re-posts the tree) even if
    // the same cell was opened before.
    deepLinkTemplate: `exp://${expHost}/--/cell/{cellId}?state=${state}&t=${Date.now()}`,
    settleMs: 1500,
    log: (line) => console.log(line),
  });

  const outPath = `${storeDir}/captures-${state}.json`;
  await writeFile(outPath, JSON.stringify(captures, null, 2));
  console.log("─".repeat(64));
  console.log(`wrote ${captures.length} real captures → ${outPath}`);
  for (const c of captures) {
    const label = JSON.stringify(c.tree.children[0]?.text ?? c.tree.children[0]?.role ?? "?");
    console.log(`  ${c.cellId.padEnd(20)} tree: ${label}`);
  }
} finally {
  await collector.stop();
}
