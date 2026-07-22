# PRD: Figma↔Expo Parity Harness

**Status:** Draft v1 — ready for scoping in Claude Code
**Owner:** _[you]_
**Type:** Open-source developer tool
**One-liner:** A continuous reconciliation and runtime-parity layer that proves whether a running Expo app matches its Figma design intent — across the state space Figma cannot express.

---

## 1. Problem

The Figma→Expo handoff is one-way and lossy. The instant an engineer edits the generated code, the link to the design is severed. From then on, every design change is reconciled by a human eyeballing a PR. Design and code drift silently and permanently, and **no artifact anywhere proves the running app matches intent.**

Two compounding failures:

1. **No persistent identity across the boundary.** Existing tools re-diff the whole tree on every change because the mapping between a Figma node and a code binding is lost after export. There is no source-map equivalent for design↔code.

2. **Figma is a static idealization with no runtime.** It has no concept of safe-area insets, keyboard avoidance, dynamic type, RTL, i18n string expansion, or loading/empty/error/overflow states. A designer hands over 3 frames; the engineer ships 30 states. The ~27 nobody drew are exactly where bugs live — and there is no shared source of truth for them.

The result: teams cannot answer "does the app match the design?" with anything better than manual review and hope.

## 2. What this is NOT

- **Not a Figma-to-code generator.** That space is crowded (Locofy, Anima, Builder.io, Figma Dev Mode + Code Connect) and structurally mediocre. We do not compete on codegen.
- **Not a pixel-diff visual regression tool.** Chromatic/Percy diff code-vs-code baselines. We diff *running-app-on-real-device vs design intent, across a runtime matrix*. Naive pixel diff is pure noise here and is explicitly rejected.

The value proposition inverts from "build my UI" to **"audit the gap between intent and reality across the states the designer never enumerated."**

## 3. Goals & non-goals

### Goals
- Detect and report divergence between a running Expo screen and its Figma intent.
- Enumerate the realistic runtime state space for a component and report design coverage.
- Keep design tokens in lockstep between Figma Variables and the Expo theme.
- Do all of the above with a **false-positive rate low enough that engineers keep it on.**

### Non-goals (v1)
- Generating production component code from scratch.
- Supporting web/React (React Native + Expo only for v1).
- Fully automated "fix the code" — v1 reports and proposes, humans merge.
- Real-device cloud farm at launch — start with simulators/emulators (see §7).

## 4. Users

- **Primary:** Product engineers on Expo/React Native teams who own the design↔code boundary.
- **Secondary:** Product designers who want to see which states they haven't specified.
- **Tertiary:** Eng leads / design-systems teams enforcing parity in CI.

## 5. Product principles

1. **The LLM does almost nothing.** Anchoring, token sync, matrix rendering, and state enumeration are deterministic systems work. The model earns tokens only at the irreducibly fuzzy core: *"is this rendered state broken, and is this mismatch intent or bug?"* Spending tokens anywhere else is a design smell.
2. **MCP is control plane, never data plane.** Heavy render/capture/diff work runs out-of-band; only compact manifests cross the agent boundary.
3. **Delta, never full-tree.** Anchors make every reconciliation a small diff.
4. **Escalate, don't stream.** Deterministic vision runs first; only failures — and only the failing crop — reach a model.
5. **Precision over recall.** A missed divergence is tolerable. A false alarm is fatal to adoption.

## 6. Scope — the four pieces (build order)

### Piece 1 — Stable design↔code anchors
Persistent bindings between a Figma node ID and a code component/prop, analogous to source maps across the boundary. Anchors are the enabling primitive: they turn full-tree reconciliation into cheap delta reconciliation.
- Anchors persist across design edits and code edits.
- Stored in-repo (versioned alongside code).
- Figma Code Connect is a shallow seed of this concept; we extend it into a durable, queryable map.

### Piece 2 — Bidirectional token sync
Figma Variables ↔ Expo `theme.ts` kept in lockstep.
- A token change (e.g. color ramp) opens a PR containing **only the token diff**, never a regenerated component.
- Table-stakes plumbing, but it stops the slow drift. Partially adjacent to Style Dictionary; differentiation is the tie into anchors + PR automation.

### Piece 3 — Runtime-parity harness (crown jewel)
Renders the real Expo screen across a runtime matrix, captures running frames, and semantically diffs against Figma intent.
- **Matrix axes:** iOS/Android × light/dark × default/largest dynamic type × smallest/largest device × LTR/RTL × EN/long-string locale.
- Reports things Figma literally cannot represent, e.g. "CTA sits 4px low — dropped safe-area inset," "label truncates at largest dynamic type; no frame covers this."
- Semantic diff, not pixel diff.

### Piece 4 — State-space enumeration (the demo piece)
Feed it one Figma frame + the component's real TypeScript props; it auto-renders loading / empty / error / 0-1-N items / overflow / RTL variants into the harness and returns a coverage report:
> **"Design covers 3 of 19 realistic states."**

That single number is the pitch. Enumeration is combinatorial, not inferential — no model needed to produce the state list.

