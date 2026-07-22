import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Handle } from "@parity/manifest";

/**
 * Content-addressed capture store (the "object storage" of the architecture, local-disk
 * flavored for the MVP). Artifacts are written once under their sha256; everything
 * upstream refers to them by Handle — the control plane never sees the bytes.
 * Answers open-question Q-005 for Phase 0: address = sha256 hex, retention = the repo's
 * gitignored captures/ dir (never committed).
 */
export class CaptureStore {
  constructor(private readonly root: string) {}

  private pathFor(hash: string): string {
    return join(this.root, `${hash}.png`);
  }

  /** Store PNG bytes; returns the Handle. Idempotent — same bytes, same address. */
  async put(png: Buffer, kind: Handle["kind"], size: { width: number; height: number }): Promise<Handle> {
    await mkdir(this.root, { recursive: true });
    const hash = createHash("sha256").update(png).digest("hex");
    await writeFile(this.pathFor(hash), png);
    return { hash, kind, width: size.width, height: size.height };
  }

  /** Fetch bytes by handle (data-plane consumers only, e.g. crop extraction). */
  async get(handle: Handle): Promise<Buffer> {
    return readFile(this.pathFor(handle.hash));
  }
}
