import { describe, it, expect } from "vitest";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import { phashDistance } from "@parity/diff";
import { CaptureStore, imageSize, phashFromImage } from "../src/index.js";

/** Solid-color test PNG. */
function png(r: number, g: number, b: number, w = 64, h = 64): Promise<Buffer> {
  return sharp({ create: { width: w, height: h, channels: 3, background: { r, g, b } } })
    .png()
    .toBuffer();
}

/** Half-black / half-white vertical split. */
async function splitPng(): Promise<Buffer> {
  const left = await png(0, 0, 0, 32, 64);
  return sharp(await png(255, 255, 255, 64, 64))
    .composite([{ input: left, left: 0, top: 0 }])
    .png()
    .toBuffer();
}

describe("phashFromImage", () => {
  it("produces a 16-hex-char hash, deterministic per image", async () => {
    const img = await splitPng();
    const h1 = await phashFromImage(img);
    const h2 = await phashFromImage(img);
    expect(h1).toMatch(/^[0-9a-f]{16}$/);
    expect(h1).toBe(h2);
  });

  it("similar images hash close; a mirrored split hashes far", async () => {
    const split = await splitPng();
    const mirrored = await sharp(split).flop().png().toBuffer();
    const near = await sharp(split).resize(60, 60).png().toBuffer(); // same content, rescaled

    const d = await phashFromImage(split);
    expect(phashDistance(d, await phashFromImage(near))).toBeLessThanOrEqual(8);
    expect(phashDistance(d, await phashFromImage(mirrored))).toBeGreaterThan(16);
  });

  it("interops with the diff engine's distance (same hex alphabet/length)", async () => {
    const h = await phashFromImage(await splitPng());
    expect(phashDistance(h, h)).toBe(0);
  });
});

describe("CaptureStore", () => {
  it("stores by content hash, idempotently, and round-trips bytes", async () => {
    const dir = await mkdtemp(join(tmpdir(), "parity-store-"));
    const store = new CaptureStore(dir);
    const img = await splitPng();
    const size = await imageSize(img);

    const a = await store.put(img, "frame", size);
    const b = await store.put(img, "frame", size); // same bytes → same address
    expect(a.hash).toBe(b.hash);
    expect(a.hash).toMatch(/^[0-9a-f]{64}$/);
    expect(a.width).toBe(64);

    const back = await store.get(a);
    expect(Buffer.compare(back, img)).toBe(0);
  });
});
