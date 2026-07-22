import type { FigmaNode } from "./figma-types.js";

/**
 * Thin Figma REST client. Uses the global `fetch` (Node ≥ 18). This is the only part of
 * the extractor that touches the network; the extraction logic (extract.ts) is pure and
 * tested against saved node JSON so token-limited/offline sessions still make progress.
 *
 * The Figma token comes from the caller (typically process.env.FIGMA_TOKEN) — never hardcode it.
 */
export interface FigmaClientOptions {
  token: string;
  /** Override for tests or self-hosted proxies. */
  baseUrl?: string;
  fetchImpl?: typeof fetch;
}

/**
 * Fetch a single node from `GET /v1/files/:fileKey/nodes?ids=:nodeId` and return its
 * `document`. Throws on a non-2xx response or a missing node.
 */
export async function fetchFigmaNode(
  fileKey: string,
  nodeId: string,
  opts: FigmaClientOptions,
): Promise<FigmaNode> {
  const base = opts.baseUrl ?? "https://api.figma.com";
  const doFetch = opts.fetchImpl ?? fetch;
  const url = `${base}/v1/files/${encodeURIComponent(fileKey)}/nodes?ids=${encodeURIComponent(nodeId)}`;

  const res = await doFetch(url, { headers: { "X-Figma-Token": opts.token } });
  if (!res.ok) {
    throw new Error(`Figma API ${res.status} ${res.statusText} for node ${nodeId}`);
  }
  const body = (await res.json()) as { nodes?: Record<string, { document?: FigmaNode }> };
  const doc = body.nodes?.[nodeId]?.document;
  if (!doc) throw new Error(`Figma node ${nodeId} not found in file ${fileKey}`);
  return doc;
}
