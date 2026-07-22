import { walk, type IRDocument } from "@parity/ir";

/**
 * Compact, human-readable summary of design intent for the model's context. Kept small
 * on purpose (the token-budget strategy): role + anchor + text/token, one line per node.
 */
export function summarizeIntent(ir: IRDocument): string {
  const lines: string[] = [];
  for (const n of walk(ir.root)) {
    const bits = [n.role, n.anchorId ? `@${n.anchorId}` : undefined];
    if (n.text?.raw) bits.push(`text="${n.text.raw}"${n.text.maxLines ? ` (max ${n.text.maxLines} line)` : ""}`);
    if (n.style?.fill) bits.push(`fill=${n.style.fill}`);
    if (n.style?.typography) bits.push(`type=${n.style.typography}`);
    lines.push(bits.filter(Boolean).join(" "));
  }
  return lines.join("\n");
}
