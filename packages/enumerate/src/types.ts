/**
 * State-space enumeration (Piece 4, PRD §6). Enumeration is combinatorial, not
 * inferential — no model produces the state list. Feed it the component's prop-space
 * description; it expands the realistic states and reports which ones design covers.
 */

/** One axis of a component's state space, e.g. content = empty | one | many | overflow. */
export interface StateAxis {
  /** Axis name, e.g. "data", "content", "direction". */
  name: string;
  /** The realistic values along this axis, e.g. ["loading", "loaded", "error"]. */
  values: readonly string[];
}

/**
 * A predicate ruling out unrealistic combinations (e.g. loading × overflow-text is not a
 * state anyone can reach). Return false to exclude. Keeping exclusions explicit — rather
 * than hand-listing states — keeps the enumeration honest and auditable.
 */
export type StateConstraint = (state: Readonly<Record<string, string>>) => boolean;

/** One fully-specified realistic state. */
export interface ComponentState {
  /** Stable id, e.g. "data=loaded content=overflow direction=rtl" → "loaded.overflow.rtl". */
  id: string;
  /** Axis name → value. */
  values: Record<string, string>;
}

/** The component's declared state space. */
export interface StateSpace {
  component: string;
  axes: StateAxis[];
  constraints?: StateConstraint[];
}

/** Which enumerated states a Figma frame covers, by state id. */
export interface DesignCoverageInput {
  /** State ids that at least one Figma frame depicts. */
  coveredStateIds: readonly string[];
}

export interface CoverageReport {
  component: string;
  /** Total realistic states after constraints. */
  total: number;
  covered: number;
  /** The pitch number as a string, e.g. "3/19". */
  headline: string;
  coveredStates: ComponentState[];
  /** The states nobody drew — exactly where bugs live (PRD §1). */
  uncoveredStates: ComponentState[];
  /** Claimed-covered ids that don't exist in the enumeration (labeling mistakes). */
  unknownIds: string[];
}
