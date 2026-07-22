import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { Appearance, DynamicType } from "@parity/matrix";

const exec = promisify(execFile);

/**
 * Thin driver over `xcrun simctl` — the data-plane mechanism that applies a matrix cell
 * to a live iOS simulator (docs/matrix.md). Direction (LTR/RTL) is deliberately absent
 * here: RTL forcing is app-level (I18nManager / Expo locale), not a simctl concern.
 */

/** Map the matrix's dynamic-type axis to simctl content-size names. */
const CONTENT_SIZE: Record<DynamicType, string> = {
  default: "medium",
  // "largest" per the PRD = the largest accessibility size — where truncation lives.
  largest: "accessibility-extra-extra-extra-large",
};

export interface SimDevice {
  udid: string;
  name: string;
  state: "Booted" | "Shutdown" | string;
}

async function simctl(...args: string[]): Promise<string> {
  const { stdout } = await exec("xcrun", ["simctl", ...args]);
  return stdout;
}

/** List available devices (flattened across runtimes). */
export async function listDevices(): Promise<SimDevice[]> {
  const out = await simctl("list", "devices", "available", "--json");
  const parsed = JSON.parse(out) as {
    devices: Record<string, { udid: string; name: string; state: string }[]>;
  };
  return Object.values(parsed.devices).flat();
}

/** Find a booted device, or boot the first available device matching `preferName`. */
export async function ensureBooted(preferName?: string): Promise<SimDevice> {
  const devices = await listDevices();
  const booted = devices.find((d) => d.state === "Booted");
  if (booted) return booted;

  const candidate =
    (preferName && devices.find((d) => d.name === preferName)) ??
    devices.find((d) => d.name.startsWith("iPhone"));
  if (!candidate) throw new Error("no available iPhone simulator found");

  await simctl("boot", candidate.udid);
  await simctl("bootstatus", candidate.udid); // blocks until boot completes
  return { ...candidate, state: "Booted" };
}

/** Apply the two device-level axes of a cell: appearance and dynamic type. */
export async function applyCellConfig(
  udid: string,
  cfg: { appearance: Appearance; dynamicType: DynamicType },
): Promise<void> {
  await simctl("ui", udid, "appearance", cfg.appearance);
  await simctl("ui", udid, "content_size", CONTENT_SIZE[cfg.dynamicType]);
}

/** Capture a PNG screenshot of the device's current screen to `outPath`. */
export async function screenshot(udid: string, outPath: string): Promise<void> {
  await simctl("io", udid, "screenshot", "--type=png", outPath);
}

/** Open a URL on the device (deep link into the harness app to select state/direction). */
export async function openUrl(udid: string, url: string): Promise<void> {
  await simctl("openurl", udid, url);
}

export async function shutdown(udid: string): Promise<void> {
  await simctl("shutdown", udid);
}
