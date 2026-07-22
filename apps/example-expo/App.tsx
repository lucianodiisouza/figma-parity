/**
 * Parity harness screen. Renders the component under test in the state selected by a
 * deep link, and reports the observed runtime tree back to the host collector.
 *
 * Deep link shape (Expo Go):  exp://<host>:8081/--/cell/<cellId>?state=<interaction>.<content>
 *   cellId    = "<appearance>.<dynamicType>.<direction>" (appearance/type are applied
 *               device-level by simctl; the app only acts on <direction>)
 *   state     = component state from the Piece-4 enumeration (default "default.short")
 *
 * After layout it POSTs { cellId, tree } to http://127.0.0.1:4823/tree — the simulator
 * shares the host network, so localhost reaches the collector run by @parity/renderer.
 * The tree JSON is the @parity/capture CapturedNode wire shape.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { PixelRatio, SafeAreaView, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import * as Linking from "expo-linking";
import { PrimaryButton } from "./PrimaryButton";

const COLLECTOR = "http://127.0.0.1:4823/tree";

const LABELS: Record<string, string> = {
  short: "Continue",
  long: "Continue to the next step",
  overflow: "Continue to the very next step of your onboarding journey",
};

interface HarnessConfig {
  cellId: string;
  direction: "ltr" | "rtl";
  interaction: "default" | "loading" | "disabled";
  content: "short" | "long" | "overflow";
}

function parseConfig(url: string | null): HarnessConfig {
  const fallback: HarnessConfig = {
    cellId: "unknown",
    direction: "ltr",
    interaction: "default",
    content: "short",
  };
  if (!url) return fallback;
  const parsed = Linking.parse(url);
  const match = /cell\/([^/?]+)/.exec(parsed.path ?? "");
  const cellId = match?.[1] ?? "unknown";
  const direction = cellId.endsWith(".rtl") ? "rtl" : "ltr";
  const state = typeof parsed.queryParams?.state === "string" ? parsed.queryParams.state : "";
  const [interaction = "default", content = "short"] = state.split(".");
  return {
    cellId,
    direction,
    interaction: (["default", "loading", "disabled"].includes(interaction)
      ? interaction
      : "default") as HarnessConfig["interaction"],
    content: (["short", "long", "overflow"].includes(content)
      ? content
      : "short") as HarnessConfig["content"],
  };
}

export default function App() {
  const url = Linking.useURL();
  const cfg = useMemo(() => parseConfig(url), [url]);
  const label = LABELS[cfg.content] ?? "Continue";
  const [labelInfo, setLabelInfo] = useState<{ truncated: boolean; lines: number } | null>(null);
  const rootRef = useRef<View>(null);

  // Report the observed tree once we know how the label laid out (or immediately when
  // loading — the label is replaced by a spinner and never lays out). Includes the
  // button's window-relative rect (logical points) + the device pixel ratio so the host
  // can extract the failing crop from the stored frame for escalation.
  useEffect(() => {
    const ready = cfg.interaction === "loading" || labelInfo !== null;
    if (cfg.cellId === "unknown" || !ready) return;

    // Let layout settle a frame before measuring, then post.
    const timer = setTimeout(() => {
      rootRef.current?.measureInWindow((x, y, width, height) => {
        const rect = { x, y, width, height };
        const children =
          cfg.interaction === "loading"
            ? [{ anchorId: "cta.spinner", role: "icon", rect, children: [] }]
            : [
                {
                  anchorId: "cta.label",
                  role: "text",
                  text: {
                    raw: label,
                    truncated: labelInfo?.truncated ?? false,
                    lines: labelInfo?.lines ?? 1,
                  },
                  rect,
                  children: [],
                },
              ];
        const tree = { anchorId: "cta.root", role: "button", rect, children };

        fetch(COLLECTOR, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ cellId: cfg.cellId, tree, scale: PixelRatio.get() }),
        }).catch(() => {
          // Collector not running (manual use) — fine.
        });
      });
    }, 50);
    return () => clearTimeout(timer);
  }, [cfg, label, labelInfo]);

  return (
    <SafeAreaView style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <View ref={rootRef} style={{ direction: cfg.direction, maxWidth: 220 }}>
        <PrimaryButton
          label={label}
          loading={cfg.interaction === "loading"}
          disabled={cfg.interaction === "disabled"}
          onPress={() => {}}
          onLabelLayout={setLabelInfo}
        />
      </View>
      <Text style={{ marginTop: 24, opacity: 0.4, fontSize: 12 }}>
        {cfg.cellId} · {cfg.interaction}.{cfg.content}
      </Text>
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}
