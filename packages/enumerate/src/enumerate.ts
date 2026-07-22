import type {
  ComponentState,
  CoverageReport,
  DesignCoverageInput,
  StateSpace,
} from "./types.js";

/** Deterministic state id from axis values, in axis-declaration order. */
export function stateId(space: StateSpace, values: Record<string, string>): string {
  return space.axes.map((a) => values[a.name]).join(".");
}

/**
 * Expand the full cartesian product of the axes, then filter by constraints. Ordering is
 * stable (first axis outermost), so state ids and report ordering never shift between
 * runs — same property the matrix generator guarantees for cells.
 */
export function enumerateStates(space: StateSpace): ComponentState[] {
  if (space.axes.length === 0) return [];

  let combos: Record<string, string>[] = [{}];
  for (const axis of space.axes) {
    const next: Record<string, string>[] = [];
    for (const combo of combos) {
      for (const value of axis.values) {
        next.push({ ...combo, [axis.name]: value });
      }
    }
    combos = next;
  }

  const constraints = space.constraints ?? [];
  return combos
    .filter((values) => constraints.every((ok) => ok(values)))
    .map((values) => ({ id: stateId(space, values), values }));
}

/**
 * Compare the enumeration against what design actually depicts → the coverage report.
 * "Design covers X of Y realistic states" — the single number that is the pitch (PRD §6).
 */
export function coverage(space: StateSpace, input: DesignCoverageInput): CoverageReport {
  const states = enumerateStates(space);
  const byId = new Map(states.map((s) => [s.id, s]));

  const claimed = new Set(input.coveredStateIds);
  const unknownIds = [...claimed].filter((id) => !byId.has(id));
  const coveredStates = states.filter((s) => claimed.has(s.id));
  const uncoveredStates = states.filter((s) => !claimed.has(s.id));

  return {
    component: space.component,
    total: states.length,
    covered: coveredStates.length,
    headline: `${coveredStates.length}/${states.length}`,
    coveredStates,
    uncoveredStates,
    unknownIds,
  };
}
