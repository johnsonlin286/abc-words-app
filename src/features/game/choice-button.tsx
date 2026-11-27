import { Check } from "lucide-react-native";
import type { ReactNode } from "react";
import { Pressable, View } from "react-native";

import { colors } from "@/theme/tokens";

type Props = {
  children: ReactNode;
  selected: boolean;
  onPress: () => void;
  accessibilityLabel: string;
  disabled?: boolean;
  /** Layout of the button's face. */
  className?: string;
};

/**
 * A yellow button for choosing one option during a game (number picker, letter vote). The chosen one
 * stays pressed into its shadow and gets a tick, so it reads as chosen without relying on colour.
 */
export function ChoiceButton({ children, selected, onPress, accessibilityLabel, disabled = false, className = "" }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected, disabled }}
    >
      {({ pressed }) => {
        const down = pressed || selected;
        return (
          <View
            className={`rounded-2xl border-2 border-ink ${down ? "bg-highlight" : "bg-highlight-soft"} ${
              disabled ? "opacity-60" : ""
            } ${className}`}
            style={{
              boxShadow: `${down ? 1 : 3}px ${down ? 1 : 3}px 0 ${colors.ink}`,
              transform: [{ translateX: down ? 2 : 0 }, { translateY: down ? 2 : 0 }],
            }}
          >
            {children}
            {selected ? (
              <View className="absolute -right-2 -top-2 h-6 w-6 items-center justify-center rounded-full border-2 border-ink bg-white">
                <Check size={14} color={colors.ink} strokeWidth={3.5} />
              </View>
            ) : null}
          </View>
        );
      }}
    </Pressable>
  );
}
