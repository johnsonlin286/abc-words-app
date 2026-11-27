import { Image } from "expo-image";
import { useState } from "react";
import { Text, View } from "react-native";
import Animated, { FadeIn, ZoomIn } from "react-native-reanimated";

import { PrimaryButton } from "@/components/primary-button";
import { useAuthStore } from "@/features/auth/auth-store";
import { endGame, type GameRoomView } from "@/features/room/room-store";
import { finalRanking, formatAnswerTime } from "@/shared/game";
import { colors } from "@/theme/tokens";

import { TROPHIES, TROPHY_BY_RANK, trophySize } from "./trophies";

/** Height of the winner's trophy, and of gold in the ranking (silver and bronze are drawn smaller). */
const WINNER_TROPHY = 88;
const ROW_TROPHY = 40;

/**
 * Final scores (web finished-phase.tsx): the winner with the gold trophy, then everyone ranked,
 * including players who left. The host takes the room back to the waiting room.
 */
export function FinishedPhase({ room, isHost }: { room: GameRoomView; isHost: boolean }) {
  const myId = useAuthStore((s) => s.user?.id);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Players who left keep their name and score here, last and without a rank.
  const { departed, endedReason, scores, speed } = room.state;
  const ranking = finalRanking(room.members, departed, scores, speed);
  const ranked = ranking.filter((p) => p.rank !== null);
  const topScore = ranked[0]?.score ?? 0;
  // Only players with points win or get a trophy.
  const winners = ranked.filter((p) => p.rank === 1 && p.score > 0);
  // Same score as the winner but ranked lower: the answer time decided it, so say so.
  const outpaced = winners.length > 0 ? ranked.filter((p) => p.score === topScore && p.rank !== 1) : [];
  const hostName = room.members.find((m) => m.userId === room.hostId)?.name;
  const gold = trophySize("gold", WINNER_TROPHY);

  // Closing the final scores loses nothing, so it doesn't ask.
  const close = async () => {
    setBusy(true);
    setError(await endGame());
    setBusy(false);
  };

  return (
    <View className="gap-5">
      <View className="items-center gap-2">
        {/* Set only when the game stopped before the last round. */}
        {endedReason ? (
          <View className="self-stretch rounded-xl border-2 border-dashed border-ink-faint bg-highlight-soft px-3.5 py-2">
            <Text className="font-sans text-sm text-ink">{endedReason}.</Text>
          </View>
        ) : null}
        {winners.length > 0 ? (
          <>
            {/* The one moment of this screen: the gold trophy is stamped on. */}
            <Animated.View entering={ZoomIn.springify().damping(12)}>
              <Image source={TROPHIES.gold.source} style={gold} contentFit="contain" accessibilityIgnoresInvertColors />
            </Animated.View>
            <Animated.View entering={FadeIn.delay(250).duration(300)} className="items-center gap-1">
              <Text className="font-hand text-xl text-redpen">{winners.length > 1 ? "Juara bersama!" : "Juaranya!"}</Text>
              <View className="items-center">
                {/* Highlighter stroke behind the lower half of the name. */}
                <View
                  pointerEvents="none"
                  style={{
                    position: "absolute",
                    left: -8,
                    right: -8,
                    top: "48%",
                    bottom: 4,
                    backgroundColor: colors.highlight,
                    borderRadius: 10,
                    transform: [{ rotate: "-1deg" }],
                  }}
                />
                <Text accessibilityRole="header" className="text-center font-sans-bold text-4xl leading-[48px] text-ink">
                  {winners.map((w) => w.name).join(" & ")}
                </Text>
              </View>
              <Text className="font-sans-bold text-lg text-ink">
                <Text style={{ fontVariant: ["tabular-nums"] }}>{topScore}</Text> poin
              </Text>
              {outpaced.length > 0 ? (
                <Text className="text-center font-hand text-lg leading-6 text-redpen">
                  Poinnya sama dengan {outpaced.map((p) => p.name).join(" & ")}, tapi rata-rata menjawab lebih cepat.
                </Text>
              ) : null}
            </Animated.View>
          </>
        ) : (
          <Text accessibilityRole="header" className="text-center font-sans-bold text-2xl text-ink">
            Tidak ada yang mendapat poin
          </Text>
        )}
      </View>

      <View accessibilityLabel="Peringkat">
        {ranking.map((p, index) => {
          const trophy = p.rank === null || p.score <= 0 ? undefined : TROPHY_BY_RANK[p.rank - 1];
          const isMe = p.userId === myId;
          return (
            <View
              key={p.userId}
              className={`flex-row items-center gap-3 px-2 py-2 ${
                index < ranking.length - 1 ? "border-b-2 border-paper-line" : ""
              } ${isMe ? "rounded-lg bg-highlight-soft" : ""}`}
            >
              <View className="h-10 w-9 items-center justify-end">
                {trophy ? (
                  <Image
                    source={TROPHIES[trophy].source}
                    style={trophySize(trophy, ROW_TROPHY)}
                    contentFit="contain"
                    accessibilityLabel={`Peringkat ${p.rank}`}
                  />
                ) : p.rank === null ? null : (
                  <View className="h-9 w-9 items-center justify-center rounded-full border-2 border-ink/30 bg-white">
                    <Text accessibilityLabel={`Peringkat ${p.rank}`} className="font-sans-bold text-base text-ink-soft">
                      {p.rank}
                    </Text>
                  </View>
                )}
              </View>
              <View className="flex-1">
                <Text className="font-sans-semibold text-lg leading-6 text-ink">
                  {p.name}
                  {p.left ? <Text className="font-sans text-sm text-ink-soft"> (keluar)</Text> : null}
                </Text>
                {p.avgMs !== null ? (
                  <Text className="font-sans text-xs text-ink-soft">
                    Rata-rata jawab: <Text style={{ fontVariant: ["tabular-nums"] }}>{formatAnswerTime(p.avgMs)}</Text>
                  </Text>
                ) : null}
              </View>
              <Text
                accessibilityLabel={`${p.score} poin`}
                className="font-sans-bold text-xl text-ink"
                style={{ fontVariant: ["tabular-nums"] }}
              >
                {p.score}
              </Text>
            </View>
          );
        })}
      </View>

      <View className="gap-2 border-t-2 border-dashed border-ink/20 pt-4">
        {isHost ? (
          <PrimaryButton label="Kembali ke Ruang Tunggu" onPress={() => void close()} loading={busy} />
        ) : (
          <Text className="font-sans text-sm text-ink-soft">Menunggu {hostName} kembali ke ruang tunggu.</Text>
        )}
        {error ? (
          <Text accessibilityRole="alert" className="font-sans-semibold text-sm text-redpen">
            {error}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
