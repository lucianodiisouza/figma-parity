# HANDOFF — resume-from-anywhere tracker

> **Purpose:** this file is the single source of truth for build state. If you're a new
> agent/IDE picking this up (e.g. the previous session hit a token limit), read this file
> top to bottom, then `docs/`, then continue from **▶ NEXT UP**. Keep this file updated as
> you work — it is the contract that makes IDE-switching safe.

**Last updated:** 2026-07-22
**Current phase:** Phase 0 (MVP) — see [docs/phase-0-mvp.md](docs/phase-0-mvp.md)
**Build mode:** autonomous, zero-to-hero, sensible order, granular commits.

---

## How to resume (do this first)

1. Read this file, then `README.md`, then `docs/roadmap.md` + `docs/phase-0-mvp.md`.
2. `git log --oneline | head -30` to see exactly what landed.
3. Ensure toolchain: Node ≥ 22, pnpm ≥ 10. Run `pnpm install` at repo root.
4. Run `pnpm -r build && pnpm -r test` to confirm a green baseline.
5. Continue from **▶ NEXT UP** below. Commit granularly. Update this file when a step lands.

## Conventions

- **Stack:** TypeScript/Node, pnpm workspaces + TS project references. (decision D-002)
- **Commits:** one logical change each, conventional-commit prefixes (`feat:`/`docs:`/`chore:`/`test:`).
- **No secrets in repo.** Figma token / Anthropic key come from env (`.env`, gitignored).
- **Plane discipline:** heavy work (render/capture/diff) never crosses MCP; only manifests do.

---

## Build ledger (what's DONE)

| # | Item | Commit theme | State |
|---|------|--------------|-------|
| — | Planning docs (PRD, arch, roadmap, glossary, decisions, open-qs) | `docs:` | ✅ done |
| — | IR schema draft + matrix definition | `docs:` | ✅ done |
| B1 | Workspace scaffold + `@parity/ir` (types + traversal, tested) | `feat:` | ✅ done |
| B2 | `@parity/matrix` (8-cell MVP matrix + cartesian generator, tested) | `feat:` | ✅ done |
| B3 | `@parity/manifest` (divergence manifest + eval labels, zod, tested) | `feat:` | ✅ done |
| B4 | `@parity/fixtures` (PrimaryButton: component, IR, anchors, labels) | `feat:` | ✅ done |
| B6 | `@parity/capture` (data-plane contract) + `@parity/diff` pass 1 (structural + pHash) | `feat:` | ✅ done |
| B7 | `@parity/escalate` pass 2 — MockJudge (headless) + AnthropicJudge (claude-opus-4-8) | `feat:` | ✅ done |
| B8 | `@parity/reporter` — end-to-end pipeline (pass1→escalate→manifest) + human report | `feat:` | ✅ done |
| B9 | `@parity/eval-harness` — false-positive-rate gate; full-stack test on fixture labels | `feat:` | ✅ done |

_(code items get appended here as they land)_

## ▶ NEXT UP (ordered build plan)

Phase 0 critical path. Check off as completed; keep the top unchecked item as the cursor.

- [x] **B1 — Workspace scaffold.** pnpm workspace, root tsconfig (project refs), shared
      `packages/ir` with the IR types from [docs/ir-schema.md](docs/ir-schema.md). Vitest wired.
- [x] **B2 — Matrix package.** `packages/matrix`: the 8-cell reduced matrix as data +
      cartesian generator (from [docs/matrix.md](docs/matrix.md)). Unit-tested.
- [x] **B3 — Manifest + label schemas.** `packages/manifest`: the kilobyte divergence
      manifest that crosses MCP, and the eval-harness label format. Zod-validated.
- [x] **B4 — Fixture component + IR.** `packages/fixtures`: PrimaryButton component,
      hand-authored anchors, checked-in IR document, and ground-truth labels. (Q-006 stand-in)
- [ ] **B5 — Renderer/capture orchestration (data plane).** Drive an iOS sim across the 8
      cells, capture frames to a local object store addressed by hash. Simulator-gated;
      provide a `--dry-run` that emits deterministic fake captures so CI/logic works headless.
- [x] **B6 — Diff pass 1 (deterministic).** Structural diff (captured tree vs IR) + pHash.
      Pure functions over fixtures; no device needed. Added `@parity/capture` shared contract.
- [x] **B7 — Escalation + diff pass 2 (LLM).** `@parity/escalate`: `Judge` interface,
      `MockJudge` (rule-based, headless), `AnthropicJudge` (claude-opus-4-8, crop-only).
      NOTE: real judge needs `ANTHROPIC_API_KEY`; tests + dry-run use MockJudge.
- [x] **B8 — Reporter.** `@parity/reporter`: `runParity` pipeline (pass1 → escalate →
      manifest) + `renderReport` human output. First true end-to-end test lives here.
- [x] **B9 — Eval harness.** `eval/harness`: `evaluate()` → FP rate / precision / recall vs
      the labeled set; `renderEvalReport()` with a pass/fail gate. The Phase 0 gate.
- [ ] **B10 — MCP server.** Thin control-plane tools over manifests only.

After B9 we can answer the question that decides whether the product exists.

## Decisions still owned by the human (not blocking the build)

- **Q-003** ground-truth format (IR alone vs IR + annotation layer). Building assumes
  **IR + optional annotation layer**; annotations stubbed until decided.
- **Q-006** real MVP component. Using a fixture component until you name a real one.
- **Q-001** false-positive threshold — an *output* of B9, set during labeling.

## Known gotchas / environment notes

- Real capture (B5) needs Xcode + an iOS simulator on macOS. All non-capture logic is
  designed to run headless via fixtures/dry-run so token-limited sessions can still progress.
