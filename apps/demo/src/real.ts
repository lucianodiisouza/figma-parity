/**
 * The REAL Phase 0 run: feeds actual simulator captures (real frames, real pHashes, real
 * app-reported trees — produced by packages/renderer real-run.js) through the full
 * pipeline and evaluates against the labeled ground truth. This is the measured
 * false-positive rate on real device output — the number the MVP exists to produce.
 *
 * Run:  node apps/demo/dist/real.js [captures/captures-default.short.json]
 * Judge: MockJudge by default; the AnthropicJudge (N2) swaps in once ANTHROPIC_API_KEY
 * is provided — same pipeline, no other changes.
 */
import { readFile } from "node:fs/promises";
import {
  primaryButtonDesignedStates,
  primaryButtonIR,
  primaryButtonLabels,
  primaryButtonStateSpace,
} from "@parity/fixtures";
import type { CellCapture } from "@parity/capture";
import { coverage } from "@parity/enumerate";
import { MockJudge } from "@parity/escalate";
import { renderReport, runParity } from "@parity/reporter";
import { evaluate, renderEvalReport } from "@parity/eval-harness";

const capturesPath = process.argv[2] ?? "captures/captures-default.short.json";
const captures = JSON.parse(await readFile(capturesPath, "utf8")) as CellCapture[];

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

console.log("═".repeat(64));
console.log("REAL RUN — actual simulator frames + app-reported trees");
console.log("═".repeat(64));
console.log(renderReport(manifest));
console.log("─".repeat(64));
console.log(renderEvalReport(evaluate(manifest, primaryButtonLabels), 0.1));
console.log("─".repeat(64));
console.log(`Manifest size: ${JSON.stringify(manifest).length} bytes (kilobyte discipline)`);
