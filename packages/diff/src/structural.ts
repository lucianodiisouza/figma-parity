import { walk, type IRDocument, type IRNode } from "@parity/ir";
import type { CapturedNode, CellCapture } from "@parity/capture";
import type { DivergenceKind, Severity } from "@parity/manifest";

/**
 * A pass-1 candidate finding. Deterministic and pre-verdict: pass 1 says *what looks
 * off and where*, but NOT whether it's intent or a bug — that judgment is pass 2's job
 * (the only place a model runs). Keeping verdict out here is the "escalate, don't stream"
 * boundary in code form.
 */
export interface Pass1Finding {
  anchorId?: string;
  kind: DivergenceKind;
  severity: Severity;
  detail: string;
}

/** Index a captured tree by anchorId for O(1) lookup. */
function indexByAnchor(node: CapturedNode, into: Map<string, CapturedNode>): void {
  if (node.anchorId) into.set(node.anchorId, node);
  for (const child of node.children) indexByAnchor(child, into);
}

function irNodesByAnchor(doc: IRDocument): Map<string, IRNode> {
  const map = new Map<string, IRNode>();
  for (const n of walk(doc.root)) {
    if (n.anchorId) map.set(n.anchorId, n);
  }
  return map;
}

/**
 * Structural diff between design intent (IR) and the runtime capture, matched by durable
 * anchor slots. Detects the classes of divergence observable from the tree alone:
 * missing/extra elements, role drift, and — the high-value MVP signal — text truncation
 * that no Figma frame covers.
 */
export function structuralDiff(ir: IRDocument, capture: CellCapture): Pass1Finding[] {
  const findings: Pass1Finding[] = [];
  const captured = new Map<string, CapturedNode>();
  indexByAnchor(capture.tree, captured);
  const intent = irNodesByAnchor(ir);

  // Walk intent → find missing elements, role drift, truncation.
  for (const [anchorId, irNode] of intent) {
    const obs = captured.get(anchorId);
    if (!obs) {
      findings.push({
        anchorId,
        kind: "missing-element",
        severity: "major",
        detail: `intent node "${irNode.name}" (${anchorId}) not present in runtime capture`,
      });
      continue;
    }
    if (obs.role !== irNode.role) {
      findings.push({
        anchorId,
        kind: "layout-shift",
        severity: "major",
        detail: `role drift at ${anchorId}: intent=${irNode.role} runtime=${obs.role}`,
      });
    }
    // Truncation: intent allows a single line but the string actually clipped on device.
    if (obs.text?.truncated) {
      findings.push({
        anchorId,
        kind: "truncation",
        severity: "major",
        detail: `text truncated at ${anchorId}: "${obs.text.raw}" (${obs.text.lines} line(s))`,
      });
    }
  }

  // Walk capture → find extra elements the design never declared.
  for (const [anchorId] of captured) {
    if (!intent.has(anchorId)) {
      findings.push({
        anchorId,
        kind: "extra-element",
        severity: "minor",
        detail: `runtime node ${anchorId} has no corresponding intent node`,
      });
    }
  }

  return findings;
}
