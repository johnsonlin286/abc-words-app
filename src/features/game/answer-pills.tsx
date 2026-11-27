import { Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import type { GameRoomView } from "@/features/room/room-store";

/**
 * The answers so far as small pills, newest first, so what was just taken stays visible above the
 * keyboard (the web lists them oldest first).
 */
export function AnswerPills({ room }: { room: GameRoomView }) {
  const answers = [...room.state.answers].reverse();

  if (answers.length === 0) {
    return <Text className="font-sans text-sm text-ink-faint">Belum ada jawaban masuk.</Text>;
  }
  return (
    <View accessibilityLiveRegion="polite" className="flex-row flex-wrap items-center gap-2">
      <Text accessibilityRole="header" className="font-sans-bold text-sm text-ink">
        Sudah dipakai:
      </Text>
      {answers.map((a) => (
        <Animated.View key={a.userId} entering={FadeInDown.duration(300)}>
          <View
            accessible
            accessibilityLabel={`${a.text}, dari ${a.name}`}
            className="flex-row items-baseline gap-1.5 rounded-full border-2 border-paper-line bg-white px-2.5 py-0.5"
          >
            <Text className="shrink font-sans-bold text-sm text-ink">{a.text}</Text>
            <Text numberOfLines={1} className="max-w-20 font-sans text-xs text-ink-soft">
              {a.name}
            </Text>
          </View>
        </Animated.View>
      ))}
    </View>
  );
}
