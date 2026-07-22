import type { TokenSet, TokenValue } from "./types.js";

/**
 * Normalize Figma Variables API payloads (`GET /v1/files/:key/variables/local`) into a
 * flat TokenSet. Only what the sync needs: variable name → resolved value for one mode.
 * Names use Figma's "group/name" convention; we normalize to dot-refs ("color/bg/accent"
 * → "color.bg.accent") to match the IR's TokenRef alphabet.
 */

export interface FigmaVariable {
  id: string;
  name: string;
  resolvedType: "COLOR" | "FLOAT" | "STRING" | "BOOLEAN";
  /** modeId → value. Colors arrive as {r,g,b,a} floats 0..1. */
  valuesByMode: Record<string, unknown>;
}

export interface FigmaVariablesPayload {
  variables: FigmaVariable[];
  /** The mode to read (e.g. the "light" modeId). */
  modeId: string;
}

function channel(v: number): string {
  return Math.round(Math.max(0, Math.min(1, v)) * 255)
    .toString(16)
    .padStart(2, "0");
}

/** Figma {r,g,b,a} floats → lowercase #rrggbb (or #rrggbbaa when a < 1). */
export function rgbaToHex(c: { r: number; g: number; b: number; a?: number }): string {
  const base = `#${channel(c.r)}${channel(c.g)}${channel(c.b)}`;
  return c.a !== undefined && c.a < 1 ? `${base}${channel(c.a)}` : base;
}

export function refFromName(name: string): string {
  return name.replaceAll("/", ".").trim();
}

/** Flatten one mode of a Figma Variables payload into a TokenSet. */
export function tokensFromFigmaVariables(payload: FigmaVariablesPayload): TokenSet {
  const out: TokenSet = {};
  for (const variable of payload.variables) {
    const raw = variable.valuesByMode[payload.modeId];
    if (raw === undefined) continue;
    let value: TokenValue;
    switch (variable.resolvedType) {
      case "COLOR":
        value = rgbaToHex(raw as { r: number; g: number; b: number; a?: number });
        break;
      case "FLOAT":
        value = raw as number;
        break;
      case "STRING":
        value = raw as string;
        break;
      case "BOOLEAN":
        // Booleans don't map to theme values in the MVP; skip.
        continue;
      default:
        continue;
    }
    out[refFromName(variable.name)] = value;
  }
  return out;
}
