import { describe, it, expect } from "vitest";
import { primaryButtonIR } from "@parity/fixtures";
import type { CapturedNode, CellCapture } from "@parity/capture";
import { MockJudge } from "@parity/escalate";
import { DivergenceManifest } from "@parity/manifest";
import { renderReport, runParity, summarizeIntent } from "../src/index.js";

const handle = { hash: "h", kind: "frame" as const, width: 200, height: 48 };

function tree(truncated: boolean): CapturedNode {
  return {
    anchorId: "cta.root",
    role: "button",
    children: [
      { anchorId: "cta.label", role: "text", text: { raw: "Continue", truncated, lines: 1 }, children: [] },
    ],
  };
}

const captures: CellCapture[] = [
  { cellId: "light.default.ltr", frame: handle, phash: "0000", tree: tree(false) }, // clean
  { cellId: "dark.largest.ltr", frame: handle, phash: "0000", tree: tree(true) }, // truncates → bug
];

describe("summarizeIntent", () => {
  it("produces a compact multi-line intent summary", () => {
    const s = summarizeIntent(primaryButtonIR);
    expect(s).toContain("@cta.root");
    expect(s).toContain('text="Continue"');
  });
});

describe("runParity (end-to-end with MockJudge)", () => {
  it("flags only the truncating cell and builds a valid manifest", async () => {
    const manifest = await runParity({
      component: "PrimaryButton",
      ir: primaryButtonIR,
      captures,
      judge: new MockJudge(),
      coverage: { covered: 3, total: 19 },
      ranAt: "2026-07-22T12:00:00Z",
    });

    expect(() => DivergenceManifest.parse(manifest)).not.toThrow();
    expect(manifest.cells).toHaveLength(2);
    expect(manifest.cells.find((c) => c.cellId === "light.default.ltr")?.flagged).toBe(false);
    expect(manifest.cells.find((c) => c.cellId === "dark.largest.ltr")?.escalated).toBe(true);
    expect(manifest.mismatches).toBe(1);
    expect(manifest.divergences[0]?.kind).toBe("truncation");
  });

  it("stays kilobyte-sized (plane discipline)", async () => {
    const manifest = await runParity({
      component: "PrimaryButton",
      ir: primaryButtonIR,
      captures,
      judge: new MockJudge(),
    });
    expect(JSON.stringify(manifest).length).toBeLessThan(2000);
  });
});

describe("renderReport", () => {
  it("renders coverage, bug list, and the headline", async () => {
    const manifest = await runParity({
      component: "PrimaryButton",
      ir: primaryButtonIR,
      captures,
      judge: new MockJudge(),
      coverage: { covered: 3, total: 19 },
      ranAt: "2026-07-22T12:00:00Z",
    });
    const report = renderReport(manifest);
    expect(report).toContain("Design coverage: 3 of 19");
    expect(report).toContain("Bugs (1):");
    expect(report).toContain("truncation");
  });

  it("says so plainly when clean", async () => {
    const manifest = await runParity({
      component: "PrimaryButton",
      ir: primaryButtonIR,
      captures: [captures[0]!],
      judge: new MockJudge(),
    });
    expect(renderReport(manifest)).toContain("✓ No bugs detected.");
  });
});
