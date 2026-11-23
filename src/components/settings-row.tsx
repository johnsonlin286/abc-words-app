import { ChevronRight } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

import { colors } from "@/theme/tokens";

type Props = {
  label: string;
  value?: string;
  /** Tappable rows get a chevron; rows without it just show a value. */
  onPress?: () => void;
  /** A feature that isn't there yet: shown, but quiet and not tappable. */
  soon?: boolean;
  last?: boolean;
};

/** One line of a settings card, divided by a ruled line like the notebook. */
export function SettingsRow({ label, value, onPress, soon = false, last = false }: Props) {
  const content = (
    <View className={`min-h-[48px] flex-row items-center gap-3 py-2.5 ${last ? "" : "border-b border-paper-line"}`}>
      <Text className={`font-sans text-base ${soon ? "text-ink-faint" : "text-ink"}`}>{label}</Text>
      {/* The value takes the rest of the line; a long email is shortened in the middle, not cut off. */}
      {value ? (
        <Text
          numberOfLines={1}
          ellipsizeMode="middle"
          className="flex-1 text-right font-sans-semibold text-base text-ink-soft"
        >
          {value}
        </Text>
      ) : (
        <View className="flex-1" />
      )}
      {soon ? <Text className="font-hand text-sm text-redpen">segera</Text> : null}
      {onPress && !soon ? <ChevronRight size={20} color={colors.inkSoft} strokeWidth={2.5} /> : null}
    </View>
  );
  if (!onPress || soon) return content;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" className="active:opacity-60">
      {content}
    </Pressable>
  );
}
