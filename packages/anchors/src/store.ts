import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { walk, type IRDocument } from "@parity/ir";
import { AnchorStoreFile, type Anchor } from "./schema.js";

/**
 * Queryable anchor store over the in-repo file. Load once, query by either side of the
 * boundary, validate against an extracted IR to catch anchor drift (risk R-2) — the
 * silent degradation the PRD warns turns delta reconciliation back into full-tree diffs.
 */
export class AnchorStore {
  private byAnchorId = new Map<string, Anchor>();
  private byFigmaId = new Map<string, Anchor>();

  private constructor(readonly file: AnchorStoreFile) {
    for (const a of file.anchors) {
      this.byAnchorId.set(a.anchorId, a);
      this.byFigmaId.set(a.figmaNodeId, a);
    }
  }

  static fromFile(file: unknown): AnchorStore {
    const parsed = AnchorStoreFile.parse(file);
    const seen = new Set<string>();
    for (const a of parsed.anchors) {
      if (seen.has(a.anchorId)) throw new Error(`duplicate anchorId: ${a.anchorId}`);
      seen.add(a.anchorId);
    }
    return new AnchorStore(parsed);
  }

  static async load(path: string): Promise<AnchorStore> {
    return AnchorStore.fromFile(JSON.parse(await readFile(path, "utf8")));
  }

  async save(path: string): Promise<void> {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, JSON.stringify(this.file, null, 2) + "\n");
  }

  get(anchorId: string): Anchor | undefined {
    return this.byAnchorId.get(anchorId);
  }

  getByFigmaId(figmaNodeId: string): Anchor | undefined {
    return this.byFigmaId.get(figmaNodeId);
  }

  /** The extractor's anchorResolver, backed by this store. */
  anchorResolver(): (figmaNodeId: string) => string | undefined {
    return (figmaNodeId) => this.byFigmaId.get(figmaNodeId)?.anchorId;
  }

  /**
   * Validate against a freshly-extracted IR. Detects both drift directions:
   *  - `staleAnchors`: store entries whose figmaNodeId no longer exists in the design
   *    (design restructured — needs re-pointing).
   *  - `unanchoredNodes`: IR nodes carrying an anchorId the store doesn't know
   *    (store and extraction out of sync).
   */
  validateAgainst(ir: IRDocument): { staleAnchors: string[]; unanchoredNodes: string[] } {
    const irFigmaIds = new Set<string>();
    const irAnchorIds = new Set<string>();
    for (const n of walk(ir.root)) {
      irFigmaIds.add(n.figmaNodeId);
      if (n.anchorId) irAnchorIds.add(n.anchorId);
    }
    const staleAnchors = this.file.anchors
      .filter((a) => !irFigmaIds.has(a.figmaNodeId))
      .map((a) => a.anchorId);
    const unanchoredNodes = [...irAnchorIds].filter((id) => !this.byAnchorId.has(id));
    return { staleAnchors, unanchoredNodes };
  }

  /** Re-point an anchor at a new Figma node (design restructured; slot id unchanged). */
  repointFigma(anchorId: string, newFigmaNodeId: string): void {
    const anchor = this.byAnchorId.get(anchorId);
    if (!anchor) throw new Error(`unknown anchorId: ${anchorId}`);
    this.byFigmaId.delete(anchor.figmaNodeId);
    anchor.figmaNodeId = newFigmaNodeId;
    this.byFigmaId.set(newFigmaNodeId, anchor);
  }
}
