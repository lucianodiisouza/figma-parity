import { describe, it, expect } from "vitest";
import { Divergence } from "@parity/manifest";
import { MockJudge, type EscalationInput } from "../src/index.js";

const judge = new MockJudge();

function input(findings: EscalationInput["findings"]): EscalationInput {
  return { component: "PrimaryButton", cellId: "dark.largest.ltr", findings, intentSummary: "A primary button." };
}

describe("MockJudge", () => {
  it("returns nothing for no findings", async () => {
    expect(await judge.judge(input([]))).toEqual([]);
  });

  it("judges truncation as a bug and rtl-mirroring as intent", async () => {
    const out = await judge.judge(
      input([
        { anchorId: "cta.label", kind: "truncation", severity: "major", detail: "clipped" },
        { anchorId: "cta.root", kind: "rtl-mirroring", severity: "minor", detail: "mirrored" },
      ]),
    );
    expect(out).toHaveLength(2);
    const byKind = Object.fromEntries(out.map((d) => [d.kind, d.verdict]));
    expect(byKind["truncation"]).toBe("bug");
    expect(byKind["rtl-mirroring"]).toBe("intent");
  });

  it("produces schema-valid Divergences with the source cellId and anchor", async () => {
    const out = await judge.judge(
      input([{ anchorId: "cta.label", kind: "truncation", severity: "major", detail: "clipped" }]),
    );
    expect(() => Divergence.parse(out[0])).not.toThrow();
    expect(out[0]?.cellId).toBe("dark.largest.ltr");
    expect(out[0]?.anchorId).toBe("cta.label");
  });
});
