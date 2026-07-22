/**
 * Perceptual-hash distance. pHashes are compared by Hamming distance (number of differing
 * bits): small distance = perceptually similar frames. The actual hash *generation* from
 * pixels lives in the data plane (B5, via sharp); this module only compares the compact
 * hex strings that reach the diff.
 */

const HEX_BITS: Record<string, number> = {
  "0": 0, "1": 1, "2": 1, "3": 2, "4": 1, "5": 2, "6": 2, "7": 3,
  "8": 1, "9": 2, a: 2, b: 3, c: 2, d: 3, e: 3, f: 4,
};

/** Popcount of a single lowercase hex digit. */
function hexNibblePopcount(ch: string): number {
  const bits = HEX_BITS[ch];
  if (bits === undefined) throw new Error(`invalid hex digit: ${ch}`);
  return bits;
}

/**
 * Hamming distance between two equal-length hex pHash strings.
 * Throws on length mismatch — comparing hashes of different sizes is a bug, not a 0.
 */
export function phashDistance(a: string, b: string): number {
  const x = a.toLowerCase();
  const y = b.toLowerCase();
  if (x.length !== y.length) {
    throw new Error(`phash length mismatch: ${x.length} vs ${y.length}`);
  }
  let distance = 0;
  for (let i = 0; i < x.length; i++) {
    const nx = parseInt(x[i]!, 16);
    const ny = parseInt(y[i]!, 16);
    if (Number.isNaN(nx) || Number.isNaN(ny)) {
      throw new Error(`invalid hex in phash at index ${i}`);
    }
    // popcount of the XOR of the two nibbles
    distance += hexNibblePopcount((nx ^ ny).toString(16));
  }
  return distance;
}
