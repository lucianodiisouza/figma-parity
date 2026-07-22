import type { DivergenceManifest } from "@parity/manifest";

/**
 * Render a manifest as a human-readable report (CI annotation / PR comment surface).
 * Bugs first, then intent findings; a clean run says so plainly.
 */
export function renderReport(m: DivergenceManifest): string {
  const lines: string[] = [];
  lines.push(`Parity report — ${m.component}  (${m.ranAt})`);

  if (m.coverage) {
    lines.push(`Design coverage: ${m.coverage.covered} of ${m.coverage.total} realistic states`);
  }

  const flagged = m.cells.filter((c) => c.flagged).length;
  lines.push(`Cells: ${m.cells.length} rendered, ${flagged} flagged, ${m.mismatches} bug(s)`);

  const bugs = m.divergences.filter((d) => d.verdict === "bug");
  const intent = m.divergences.filter((d) => d.verdict === "intent");

  if (bugs.length === 0) {
    lines.push("");
    lines.push("✓ No bugs detected.");
  } else {
    lines.push("");
    lines.push(`Bugs (${bugs.length}):`);
    for (const d of bugs) {
      const at = d.anchorId ? ` @${d.anchorId}` : "";
      lines.push(`  [${d.severity}] ${d.cellId}${at} — ${d.kind}: ${d.detail ?? ""}`.trimEnd());
    }
  }

  if (intent.length > 0) {
    lines.push("");
    lines.push(`Intent findings (${intent.length}, not bugs):`);
    for (const d of intent) {
      const at = d.anchorId ? ` @${d.anchorId}` : "";
      lines.push(`  ${d.cellId}${at} — ${d.kind}`);
    }
  }

  return lines.join("\n");
}
