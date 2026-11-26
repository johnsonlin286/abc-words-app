import { Text, View } from "react-native";

import { KeyIcon } from "./key-icon";

/** "Costs one key", shown on the buttons that lead to a game. */
export function KeyCost() {
  return (
    <View className="flex-row items-center gap-1 rounded-full border-2 border-ink bg-white px-2">
      <KeyIcon size={14} />
      <Text className="font-sans-bold text-sm text-ink">1</Text>
    </View>
  );
}
