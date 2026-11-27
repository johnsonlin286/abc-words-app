import { useState, type ComponentRef, type Ref } from "react";
import { Text, TextInput, View, type TextInputProps } from "react-native";

import { colors } from "@/theme/tokens";

/** What a ref on the field gives: `focus()`, `blur()`, ... */
export type TextFieldHandle = ComponentRef<typeof TextInput>;

type Props = TextInputProps & {
  label: string;
  hint?: string;
  /** Shown in red pen under the field; also marks the field invalid. */
  error?: string | null;
  /** The label is only spoken, for a field whose surroundings already say what it is. */
  hideLabel?: boolean;
  /** "code": large spaced capitals for a room code. */
  variant?: "text" | "code";
  ref?: Ref<TextFieldHandle>;
};

/** Labelled text field: white card stock, pen outline, highlighter ring on focus, red when invalid. */
export function TextField({ label, hideLabel, hint, error, variant = "text", onFocus, onBlur, ...props }: Props) {
  const [focused, setFocused] = useState(false);
  return (
    <View className="gap-1.5">
      {hideLabel ? null : <Text className="font-sans-semibold text-sm text-ink">{label}</Text>}
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
          className={`rounded-xl border-2 bg-white px-3.5 py-2.5 text-ink ${
            variant === "code" ? "font-sans-bold text-xl tracking-[6px]" : "font-sans text-base"
          } ${error ? "border-redpen" : "border-ink"}`}
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
