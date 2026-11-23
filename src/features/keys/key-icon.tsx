import { KeyRound } from "lucide-react-native";
import { View } from "react-native";

import { colors } from "@/theme/tokens";

/** A room key in highlighter yellow; a used key stays visible at half opacity. */
export function KeyIcon({ used = false, size = 20 }: { used?: boolean; size?: number }) {
  return (
    <View style={{ opacity: used ? 0.5 : 1 }}>
      <KeyRound size={size} color={colors.ink} fill={colors.highlight} strokeWidth={2.5} />
    </View>
  );
}

/** One key per slot: owned keys first, then the used ones faded. */
export function KeyRow({ count, max, size }: { count: number; max: number; size: number }) {
  return (
    <View className="flex-row items-center gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <KeyIcon key={i} used={i >= count} size={size} />
      ))}
    </View>
  );
}
