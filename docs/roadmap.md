# Roadmap

Phases follow [PRD.md](PRD.md) §11. The ordering is intentional: **confront the
false-positive risk before building anything else.** Each phase lists epics → concrete
tasks. Checkboxes are the working backlog.

Legend: `▲` = gate that must pass before the next phase starts.

---

## Phase 0 — MVP: measure the false-positive rate

Piece 3 on **one component**, **simulator only**, **reduced 8-cell matrix**
(light/dark × default/largest dynamic type × LTR/RTL). Full detail in
[phase-0-mvp.md](phase-0-mvp.md).

**Exit gate ▲:** we can quantify semantic-diff false-positive rate on a labeled set of
real components and show a credible path to keeping it low. If not — stop; the tool isn't real.

### Epic 0.1 — Repo & IR contract
- [ ] Ratify monorepo shape + stack (decision-log D-002)
- [ ] Define the normalized IR schema in `packages/ir` (layout, tokens, hierarchy, bindings)
- [ ] Pick the ground-truth format for "design intent" (open-question Q-003)

### Epic 0.2 — Single-component setup
- [ ] Choose the one component (needs realistic states + an existing Figma frame)
- [ ] Author its anchor by hand (one binding, no inference yet)
- [ ] Extract its IR from Figma

### Epic 0.3 — Render & capture (data plane)
- [ ] Define the 8-cell matrix as data
- [ ] Drive Expo to render each cell on a simulator (iOS first)
- [ ] Capture frames out-of-band → object storage, addressed by hash/handle

### Epic 0.4 — Diff engine
- [ ] Pass 1: structural diff (IR vs captured layout) + perceptual hash
- [ ] Escalation rule: which cells/crops are promoted to pass 2
- [ ] Pass 2: LLM judges failing crop only → intent-vs-bug verdict + severity
- [ ] Emit divergence manifest (kilobytes)

### Epic 0.5 — Eval harness (the actual deliverable of Phase 0)
- [ ] Build a labeled set: real component states tagged match / divergence(intent) / divergence(bug)
- [ ] Runner computes precision / false-positive rate against labels
- [ ] Report FP rate + set the concrete "keep it on" threshold (open-question Q-001)

---

## Phase 1 — State-space enumeration (the demo)

Piece 4 on the same component. Produces the "**Design covers 3 of 19 realistic states**" number.

**Exit gate ▲:** enumeration matches a labeled ground-truth state set; coverage number is trustworthy.

### Epic 1.1 — Enumerator
- [ ] Read the component's real TS props
- [ ] Combinatorially generate states: loading / empty / error / 0-1-N / overflow / RTL / long-string
- [ ] Map which enumerated states the Figma frame(s) actually cover

### Epic 1.2 — Coverage report
- [ ] Render enumerated states into the harness
- [ ] Emit "X of Y states covered" + per-state divergence
- [ ] Ground-truth check against a labeled state set

---

## Phase 2 — Anchors as a durable store

Piece 1. Generalize beyond one component.

- [ ] Design the in-repo anchor format (queryable, versioned)
- [ ] Anchor authoring strategy: hand / inferred / hybrid (open-question Q-002)
- [ ] Make anchors survive refactors + design restructures (anchor-drift is risk R-2)
- [ ] Migrate hand-authored MVP anchor into the store
- [ ] Delta reconciliation driven by anchors (never full-tree)

---

## Phase 3 — Token sync + PR bot

Piece 2.

- [ ] Figma Variables → `theme.ts` mapping
- [ ] PR bot emits **token-only** diffs (never a regenerated component)
- [ ] Bidirectional: `theme.ts` change → Figma Variable proposal
- [ ] Tie into anchors so a token change reconciles only affected bindings

---

## Phase 4 — Scale-out

- [ ] Full matrix (add iOS/Android × device sizes × EN/long-string locale × more)
- [ ] Real-device farm (addresses render-fidelity risk R-4)
- [ ] CI integration surface (PR comment / check annotation)
- [ ] North-star: teams leave it enabled in CI after two weeks

---

## Cross-cutting (all phases)

- [ ] Keep manifests kilobyte-sized across MCP (metric, PRD §9)
- [ ] Keep tokens/reconciliation bounded & flat vs document size (metric, PRD §9)
- [ ] Track precision as the primary metric; recall secondary
