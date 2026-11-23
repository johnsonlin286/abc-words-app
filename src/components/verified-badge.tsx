import { BadgeCheck } from "lucide-react-native";
import { Text, View } from "react-native";

import { colors } from "@/theme/tokens";

/** An answer found in the category's word list: it passes without a vote (web verified-badge.tsx). */
export function VerifiedBadge() {
  return (
    <View className="flex-row items-center gap-1 rounded-full border-2 border-success bg-white px-2.5 py-1">
      <BadgeCheck size={16} color={colors.success} strokeWidth={2.75} />
      <Text className="font-sans-bold text-sm text-success">Terverifikasi</Text>
    </View>
  );
}
