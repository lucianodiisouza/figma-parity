# Glossary

Shared vocabulary so docs, code, and manifests use the same words.

| Term | Meaning |
|------|---------|
| **Anchor** | A persistent binding between a Figma node ID and a code component/prop. The source-map primitive across the design↔code boundary. Stored in-repo, versioned. |
| **Anchor drift** | Degradation of anchors through refactors/design restructures until reconciliation silently falls back to full-tree diffing. Risk R-2. |
| **Normalized IR** | The semantic skeleton of a Figma node — layout, tokens, hierarchy, bindings — stripped of raw Figma JSON. ~1 order of magnitude smaller. The contract everything speaks. |
| **Matrix** | The runtime state space rendered per component. Axes: OS × light/dark × dynamic type × device size × LTR/RTL × locale. |
| **Cell** | One point in the matrix — a single concrete rendering configuration (e.g. iOS · dark · largest type · RTL). |
| **Reduced matrix** | The 8-cell MVP subset: light/dark × default/largest dynamic type × LTR/RTL. |
| **Data plane** | Out-of-band work with no LLM/MCP: render, capture, perceptual hash, structural diff. Deals in megabytes. |
| **Control plane** | The agent/MCP side. Receives only compact manifests. Deals in kilobytes. |
| **Pass 1 diff** | Deterministic first pass: structural (IR) diff + perceptual hash. No model. |
| **Pass 2 diff** | LLM judgment, invoked *only* on failing cells, seeing *only* the failing crop. Answers "intent or bug?". |
| **Escalation** | Promoting a failing cell from pass 1 to pass 2. "Escalate, don't stream." |
| **Crop** | The specific failing region (~200px) sent to the model — never the full frame. |
| **Manifest** | The kilobyte-sized summary that crosses the agent boundary, e.g. `{coverage:"3/19", mismatches:2, crops:[handle,handle]}`. |
| **Divergence** | A detected gap between rendered state and design intent, classified intent vs bug, with severity. |
| **Coverage** | How many realistic runtime states the design actually specifies, e.g. "3 of 19". Piece 4's headline number. |
| **False positive** | The tool flags a bug where there is none (a `match` or `divergence:intent`). The metric that decides viability. |
| **State enumeration** | Combinatorial generation of realistic states (loading/empty/error/0-1-N/overflow/RTL/long-string) from real TS props. Not inferential — no model. |
