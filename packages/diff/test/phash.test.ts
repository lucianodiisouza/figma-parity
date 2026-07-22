import { describe, it, expect } from "vitest";
import { phashDistance } from "../src/index.js";

describe("phashDistance", () => {
  it("is 0 for identical hashes", () => {
    expect(phashDistance("ff00ab", "ff00ab")).toBe(0);
  });

  it("counts differing bits (Hamming distance)", () => {
    // 0x0 ^ 0xf = 0xf = 4 bits set
    expect(phashDistance("0", "f")).toBe(4);
    // 0x1 ^ 0x2 = 0x3 = 2 bits
    expect(phashDistance("1", "2")).toBe(2);
  });

  it("is case-insensitive", () => {
    expect(phashDistance("ABCD", "abcd")).toBe(0);
  });

  it("throws on length mismatch", () => {
    expect(() => phashDistance("ff", "f")).toThrow(/length mismatch/);
  });

  it("throws on invalid hex", () => {
    expect(() => phashDistance("zz", "00")).toThrow();
  });
});
