/**
 * The PrimaryButton's realistic state space, derived from its real props
 * (PrimaryButton.tsx: `loading`, `disabled`) plus the runtime axes Figma cannot express
 * (long-string locale expansion, RTL). This is Piece 4's input: the enumeration is the
 * cartesian product of these axes minus explicitly-unreachable combinations.
 *
 * The types live in @parity/enumerate; declaring the space here keeps the fixture the
 * single source of truth for everything about the MVP component.
 */

/** Axis values mirror the component's actual behavior, not designer imagination. */
export const primaryButtonStateSpace = {
  component: "PrimaryButton",
  axes: [
    // From props: loading and disabled both render the inert style; loading also swaps
    // the label for a spinner. Three reachable interaction states.
    { name: "interaction", values: ["default", "loading", "disabled"] as const },
    // Content axis: design-time string, long-locale expansion, and overflow.
    { name: "content", values: ["short", "long", "overflow"] as const },
    { name: "direction", values: ["ltr", "rtl"] as const },
  ],
  constraints: [
    // While loading the label is replaced by a spinner (see PrimaryButton.tsx), so
    // long/overflow content states are unreachable in the loading interaction state.
    (s: Readonly<Record<string, string>>) =>
      !(s["interaction"] === "loading" && s["content"] !== "short"),
  ],
};

/**
 * What the designer actually drew: three frames — default, loading, disabled — all
 * short-label LTR. Everything else is the un-drawn state space where bugs live.
 */
export const primaryButtonDesignedStates: readonly string[] = [
  "default.short.ltr",
  "loading.short.ltr",
  "disabled.short.ltr",
];
