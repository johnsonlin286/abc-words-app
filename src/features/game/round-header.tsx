import { Text, View } from "react-native";

import type { GameRoomView } from "@/features/room/room-store";

import { RoundTitle } from "./round-title";

/** The round's letter in red pen next to the round title, once the reveal is over. */
export function RoundHeader({ room, letter }: { room: GameRoomView; letter: string }) {
  return (
    <View className="flex-row items-center gap-3">
      {/* A fixed width, so narrow letters like I stay centred under the label. */}
      <View accessible accessibilityLabel={`Huruf ronde ini: ${letter}`} className="w-14 items-center">
        <Text className="font-sans-semibold text-xs uppercase tracking-wide text-ink-soft">Huruf</Text>
        <Text className="font-sans-bold text-redpen" style={{ fontSize: 48, lineHeight: 52 }}>
          {letter}
        </Text>
      </View>
      <View className="flex-1">
        <RoundTitle room={room} />
      </View>
    </View>
  );
}
