import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { colors } from "@/theme/tokens";

type Props = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
};

/**
 * The one main action on a card: a highlighter stroke with a pen outline and a hard shadow
 * (web `buttonPrimary`). Pressing pushes it into its shadow.
 */
export function PrimaryButton({ label, onPress, loading = false, disabled = false }: Props) {
  const inactive = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ busy: loading, disabled: inactive }}
    >
      {({ pressed }) => (
        <View
          className={`flex-row items-center justify-center gap-2 rounded-xl border-2 px-5 py-3 ${
            disabled ? "border-ink-faint bg-paper" : "border-ink bg-highlight"
          }`}
          style={
            disabled
              ? undefined
              : {
                  boxShadow: `${pressed ? 1 : 3}px ${pressed ? 1 : 3}px 0 ${colors.ink}`,
                  transform: [{ translateX: pressed ? 2 : 0 }, { translateY: pressed ? 2 : 0 }],
                }
          }
        >
          {loading ? <ActivityIndicator color={colors.ink} /> : null}
          <Text className={`font-sans-semibold text-lg ${disabled ? "text-ink-faint" : "text-ink"}`}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}
