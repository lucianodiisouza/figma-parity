#!/usr/bin/env node
/**
 * Live extraction: point at a real Figma node and produce the normalized IR, using the
 * in-repo anchor store as the anchor resolver, then validate for anchor drift.
 *
 * Run:  node --env-file=.env packages/extractor/dist/live-extract.js <figma-url-or-fileKey> [nodeId]
 *   Accepts a full Figma URL (https://www.figma.com/design/<fileKey>/...?node-id=1-2) —
 *   the node id is parsed from it — or an explicit fileKey + nodeId pair.
 *
 * Output: .parity/ir.<nodeId>.json + a console summary. Requires FIGMA_TOKEN in .env.
 */
import { readFile, writeFile } from "node:fs/promises";
import { extractIR } from "./extract.js";
import { fetchFigmaNode } from "./client.js";

const token = process.env["FIGMA_TOKEN"];
if (!token) {
  console.error("FIGMA_TOKEN not set (run with --env-file=.env)");
  process.exit(1);
}

const input = process.argv[2];
if (!input) {
  console.error("usage: live-extract.js <figma-url-or-fileKey> [nodeId]");
  process.exit(1);
}

// Parse "https://www.figma.com/design/<key>/<name>?node-id=10-2" (also /file/ URLs).
let fileKey = input;
let nodeId = process.argv[3];
const urlMatch = /figma\.com\/(?:design|file)\/([A-Za-z0-9]+)[^?]*(?:\?.*node-id=([\w-]+))?/.exec(input);
if (urlMatch) {
  fileKey = urlMatch[1]!;
  nodeId = nodeId ?? urlMatch[2]?.replace("-", ":");
}
if (!nodeId) {
  console.error("no node id — pass ?node-id=… in the URL or as a second argument");
  process.exit(1);
}

// Anchor store → anchorResolver (byFigmaId), loaded leniently so a fresh file works too.
let anchorResolver: ((id: string) => string | undefined) | undefined;
try {
  const store = JSON.parse(await readFile(".parity/anchors.json", "utf8")) as {
    anchors: { anchorId: string; figmaNodeId: string }[];
  };
  const byFigma = new Map(store.anchors.map((a) => [a.figmaNodeId, a.anchorId]));
  anchorResolver = (id) => byFigma.get(id);
} catch {
  console.warn("no .parity/anchors.json — extracting without anchors");
}

console.log(`fetching ${fileKey} node ${nodeId}…`);
const node = await fetchFigmaNode(fileKey, nodeId, { token });
const ir = extractIR(node, { figmaFileKey: fileKey }, { anchorResolver });

const outPath = `.parity/ir.${nodeId.replace(":", "-")}.json`;
await writeFile(outPath, JSON.stringify(ir, null, 2) + "\n");

// Summary: node count, anchored count, token refs seen.
let count = 0;
let anchored = 0;
const tokens = new Set<string>();
const visit = (n: typeof ir.root): void => {
  count++;
  if (n.anchorId) anchored++;
  for (const v of Object.values(n.style ?? {})) if (typeof v === "string") tokens.add(v);
  n.children.forEach(visit);
};
visit(ir.root);

console.log(`✓ IR written → ${outPath}`);
console.log(`  root: "${ir.root.name}" (${ir.root.role})`);
console.log(`  nodes: ${count}, anchored: ${anchored}`);
console.log(`  token refs: ${tokens.size ? [...tokens].join(", ") : "(none — resolver not wired)"}`);
