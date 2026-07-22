import type { TokenDiff, TokenSet } from "./types.js";

/**
 * Diff the design side (Figma Variables) against the code side (theme). The output is
 * the entire content of a sync PR: token changes only, a few hundred bytes — the
 * "bounded and flat regardless of document size" property from PRD §8.
 */
export function diffTokens(design: TokenSet, code: TokenSet): TokenDiff {
  const changes: TokenDiff["changes"] = [];
  const refs = new Set([...Object.keys(design), ...Object.keys(code)]);

  for (const ref of [...refs].sort()) {
    const d = design[ref];
    const c = code[ref];
    if (d !== undefined && c === undefined) changes.push({ ref, kind: "added", design: d });
    else if (d === undefined && c !== undefined) changes.push({ ref, kind: "removed", code: c });
    else if (d !== c) changes.push({ ref, kind: "changed", design: d, code: c });
  }
  return { changes, inSync: changes.length === 0 };
}

/** Render a diff as the PR body / CI annotation. */
export function renderTokenDiff(diff: TokenDiff): string {
  if (diff.inSync) return "Tokens in sync — no changes.";
  const lines = [`Token drift: ${diff.changes.length} change(s)`, ""];
  for (const ch of diff.changes) {
    switch (ch.kind) {
      case "added":
        lines.push(`  + ${ch.ref} = ${String(ch.design)}`);
        break;
      case "removed":
        lines.push(`  - ${ch.ref} (was ${String(ch.code)})`);
        break;
      case "changed":
        lines.push(`  ~ ${ch.ref}: ${String(ch.code)} → ${String(ch.design)}`);
        break;
    }
  }
  return lines.join("\n");
}
