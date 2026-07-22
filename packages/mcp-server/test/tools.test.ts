import { describe, it, expect } from "vitest";
import { primaryButtonLabels } from "@parity/fixtures";
import type { DivergenceManifest } from "@parity/manifest";
import { evaluateManifest, summarizeManifest } from "../src/tools.js";

const manifest: DivergenceManifest = {
  schemaVersion: 1,
  component: "PrimaryButton",
  ranAt: "2026-07-22T12:00:00Z",
  cells: [
    { cellId: "light.default.ltr", structuralDistance: 0, phashDistance: 0, flagged: false, escalated: false },
    { cellId: "light.largest.ltr", structuralDistance: 1, phashDistance: 0, flagged: true, escalated: true },
  ],
  divergences: [
    { cellId: "light.largest.ltr", anchorId: "cta.label", kind: "truncation", severity: "major", verdict: "bug" },
  ],
  mismatches: 1,
};

describe("summarize_manifest tool", () => {
  it("reduces a manifest to a compact kilobyte summary", () => {
    const s = summarizeManifest(manifest);
    expect(s.component).toBe("PrimaryButton");
    expect(s.cells).toBe(2);
    expect(s.flagged).toBe(1);
    expect(s.mismatches).toBe(1);
    expect(s.bugs[0]).toEqual({ cellId: "light.largest.ltr", anchorId: "cta.label", kind: "truncation", severity: "major" });
    expect(JSON.stringify(s).length).toBeLessThan(1000);
  });

  it("rejects a malformed manifest at the boundary", () => {
    expect(() => summarizeManifest({ nope: true })).toThrow();
  });
});

describe("evaluate_manifest tool", () => {
  it("returns a false-positive-rate report against labels", () => {
    const r = evaluateManifest({ manifest, labels: primaryButtonLabels });
    // light.largest.ltr is labeled divergence:bug → a true positive, not a false positive
    expect(r.truePositives).toBe(1);
    expect(r.falsePositives).toBe(0);
    expect(Number.isNaN(r.falsePositiveRate)).toBe(false);
  });
});
