import type { IRNode, IRDocument } from "./types.js";

/** Depth-first pre-order iterator over an IR subtree. */
export function* walk(node: IRNode): Generator<IRNode> {
  yield node;
  for (const child of node.children) {
    yield* walk(child);
  }
}

/** All nodes in a document, pre-order (root first). */
export function nodes(doc: IRDocument): IRNode[] {
  return [...walk(doc.root)];
}

/** Total node count of a subtree (including the node itself). */
export function countNodes(node: IRNode): number {
  let n = 0;
  for (const _ of walk(node)) n++;
  return n;
}

/**
 * Find the first node matching a predicate, pre-order. Useful for locating a node
 * by anchorId or figmaNodeId without hand-rolling recursion at every call site.
 */
export function findNode(
  node: IRNode,
  predicate: (n: IRNode) => boolean,
): IRNode | undefined {
  for (const n of walk(node)) {
    if (predicate(n)) return n;
  }
  return undefined;
}

/** Locate a node by its durable anchor slot. */
export function findByAnchor(doc: IRDocument, anchorId: string): IRNode | undefined {
  return findNode(doc.root, (n) => n.anchorId === anchorId);
}

/** Locate a node by its (volatile) Figma node id. */
export function findByFigmaId(doc: IRDocument, figmaNodeId: string): IRNode | undefined {
  return findNode(doc.root, (n) => n.figmaNodeId === figmaNodeId);
}
