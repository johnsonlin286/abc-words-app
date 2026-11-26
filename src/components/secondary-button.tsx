import type { ReactNode } from "react";
import { Pressable, Text } from "react-native";

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  icon?: ReactNode;
};

/** A secondary action: plain card stock with a pen outline (web `buttonSecondary`). */
export function SecondaryButton({ label, onPress, disabled = false, icon }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      className={`flex-row items-center justify-center gap-2 rounded-xl border-2 bg-white px-5 py-3 ${
        disabled ? "border-ink-faint" : "border-ink active:bg-highlight-soft"
      }`}
    >
      {icon}
      <Text className={`font-sans-semibold text-lg ${disabled ? "text-ink-faint" : "text-ink"}`}>{label}</Text>
    </Pressable>
  );
}
