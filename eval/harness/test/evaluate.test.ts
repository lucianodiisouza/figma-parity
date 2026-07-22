import { describe, it, expect } from "vitest";
import { primaryButtonIR, primaryButtonLabels } from "@parity/fixtures";
import type { CapturedNode, CellCapture } from "@parity/capture";
import { MockJudge } from "@parity/escalate";
import { runParity } from "@parity/reporter";
import { evaluate, renderEvalReport } from "../src/index.js";
import type { DivergenceManifest } from "@parity/manifest";

const handle = { hash: "h", kind: "frame" as const, width: 200, height: 48 };
const tree = (truncated: boolean): CapturedNode => ({
  anchorId: "cta.root",
  role: "button",
  children: [{ anchorId: "cta.label", role: "text", text: { raw: "Continue", truncated, lines: 1 }, children: [] }],
});
const cap = (cellId: string, truncated: boolean): CellCapture => ({ cellId, frame: handle, phash: "0000", tree: tree(truncated) });

describe("evaluate — pure metric math", () => {
  const manifest: DivergenceManifest = {
    schemaVersion: 1,
    component: "PrimaryButton",
    ranAt: "2026-07-22T12:00:00Z",
    cells: [],
    divergences: [
      { cellId: "light.largest.ltr", kind: "truncation", severity: "major", verdict: "bug" },
      { cellId: "light.default.rtl", kind: "rtl-mirroring", severity: "minor", verdict: "bug" }, // wrong: truth is intent
    ],
    mismatches: 2,
  };

  it("counts a false positive when the tool calls an intent cell a bug", () => {
    const r = evaluate(manifest, primaryButtonLabels);
    // light.largest.ltr truth=bug → TP; light.default.rtl truth=intent → FP
    expect(r.truePositives).toBe(1);
    expect(r.falsePositives).toBe(1);
    expect(r.falsePositiveCells).toContain("light.default.rtl");
    expect(r.falsePositiveRate).toBeGreaterThan(0);
  });
});

describe("full stack — pipeline output evaluated against fixture labels", () => {
  it("computes an FP rate over all 8 MVP cells", async () => {
    // Captures aligned to the fixture's ground truth: the two "largest" cells truncate.
    const captures = primaryButtonLabels.cases.map((c) =>
      cap(c.cellId, c.cellId.includes("largest")),
    );

    const manifest = await runParity({
      component: "PrimaryButton",
      ir: primaryButtonIR,
      captures,
      judge: new MockJudge(),
      coverage: { covered: 3, total: 19 },
    });

    const report = evaluate(manifest, primaryButtonLabels);
    expect(report.total).toBe(8);
    // The 4 "largest" cells truncate and are labeled bug → caught (TP or FN split by RTL intent).
    expect(report.truePositives).toBeGreaterThan(0);
    // A concrete FP-rate number is produced — the Phase 0 deliverable.
    expect(Number.isNaN(report.falsePositiveRate)).toBe(false);

    const rendered = renderEvalReport(report, 0.1);
    expect(rendered).toContain("False-positive rate:");
    expect(rendered).toMatch(/Gate \(FP ≤ 10\.0%\): (PASS|FAIL)/);
  });
});
