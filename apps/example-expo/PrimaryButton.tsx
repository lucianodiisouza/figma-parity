/**
 * The MVP component under test — same component as the fixture reference copy in
 * packages/fixtures (the fixture copy documents anchors/IR; this one actually runs).
 * anchorId comments mark the durable binding slots that map to the Figma IR.
 */
import { useRef } from "react";
import { Pressable, Text, ActivityIndicator, View } from "react-native";
import type { StyleProp, ViewStyle, LayoutChangeEvent } from "react-native";

export interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Harness hook: reports whether the label truncated after layout. */
  onLabelLayout?: (info: { truncated: boolean; lines: number }) => void;
}

export function PrimaryButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  style,
  onLabelLayout,
}: PrimaryButtonProps) {
  const isInert = loading || disabled;

  // Truncation detection: iOS reports the FULL string in onTextLayout even when the draw
  // clips with an ellipsis, so line text is useless. Instead measure the visible
  // (numberOfLines=1, constrained) label against a hidden unconstrained ghost copy —
  // truncated iff the ghost is wider than what fit.
  const widths = useRef<{ visible?: number; ghost?: number }>({});
  const report = () => {
    const { visible, ghost } = widths.current;
    if (visible === undefined || ghost === undefined) return;
    onLabelLayout?.({ truncated: ghost > visible + 1, lines: 1 });
  };
  const onVisibleLayout = (e: LayoutChangeEvent) => {
    widths.current.visible = e.nativeEvent.layout.width;
    report();
  };
  const onGhostLayout = (e: LayoutChangeEvent) => {
    widths.current.ghost = e.nativeEvent.layout.width;
    report();
  };

  return (
    // anchorId: cta.root
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isInert, busy: loading }}
      disabled={isInert}
      onPress={onPress}
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          paddingVertical: 12,
          paddingHorizontal: 16,
          borderRadius: 8,
          backgroundColor: isInert ? "#9CA3AF" : "#2563EB", // token: color.bg.accent
        },
        style,
      ]}
    >
      {loading ? (
        // anchorId: cta.spinner
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <View style={{ flexShrink: 1 }}>
          {/* anchorId: cta.label */}
          <Text
            numberOfLines={1}
            onLayout={onVisibleLayout}
            style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "600" }} // token: type.label.default
          >
            {label}
          </Text>
          {/* Hidden unconstrained ghost — measures the label's natural width. The huge
              absolute wrapper removes the width constraint; the Text sizes to content. */}
          <View
            pointerEvents="none"
            style={{ position: "absolute", left: 0, top: 0, width: 10_000, opacity: 0, flexDirection: "row" }}
          >
            <Text onLayout={onGhostLayout} style={{ fontSize: 16, fontWeight: "600" }}>
              {label}
            </Text>
          </View>
        </View>
      )}
    </Pressable>
  );
}
