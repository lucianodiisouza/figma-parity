# Phase 0 — MVP

> **The MVP exists to measure one number: the semantic-diff false-positive rate.**
> Not to build a product. If we can't drive that rate low, the tool isn't real — and
> it's cheaper to learn that on one component than after building four pieces.

From [PRD.md](PRD.md) §7. This is the plan of record for the MVP.

## Scope (hard boundaries)

- **Piece 3 only** (runtime-parity harness). No anchors store, no token sync, no enumeration yet.
- **One component.** Must have realistic runtime states and an existing Figma frame.
- **Simulator/emulator only.** No real-device farm.
- **Reduced 8-cell matrix:** light/dark × default/largest dynamic type × LTR/RTL.
- **One hand-authored anchor.** No inference.

## Flow

```
1. Component + Figma frame + hand-authored anchor
2. Render 8 matrix cells in Expo → capture frames out-of-band
3. Pass 1 diff: structural + perceptual hash  vs  Figma intent
4. Escalate ONLY failing cells (failing crop only) → LLM: intent vs bug?
5. Emit divergence manifest with severity
```

Steps 2–3 are pure data plane. Only step 4 touches a model, and only with a ~200px crop.

## Success criterion (the gate)

**MVP is successful iff** we can:
1. Quantify the false-positive rate on a **labeled set of real components**, and
2. Show a credible path to keeping it low.

Everything below serves that. A working demo that *doesn't* produce a measured FP rate
is a failed MVP.

## The eval harness (most important artifact)

The labeled set is the deliverable, not the pretty output.

- **Labels per rendered state:** `match` | `divergence:intent` | `divergence:bug`.
- **Metric:** false-positive rate = (states the tool flagged as a bug that are actually
  `match` or `divergence:intent`) / (all non-bug states). Precision is primary; recall secondary.
- **Threshold:** to be set during labeling (open-question Q-001). PRD's warning: if it
  cries wolf even ~10% of the time, engineers mute it within a week.
- **Output:** a report — FP rate, recall, per-cell breakdown, and the crops that caused
  false positives (for prompt/threshold tuning).

## What "design intent" is compared against

Unresolved — see open-question Q-003. Candidates: the normalized IR, an annotated frame,
or both. **Decide this before building the diff engine**, because it defines the diff's
left-hand side.

## De-risking order within Phase 0

1. IR schema + ground-truth format (blocks everything).
2. Render + capture one cell reliably (proves the data plane).
3. Pass 1 diff on that one cell.
4. Expand to 8 cells.
5. Escalation + LLM judgment.
6. Labeled set + FP measurement.

## Explicitly deferred

Cloud device farm, full matrix, anchors store, token sync, enumeration, CI surface,
bidirectional sync, per-component prompt tuning (unless step 6 proves one prompt can't
generalize — open-question Q-004).

## Known risks this phase confronts

- **R-1 Semantic-diff false positives** — the entire reason this phase exists.
- **R-4 Render fidelity** — simulator captures may not match real devices for safe-area /
  dynamic-type. Note discrepancies; plan real-device path for Phase 4.
