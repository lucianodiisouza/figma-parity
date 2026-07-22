# Decision log

Append-only record of decisions and their rationale. `Proposed` = recommendation awaiting
ratification; `Accepted` = ratified.

---

### D-001 — Build order is Piece 3 → 4 → 1 → 2, not 1 → 4
**Status:** Accepted (from PRD §6/§7/§11)
**Decision:** Start at the runtime-parity harness (Piece 3) on one component, not at anchors.
**Why:** The binding risk is the semantic-diff false-positive rate. Anchors and token sync
have known solutions; confronting the unsolved risk first avoids building four pieces on a
foundation that might not exist.

---

### D-002 — Single-language stack (TypeScript), native escape hatch for pHash only
**Status:** Proposed (awaiting ratification — Epic 0.1)
**Decision:** TypeScript/Node for extractor, renderer orchestration, diff, reporter, MCP
server, token sync. Reach for a native/Rust module *only* if perceptual-hash profiling
proves it's a bottleneck. No Python service.
**Why:** The PRD keeps ML deliberately tiny — pass 1 is structural JSON diff + perceptual
hashing (no Python advantage), pass 2 is a hosted LLM call (language-agnostic). A second
language buys almost nothing and adds a cross-process boundary + serialization cost. See
[architecture.md](architecture.md#recommended-stack).
**Revisit if:** pHash becomes the bottleneck, or a needed vision technique has no viable TS lib.

---

### D-003 — MCP is control plane only; raw pixels never cross the agent boundary
**Status:** Accepted (from PRD §5/§8)
**Decision:** Heavy render/capture/diff runs out-of-band; only kilobyte manifests reach
the agent/MCP. Artifacts live in object storage, referenced by hash/handle.
**Why:** Keeps token cost bounded and flat vs document size, and makes MCP connection
count irrelevant. Any design that pushes bytes across this line is rejected.

---

<!-- Template for new entries:

### D-00X — <short title>
**Status:** Proposed | Accepted | Superseded by D-00Y
**Decision:** <what was decided>
**Why:** <rationale>
**Revisit if:** <trigger>

-->
