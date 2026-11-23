import { useState } from "react";
import { Text, TextInput, View, type TextInputProps } from "react-native";

import { colors } from "@/theme/tokens";

type Props = TextInputProps & {
  label: string;
  hint?: string;
  /** Shown in red pen under the field; also marks the field invalid. */
  error?: string | null;
};

/** Labelled text field: white card stock, pen outline, highlighter ring on focus, red when invalid. */
export function TextField({ label, hint, error, onFocus, onBlur, ...props }: Props) {
  const [focused, setFocused] = useState(false);
  return (
    <View className="gap-1.5">
      <Text className="font-sans-semibold text-sm text-ink">{label}</Text>
      {/* Highlighter focus ring as a rounded border on a wrapper (pulled out by its width so the layout
          doesn't move). A style prop on the TextInput itself drops NativeWind's padding, and a spread
          boxShadow draws square corners on some Android surfaces. */}
      <View
        style={{
          margin: -3,
          borderWidth: 3,
          borderRadius: 15,
          borderColor: focused ? colors.highlight : "transparent",
        }}
      >
        <TextInput
          accessibilityLabel={label}
          accessibilityHint={hint}
          placeholderTextColor={colors.inkFaint}
          className={`rounded-xl border-2 bg-white px-3.5 py-2.5 font-sans text-base text-ink ${
            error ? "border-redpen" : "border-ink"
          }`}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...props}
        />
      </View>
      {error ? (
        <Text accessibilityRole="alert" className="font-sans-semibold text-sm text-redpen">
          {error}
        </Text>
      ) : hint ? (
        <Text className="font-sans-regular text-sm text-ink-soft">{hint}</Text>
      ) : null}
    </View>
  );
}
