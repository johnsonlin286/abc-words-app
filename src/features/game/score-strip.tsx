import { ScrollView, Text, View } from "react-native";

import { useAuthStore } from "@/features/auth/auth-store";
import type { GameRoomView } from "@/features/room/room-store";
import { rankPlayers } from "@/shared/game";

import { AfkBadge, isAfk } from "./afk";

/**
 * Running score on one row above the game, however many players there are: your own score is always
 * first, everyone else follows by rank. When the row doesn't fit it scrolls sideways.
 */
export function ScoreStrip({ room }: { room: GameRoomView }) {
  const myId = useAuthStore((s) => s.user?.id);
  const ranking = rankPlayers(room.members, room.state.scores, room.state.speed);
  const players = [...ranking.filter((p) => p.userId === myId), ...ranking.filter((p) => p.userId !== myId)];

  return (
    // Reaches the screen edges, so a cut-off chip shows there is more to scroll to.
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      accessibilityLabel="Skor sementara"
      // A ScrollView grows to fill its column by default, which would stretch the chips.
      className="-mx-6 grow-0"
      contentContainerClassName="gap-2 px-6"
    >
      {players.map((p) => {
        const isMe = p.userId === myId;
        return (
          <View
            key={p.userId}
            className={`flex-row items-center gap-1.5 rounded-full border-2 border-ink px-3 py-1 ${
              isMe ? "bg-highlight-soft" : "bg-white"
            }`}
          >
            {isMe ? (
              <Text accessibilityLabel={`Kamu, peringkat ${p.rank}`} className="font-sans-bold text-xs text-ink-soft">
                #{p.rank}
              </Text>
            ) : null}
            <Text numberOfLines={1} className="max-w-28 font-sans-semibold text-sm text-ink">
              {p.name}
            </Text>
            {isAfk(room.state, p.userId) ? <AfkBadge name={p.name} /> : null}
            <View className="min-w-6 items-center rounded-full bg-highlight px-1.5">
              <Text accessibilityLabel={`${p.score} poin`} className="font-sans-bold text-sm text-ink">
                {p.score}
              </Text>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}
