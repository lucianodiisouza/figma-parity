/**
 * Fixture component for the MVP. A realistic Expo/RN primary button.
 *
 * This is the "one component" of Phase 0 (open-question Q-006 stand-in). Its props are
 * intentionally rich enough to enumerate real states later (Piece 4): loading, disabled,
 * long labels that truncate at largest dynamic type, RTL.
 *
 * The `anchorId` comments mark the durable binding slots that map to the Figma nodes in
 * this fixture's IR document (see ir.ts). Real anchors live in a store (Phase 2); here
 * they are inline so the fixture is self-describing.
 */
import { Pressable, Text, ActivityIndicator, View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";

export interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function PrimaryButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  style,
}: PrimaryButtonProps) {
  const isInert = loading || disabled;
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
        <ActivityIndicator />
      ) : (
        <View>
          {/* anchorId: cta.label */}
          <Text
            numberOfLines={1}
            style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "600" }} // token: type.label.default
          >
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
