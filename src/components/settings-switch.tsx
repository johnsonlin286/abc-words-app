import { Switch, Text, View } from "react-native";

import { colors } from "@/theme/tokens";

type Props = {
  label: string;
  /** A short line under the label saying what the switch changes. */
  hint?: string;
  value: boolean;
  onChange: (value: boolean) => void;
  last?: boolean;
};

/** A settings line with an on/off switch, ruled like `SettingsRow`. */
export function SettingsSwitch({ label, hint, value, onChange, last = false }: Props) {
  return (
    <View className={`min-h-[56px] flex-row items-center gap-3 py-2.5 ${last ? "" : "border-b border-paper-line"}`}>
      <View className="flex-1">
        <Text className="font-sans text-base text-ink">{label}</Text>
        {hint ? <Text className="font-sans-regular text-sm text-ink-soft">{hint}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        accessibilityLabel={label}
        trackColor={{ false: colors.inkFaint, true: colors.ink }}
        thumbColor={value ? colors.highlight : "#ffffff"}
      />
    </View>
  );
}
