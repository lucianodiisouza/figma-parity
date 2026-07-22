/**
 * End-to-end demo of the Phase 0 pipeline on the PrimaryButton fixture — fully headless
 * (MockJudge, synthetic captures). Prints the parity report and the false-positive-rate
 * eval. This is the "3 of 19 + FP rate" output the PRD pitches, wired to real code.
 *
 * Run:  pnpm -w build && node apps/demo/dist/demo.js
 */
import {
  primaryButtonDesignedStates,
  primaryButtonIR,
  primaryButtonLabels,
  primaryButtonStateSpace,
} from "@parity/fixtures";
import type { CapturedNode, CellCapture } from "@parity/capture";
import { MVP_MATRIX } from "@parity/matrix";
import { coverage } from "@parity/enumerate";
import { MockJudge } from "@parity/escalate";
import { renderReport, runParity } from "@parity/reporter";
import { evaluate, renderEvalReport } from "@parity/eval-harness";

// Synthetic captures aligned to the fixture's ground truth: the "largest" dynamic-type
// cells truncate the label (the bug the designer never drew); the rest match intent.
const frame = { hash: "demo", kind: "frame" as const, width: 200, height: 48 };
const tree = (truncated: boolean): CapturedNode => ({
  anchorId: "cta.root",
  role: "button",
  children: [{ anchorId: "cta.label", role: "text", text: { raw: "Continue", truncated, lines: 1 }, children: [] }],
});
const captures: CellCapture[] = MVP_MATRIX.map((cell) => ({
  cellId: cell.id,
  frame,
  phash: "0000",
  tree: tree(cell.dynamicType === "largest"),
}));

// Piece 4: enumerate the real state space and compute design coverage — no model, pure
// combinatorics over the component's actual props + the axes Figma can't express.
const cov = coverage(primaryButtonStateSpace, {
  coveredStateIds: primaryButtonDesignedStates,
});

const manifest = await runParity({
  component: "PrimaryButton",
  ir: primaryButtonIR,
  captures,
  judge: new MockJudge(),
  coverage: { covered: cov.covered, total: cov.total },
});

console.log("─".repeat(64));
console.log(renderReport(manifest));
console.log("─".repeat(64));
console.log(renderEvalReport(evaluate(manifest, primaryButtonLabels), 0.1));
console.log("─".repeat(64));
console.log(`Un-drawn states (where bugs live):`);
for (const s of cov.uncoveredStates) console.log(`  ${s.id}`);
console.log(`Manifest size across the (hypothetical) MCP boundary: ${JSON.stringify(manifest).length} bytes`);
