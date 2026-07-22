import { describe, it, expect } from "vitest";
import { primaryButtonIR } from "@parity/fixtures";
import type { CellCapture, CapturedNode } from "@parity/capture";
import { pass1, structuralDiff } from "../src/index.js";

const handle = { hash: "h", kind: "frame" as const, width: 200, height: 48 };

/** A faithful capture of the intent — label present, not truncated. */
const goodTree: CapturedNode = {
  anchorId: "cta.root",
  role: "button",
  children: [
    { anchorId: "cta.label", role: "text", text: { raw: "Continue", truncated: false, lines: 1 }, children: [] },
  ],
};

function capture(cellId: string, tree: CapturedNode, phash = "0000"): CellCapture {
  return { cellId, frame: handle, phash, tree };
}

describe("structuralDiff", () => {
  it("finds nothing when capture matches intent", () => {
    expect(structuralDiff(primaryButtonIR, capture("light.default.ltr", goodTree))).toEqual([]);
  });

  it("flags truncation (the high-value MVP signal)", () => {
    const clipped: CapturedNode = {
      anchorId: "cta.root",
      role: "button",
      children: [
        { anchorId: "cta.label", role: "text", text: { raw: "Continuar com…", truncated: true, lines: 1 }, children: [] },
      ],
    };
    const findings = structuralDiff(primaryButtonIR, capture("light.largest.ltr", clipped));
    expect(findings.map((f) => f.kind)).toContain("truncation");
  });

  it("flags a missing intent element", () => {
    const missingLabel: CapturedNode = { anchorId: "cta.root", role: "button", children: [] };
    const findings = structuralDiff(primaryButtonIR, capture("x", missingLabel));
    expect(findings.find((f) => f.kind === "missing-element")?.anchorId).toBe("cta.label");
  });

  it("flags an extra runtime element", () => {
    const extra: CapturedNode = {
      anchorId: "cta.root",
      role: "button",
      children: [
        { anchorId: "cta.label", role: "text", text: { raw: "Continue", truncated: false, lines: 1 }, children: [] },
        { anchorId: "cta.badge", role: "icon", children: [] },
      ],
    };
    const findings = structuralDiff(primaryButtonIR, capture("x", extra));
    expect(findings.find((f) => f.kind === "extra-element")?.anchorId).toBe("cta.badge");
  });
});

describe("pass1", () => {
  it("does not flag or escalate a matching cell", () => {
    const { outcome, findings } = pass1(primaryButtonIR, capture("light.default.ltr", goodTree));
    expect(outcome.flagged).toBe(false);
    expect(outcome.escalated).toBe(false);
    expect(findings).toEqual([]);
  });

  it("flags + escalates on a structural finding, surfacing candidate findings", () => {
    const clipped: CapturedNode = {
      anchorId: "cta.root",
      role: "button",
      children: [
        { anchorId: "cta.label", role: "text", text: { raw: "Weiterfahren", truncated: true, lines: 1 }, children: [] },
      ],
    };
    const { outcome, findings } = pass1(primaryButtonIR, capture("dark.largest.ltr", clipped));
    expect(outcome.flagged).toBe(true);
    expect(outcome.escalated).toBe(true);
    expect(outcome.structuralDistance).toBeGreaterThan(0);
    expect(findings.length).toBeGreaterThan(0); // only surfaced because escalated
  });

  it("flags on pHash distance alone when above threshold", () => {
    const { outcome } = pass1(primaryButtonIR, capture("x", goodTree, "ffff"), {
      referencePhash: "0000",
      thresholds: { phashFlag: 4 },
    });
    // ffff vs 0000 = 16 differing bits > 4
    expect(outcome.phashDistance).toBe(16);
    expect(outcome.flagged).toBe(true);
  });
});