## 7. MVP — de-risk the one thing that can kill this

**The binding risk is semantic-diff false-positive rate**, not tokens (known solutions) and not MCP (a layering mistake you just avoid). So the MVP exists to measure and drive down that rate before anything else is built.

**MVP scope:** Piece 3 only, on a **single component**, on **simulator/emulator** (no cloud device farm yet), across a **reduced matrix** (light/dark × default/largest dynamic type × LTR/RTL — 8 cells).

**MVP flow:**
1. Take one Expo component with an existing Figma frame and a hand-authored anchor.
2. Render the 8 matrix cells in Expo, capture frames out-of-band.
3. Run deterministic first-pass diff (structural + perceptual hash) against the Figma intent.
4. Escalate only failing cells (failing crop only) to an LLM for the intent-vs-bug judgment.
5. Emit a manifest of divergences with severity.

**MVP is successful iff** we can quantify false-positive rate on a labeled set of real components and show a path to keeping it low. If we can't, the whole tool is not real — better to learn that on one component than after building four pieces.

## 8. Architecture

### Control plane vs data plane
- **Data plane (out-of-band, no LLM/MCP):** matrix render, frame capture, perceptual hashing, structural comparison. Writes screenshots + intermediate artifacts to object storage, referenced by hash/handle.
- **Control plane (MCP/agent):** receives a compact manifest only — e.g. `{ coverage: "3/19", mismatches: 2, crops: [handle, handle] }`. Kilobytes, not megabytes. Raw pixels never enter the context window or ride an MCP call. Connection count becomes irrelevant.

### Token budget strategy
1. **Normalized IR, not raw Figma JSON.** Strip Figma node JSON to the semantic skeleton (layout, tokens, hierarchy, bindings) — drops ~an order of magnitude before anything reaches a model.
2. **Anchors → delta reconciliation.** Never diff the tree; send the changed subtree + its anchor. A color-ramp change is a few hundred tokens.
3. **Escalate, don't stream.** Deterministic vision runs first; only failures reach the model, and only the specific failing crop (e.g. ~200px), never the full frame or matrix.

### Rough component map
- **Extractor:** Figma REST/plugin → normalized IR.
- **Anchor store:** in-repo, versioned map of Figma node ↔ code binding.
- **Token sync:** Figma Variables ↔ `theme.ts`, PR bot.
- **Renderer/farm:** Expo render across matrix → captures to object storage.
- **Diff engine:** deterministic (structural + pHash) first pass → LLM escalation for failures only.
- **Reporter:** coverage + divergence manifest; CI annotation / PR comment surface.
- **Agent interface (MCP):** thin control-plane tools over manifests.

## 9. Success metrics

| Metric | Target |
|---|---|
| Semantic-diff false-positive rate | The number that decides viability — must be low enough to keep on (set concrete threshold during MVP labeling) |
| True divergences caught (recall) | High enough to be useful, but secondary to precision |
| State-space coverage reported | Accurate enumeration vs a labeled ground-truth set |
| Tokens per reconciliation | Bounded and roughly flat regardless of document size (proves the delta/IR/escalation strategy works) |
| Manifest size across MCP | Kilobytes per run |

**North-star adoption signal:** teams leave it enabled in CI after two weeks.

## 10. Risks

1. **Semantic-diff false positives (critical, unsolved).** No clean dodge; it's an ML precision problem. The MVP is built specifically to confront it first. If it cries wolf even ~10% of the time, engineers mute it within a week and the tool is dead.
2. **Anchor drift.** Bindings must survive refactors and design restructures; a brittle anchor scheme silently degrades into full-tree diffing.
3. **Overlap with incumbents on pieces 1–2.** Code Connect (anchors) and Style Dictionary (tokens) partially exist; differentiation lives in pieces 3–4. Don't over-invest in re-solving 1–2.
4. **Render fidelity.** Simulator captures may not match real-device rendering for the exact things we care about (safe areas, dynamic type). Plan a path to real devices post-MVP.

## 11. Phasing

- **Phase 0 (MVP):** Piece 3 on one component, reduced matrix, simulator. Measure false-positive rate. Ship a labeled eval harness.
- **Phase 1:** Piece 4 state enumeration + coverage report on the same component. The "3 of 19" demo.
- **Phase 2:** Piece 1 anchors as a durable in-repo store; generalize beyond one component.
- **Phase 3:** Piece 2 token sync + PR bot.
- **Phase 4:** Full matrix, real-device farm, CI integration surface.

## 12. Open questions

- What is the concrete false-positive threshold that defines "keep it on"? (Decide during Phase 0 labeling.)
- Anchor authoring: hand-authored, inferred, or hybrid — and how are they kept valid through refactors?
- What is the ground-truth format for "design intent" the diff compares against — the IR, an annotated frame, or both?
- Does the semantic diff need per-component tuning, or can one model prompt generalize?
- Object-storage + hash-handle scheme for captures: what's the retention and addressing model?

---

_This PRD deliberately front-loads the false-positive risk. Everything else is architecture with known solutions; that one is the question that decides whether the product exists._
