import { z } from "zod";
import { Divergence } from "./divergence.js";

/** Current manifest schema version. */
export const MANIFEST_SCHEMA_VERSION = 1 as const;

/**
 * Per-cell outcome of pass 1 (deterministic). `escalated` marks cells promoted to the
 * model. This stays compact — no pixels, just the decision trail.
 */
export const CellOutcome = z.object({
  cellId: z.string().min(1),
  /** Structural diff distance (0 = identical trees). */
  structuralDistance: z.number().min(0),
  /** Perceptual-hash distance vs intent (0 = identical). */
  phashDistance: z.number().min(0),
  /** Did pass 1 flag this cell as a candidate divergence? */
  flagged: z.boolean(),
  /** Was it escalated to the model (pass 2)? */
  escalated: z.boolean(),
});
export type CellOutcome = z.infer<typeof CellOutcome>;

/** Design-coverage summary (Piece 4). Optional in Phase 0. */
export const Coverage = z.object({
  covered: z.number().int().min(0),
  total: z.number().int().min(0),
});
export type Coverage = z.infer<typeof Coverage>;

/**
 * The DivergenceManifest — the ONLY thing that crosses the agent/MCP boundary.
 * Must stay kilobyte-sized: bytes live behind Handles, not inline. If this object
 * carries pixels, the plane discipline (docs/architecture.md) has been violated.
 */
export const DivergenceManifest = z.object({
  schemaVersion: z.literal(MANIFEST_SCHEMA_VERSION),
  /** Component under test — the anchor/identity this run is about. */
  component: z.string().min(1),
  /** ISO-8601 timestamp of the run. */
  ranAt: z.string().min(1),
  /** Every cell's deterministic outcome (the decision trail). */
  cells: z.array(CellOutcome),
  /** Confirmed/escalated divergences (bugs and intent findings). */
  divergences: z.array(Divergence),
  /** Convenience count of `verdict === "bug"` divergences. */
  mismatches: z.number().int().min(0),
  coverage: Coverage.optional(),
});
export type DivergenceManifest = z.infer<typeof DivergenceManifest>;

/**
 * Build a manifest from parts, deriving `mismatches` so the count can't drift from the
 * data. Validates the result — a malformed manifest must never leave the data plane.
 */
export function buildManifest(input: {
  component: string;
  ranAt: string;
  cells: z.input<typeof CellOutcome>[];
  divergences: z.input<typeof Divergence>[];
  coverage?: z.input<typeof Coverage>;
}): DivergenceManifest {
  const parsedDivergences = input.divergences.map((d) => Divergence.parse(d));
  const mismatches = parsedDivergences.filter((d) => d.verdict === "bug").length;
  return DivergenceManifest.parse({
    schemaVersion: MANIFEST_SCHEMA_VERSION,
    component: input.component,
    ranAt: input.ranAt,
    cells: input.cells,
    divergences: parsedDivergences,
    mismatches,
    coverage: input.coverage,
  });
}
