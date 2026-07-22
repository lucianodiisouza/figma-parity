import type { LabelSet } from "@parity/manifest";

/**
 * Ground-truth labels for the PrimaryButton across the 8 MVP cells. This is the seed of
 * the Phase 0 eval set — a human's verdict on each rendered cell, against which the
 * tool's false-positive rate is measured (docs/phase-0-mvp.md).
 *
 * The fixture is authored so a couple of cells carry a real defect: at largest dynamic
 * type the label is expected to clip (a bug the designer never drew), and one RTL cell
 * has a legitimately-different-but-correct mirroring (intent, must NOT be flagged as bug).
 */
export const primaryButtonLabels: LabelSet = {
  schemaVersion: 1,
  cases: [
    { component: "PrimaryButton", cellId: "light.default.ltr", truth: "match" },
    { component: "PrimaryButton", cellId: "light.default.rtl", truth: "divergence:intent", note: "mirrored layout, correct" },
    { component: "PrimaryButton", cellId: "light.largest.ltr", truth: "divergence:bug", note: "label clips at largest type" },
    { component: "PrimaryButton", cellId: "light.largest.rtl", truth: "divergence:bug", note: "label clips at largest type (RTL)" },
    { component: "PrimaryButton", cellId: "dark.default.ltr", truth: "match" },
    { component: "PrimaryButton", cellId: "dark.default.rtl", truth: "divergence:intent", note: "mirrored layout, correct" },
    { component: "PrimaryButton", cellId: "dark.largest.ltr", truth: "divergence:bug", note: "label clips at largest type" },
    { component: "PrimaryButton", cellId: "dark.largest.rtl", truth: "divergence:bug", note: "label clips at largest type (RTL)" },
  ],
};
