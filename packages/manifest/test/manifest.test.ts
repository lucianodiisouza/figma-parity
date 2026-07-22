import { describe, it, expect } from "vitest";
import {
  DivergenceManifest,
  GroundTruth,
  Handle,
  LabelSet,
  buildManifest,
  isBug,
} from "../src/index.js";

describe("Handle", () => {
  it("rejects a zero-size artifact", () => {
    expect(() =>
      Handle.parse({ hash: "abc", kind: "crop", width: 0, height: 10 }),
    ).toThrow();
  });
});

describe("buildManifest", () => {
  const base = {
    component: "PrimaryButton",
    ranAt: "2026-07-22T12:00:00Z",
    cells: [
      { cellId: "light.default.ltr", structuralDistance: 0, phashDistance: 0, flagged: false, escalated: false },
      { cellId: "dark.largest.rtl", structuralDistance: 2, phashDistance: 9, flagged: true, escalated: true },
    ],
  };

  it("derives mismatches from bug verdicts only", () => {
    const m = buildManifest({
      ...base,
      divergences: [
        { cellId: "dark.largest.rtl", kind: "truncation", severity: "major", verdict: "bug" },
        { cellId: "dark.largest.rtl", kind: "rtl-mirroring", severity: "minor", verdict: "intent" },
      ],
    });
    expect(m.mismatches).toBe(1); // the "intent" one does not count
  });

  it("produces a manifest that re-validates and carries no inline pixels", () => {
    const m = buildManifest({ ...base, divergences: [] });
    expect(() => DivergenceManifest.parse(m)).not.toThrow();
    // sanity: serialized manifest stays tiny (kilobytes, not megabytes)
    expect(JSON.stringify(m).length).toBeLessThan(2000);
  });

  it("accepts an optional coverage summary", () => {
    const m = buildManifest({ ...base, divergences: [], coverage: { covered: 3, total: 19 } });
    expect(m.coverage).toEqual({ covered: 3, total: 19 });
  });
});

describe("labels", () => {
  it("only divergence:bug is an actionable bug", () => {
    expect(isBug("divergence:bug")).toBe(true);
    expect(isBug("divergence:intent")).toBe(false);
    expect(isBug("match")).toBe(false);
  });

  it("validates a label set", () => {
    const set = {
      schemaVersion: 1,
      cases: [
        { component: "PrimaryButton", cellId: "light.default.ltr", truth: "match" },
        { component: "PrimaryButton", cellId: "dark.largest.rtl", truth: "divergence:bug", note: "clipped" },
      ],
    };
    expect(() => LabelSet.parse(set)).not.toThrow();
    expect(GroundTruth.parse("divergence:intent")).toBe("divergence:intent");
  });
});
