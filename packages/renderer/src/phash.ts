import sharp from "sharp";

/**
 * Perceptual hash GENERATION (data plane). The diff engine only compares hex strings
 * (@parity/diff phashDistance); this is where those strings come from.
 *
 * Average-hash over an 8×8 grayscale reduction: 64 bits → 16 hex chars. Simple, fast,
 * and deterministic — sufficient for pass 1's "is this frame roughly what intent looks
 * like" signal. Escalate to DCT-pHash only if eval shows aHash is the precision
 * bottleneck (decision-log D-002's "surgical escape hatch" applies here too).
 */
export async function phashFromImage(input: Buffer | string): Promise<string> {
  const { data } = await sharp(input)
    .grayscale()
    .resize(8, 8, { fit: "fill" })
    .raw()
    .toBuffer({ resolveWithObject: true });

  if (data.length !== 64) throw new Error(`expected 64 gray pixels, got ${data.length}`);

  let sum = 0;
  for (const px of data) sum += px;
  const mean = sum / 64;

  // Build the 64-bit hash nibble by nibble (bit i set iff pixel i >= mean).
  let hex = "";
  for (let i = 0; i < 64; i += 4) {
    let nibble = 0;
    for (let b = 0; b < 4; b++) {
      if ((data[i + b] ?? 0) >= mean) nibble |= 1 << (3 - b);
    }
    hex += nibble.toString(16);
  }
  return hex;
}

/** Pixel dimensions of an image, for the capture Handle. */
export async function imageSize(input: Buffer | string): Promise<{ width: number; height: number }> {
  const meta = await sharp(input).metadata();
  if (!meta.width || !meta.height) throw new Error("image has no dimensions");
  return { width: meta.width, height: meta.height };
}
