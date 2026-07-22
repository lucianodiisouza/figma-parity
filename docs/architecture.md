# Architecture

Derived from [PRD.md](PRD.md) §8. This doc adds the concrete stack recommendation the
PRD deliberately left open.

## Control plane vs data plane (non-negotiable boundary)

```
                        ┌─────────────────────────────────────────────┐
   DATA PLANE           │  Heavy, out-of-band, NO LLM / NO MCP         │
   (megabytes)          │                                             │
                        │  Extractor → Normalized IR                  │
                        │  Renderer  → matrix render → frame capture  │
                        │  Diff (pass 1): structural + perceptual hash │
                        │  Artifacts (screenshots, crops) → object    │
                        │  storage, addressed by hash/handle          │
                        └──────────────────┬──────────────────────────┘
                                           │ compact manifest only
                                           │ { coverage:"3/19",
                                           │   mismatches:2,
                                           │   crops:[handle,handle] }
                                           ▼   (kilobytes)
                        ┌─────────────────────────────────────────────┐
   CONTROL PLANE        │  MCP / agent — thin tools over manifests    │
   (kilobytes)          │  Diff (pass 2): LLM judges failing crop only │
                        │  Reporter → coverage + divergence report     │
                        └─────────────────────────────────────────────┘
```

**Rule:** raw pixels never enter the context window or ride an MCP call. If a design
choice pushes bytes across that line, it is wrong.

## Component map

| Component | Responsibility | Plane |
|-----------|----------------|-------|
| **Extractor** | Figma REST/plugin → normalized IR (semantic skeleton only) | Data |
| **Anchor store** | In-repo, versioned Figma-node ↔ code-binding map | — (git) |
| **Token sync** | Figma Variables ↔ `theme.ts`; PR bot emits token-only diffs | Both |
| **Renderer/farm** | Render Expo across matrix → capture frames → object storage | Data |
| **Diff engine** | Pass 1 deterministic (structural + pHash); pass 2 LLM on failures | Data→Control |
| **Reporter** | Coverage + divergence manifest; CI annotation / PR comment | Control |
| **Agent interface (MCP)** | Thin control-plane tools over manifests | Control |

## Token-budget strategy (PRD §8)

1. **Normalized IR, not raw Figma JSON** — strip to layout/tokens/hierarchy/bindings
   (~1 order of magnitude smaller) before anything reaches a model.
2. **Anchors → delta reconciliation** — never diff the tree; send the changed subtree
   + its anchor.
3. **Escalate, don't stream** — only the specific failing crop (~200px) reaches the model.

Target: tokens/reconciliation bounded and roughly flat regardless of document size.

---

## Recommended stack

The PRD left the runtime open. Recommendation, grounded in its own emphasis
("deterministic vision first, LLM only at the fuzzy core"):

### **TypeScript/Node for everything except the deterministic vision pass.**

| Layer | Choice | Why |
|-------|--------|-----|
| MCP server / agent interface | **TypeScript** | The official MCP SDK is TS-first; keeps the control plane in one language. |
| Extractor (Figma REST/plugin) | **TypeScript** | Figma plugin API and REST typings are native TS; IR types shared with the rest. |
| Renderer / capture orchestration | **TypeScript** driving Expo | The app under test is RN/Expo. Drive simulators via `xcrun simctl` / `adb` + Expo tooling; no language mismatch. |
| Structural diff | **TypeScript** | Operates on the IR (JSON) — no ML needed. |
| Perceptual-hash pass 1 | **TypeScript** (`sharp` + a pHash lib) or a **thin Rust/native** helper | Pure image math; `sharp` (libvips) is fast enough for MVP. Escalate to native only if it becomes the bottleneck. |
| LLM escalation (pass 2) | **TypeScript** calling the Anthropic API | Sends only the failing crop + IR context. This is the *only* place a model runs. |
| Token sync / PR bot | **TypeScript** | GitHub Octokit + Style-Dictionary-style transforms are TS-native. |

**Why not a TS+Python split (the other option considered):** the only pull toward Python
is the ML/vision ecosystem. But the PRD's design keeps ML deliberately tiny — pass 1 is
plain perceptual hashing + structural JSON diff (no Python advantage), and pass 2 is a
hosted LLM call (language-agnostic). A second language would add a cross-process boundary,
a second toolchain, and serialization overhead to buy almost nothing. **Keep it one
language; reach for a native/Rust module only if pHash profiling proves it's needed** —
that's a smaller, more surgical escape hatch than a whole Python service.

### Monorepo shape (proposed — not yet scaffolded)

```
packages/
  ir/            # shared normalized-IR types + schema (the contract everything speaks)
  extractor/     # Figma → IR
  anchor-store/  # read/write/validate the in-repo anchor map
  renderer/      # matrix definition + Expo render/capture orchestration
  diff/          # pass 1 (structural + pHash) and pass 2 (LLM escalation)
  reporter/      # coverage + divergence manifest, CI/PR surface
  mcp-server/    # thin control-plane tools over manifests
  token-sync/    # Figma Variables ↔ theme.ts + PR bot
apps/
  example-expo/  # the single component + Figma frame used through Phase 0/1
eval/
  harness/       # labeled-set runner that measures false-positive rate (Phase 0 core)
```

Tooling: pnpm workspaces + TypeScript project references, `tsup`/`tsc` builds, `vitest`.
This is a **recommendation to ratify**, not a committed decision — see
[decision-log.md](decision-log.md) D-002.
