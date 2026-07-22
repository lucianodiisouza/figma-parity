# Figma↔Expo Parity Harness

A continuous reconciliation and runtime-parity layer that proves whether a running
Expo app matches its Figma design intent — **across the state space Figma cannot express.**

> Not a codegen tool. Not a pixel-diff tool. It audits the gap between design intent
> and runtime reality across the states nobody drew.

## Status

Pre-implementation. Planning docs are in [`docs/`](docs/). The full product spec is
[`docs/PRD.md`](docs/PRD.md).

The single risk that decides whether this product exists is the **semantic-diff
false-positive rate**. Everything is phased to confront that first — see
[`docs/phase-0-mvp.md`](docs/phase-0-mvp.md).

## The four pieces (build order)

| # | Piece | What it does | Phase |
|---|-------|--------------|-------|
| 1 | **Anchors** | Persistent Figma-node ↔ code-binding map (source-map for design↔code) | Phase 2 |
| 2 | **Token sync** | Figma Variables ↔ `theme.ts`, PR bot | Phase 3 |
| 3 | **Runtime-parity harness** ⭐ | Render Expo across a matrix, semantically diff vs intent | **Phase 0/4** |
| 4 | **State enumeration** | "Design covers 3 of 19 realistic states" | Phase 1 |

Note the build order is deliberately *not* 1→4. We start at Piece 3 (the crown jewel)
on one component because that is where the killing risk lives.

## Docs index

- [PRD.md](docs/PRD.md) — the product requirements (source of truth)
- [architecture.md](docs/architecture.md) — component map, control/data plane, **stack recommendation**
- [ir-schema.md](docs/ir-schema.md) — the normalized IR, the contract everything speaks
- [matrix.md](docs/matrix.md) — the runtime matrix (the reduced 8-cell MVP subset)
- [roadmap.md](docs/roadmap.md) — phases → epics → concrete tasks
- [phase-0-mvp.md](docs/phase-0-mvp.md) — the MVP that de-risks false positives
- [glossary.md](docs/glossary.md) — shared vocabulary (anchor, IR, cell, escalation…)
- [decision-log.md](docs/decision-log.md) — decisions made and why
- [open-questions.md](docs/open-questions.md) — unresolved questions, owned and dated

## Guiding principles (from the PRD)

1. **The LLM does almost nothing.** It earns tokens only at the irreducibly fuzzy core:
   *"is this rendered state broken, and is this mismatch intent or bug?"*
2. **MCP is control plane, never data plane.** Only compact manifests cross the agent boundary.
3. **Delta, never full-tree.** Anchors make every reconciliation a small diff.
4. **Escalate, don't stream.** Deterministic vision first; only failing crops reach a model.
5. **Precision over recall.** A missed divergence is tolerable. A false alarm is fatal.
