import { Text, View } from "react-native";

import type { GameRoomView } from "@/features/room/room-store";
import { categoryLabel } from "@/shared/game";

/** "Ronde 2 dari 10" and the category, shared by every phase of a round. */
export function RoundTitle({ room }: { room: GameRoomView }) {
  return (
    <View className="gap-1">
      <Text accessibilityRole="header" className="font-sans-bold text-2xl text-ink">
        Ronde {room.state.round} <Text className="text-ink-faint">dari {room.settings.maxRounds}</Text>
      </Text>
      {/* A step below the round title: the category is what everyone needs to remember this round. */}
      <Text className="font-sans text-lg text-ink-soft">
        Kategori: <Text className="bg-highlight-soft font-sans-bold text-ink"> {categoryLabel(room.settings)} </Text>
      </Text>
    </View>
  );
}
