# Open questions

From [PRD.md](PRD.md) §12, plus ones surfaced during structuring. Each is owned and dated
so they don't rot. Move to [decision-log.md](decision-log.md) when resolved.

| ID | Question | Blocks | Owner | Target |
|----|----------|--------|-------|--------|
| Q-001 | What concrete false-positive threshold defines "keep it on"? | Phase 0 gate | _[you]_ | During Phase 0 labeling |
| Q-002 | Anchor authoring: hand / inferred / hybrid — and how kept valid through refactors? | Phase 2 | _[you]_ | Phase 2 start |
| Q-003 | Ground-truth format for "design intent": IR, annotated frame, or both? | Phase 0 diff engine | _[you]_ | Before Epic 0.4 |
| Q-004 | Does semantic diff need per-component tuning, or does one model prompt generalize? | Phase 0 → Phase 1 | _[you]_ | End of Phase 0 |
| Q-005 | Object-storage + hash-handle scheme for captures: retention & addressing model? | Phase 0 capture | _[you]_ | During Epic 0.3 |
| Q-006 | Which single component for the MVP? (needs real states + existing Figma frame) | Phase 0 start | _[you]_ | Epic 0.2 |
| Q-007 | iOS-first or Android-first simulator? (affects safe-area/dynamic-type tooling) | Phase 0 render | _[you]_ | Epic 0.3 |

## Notes

- **Q-003 is on the critical path.** It defines the left-hand side of the diff; the diff
  engine can't be built until it's answered.
- **Q-001 is not answerable up front** — it's an output of Phase 0 labeling, by design.
- **Q-006** is a project-management gate, not a technical one, but nothing in Phase 0
  starts without it.
