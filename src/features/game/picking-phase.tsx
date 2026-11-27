import { Image } from "expo-image";
import { useEffect, useState } from "react";
import { Text, useWindowDimensions, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle, G, Path } from "react-native-svg";

import { Sparks } from "@/components/doodles";
import { useAuthStore } from "@/features/auth/auth-store";
import { pickNumber, useRoomStore, type GameRoomView } from "@/features/room/room-store";
import { useTimeAlmostUp } from "@/lib/use-time-left";
import { colors } from "@/theme/tokens";

import { isAfk } from "./afk";
import { ChoiceButton } from "./choice-button";
import { Countdown } from "./countdown";
import { HAND_RATIOS, HANDS } from "./hands";
import { RoundTitle } from "./round-title";

const ROWS = [
  [1, 2, 3, 4, 5],
  [6, 7, 8, 9, 10],
];
const GAP = 8;
const MAX_HAND_HEIGHT = 64;
/** Screen width not used by a row: page padding, card padding and border. */
const ROW_INSET = 74;
/** Warn a player who hasn't picked once this little time is left. */
const HURRY_MS = 3_000;

export function PickingPhase({ room }: { room: GameRoomView }) {
  const myId = useAuthStore((s) => s.user?.id);
  const endsAt = useRoomStore((s) => s.phaseEndsAt);
  const [error, setError] = useState<string | null>(null);
  const { width } = useWindowDimensions();
  // A close guess until the row is measured, so the hands don't pop in a frame late on a slow phone.
  const [rowWidth, setRowWidth] = useState(width - ROW_INSET);

  const { myPick, pickedBy, round, phaseMs } = room.state;
  const almostUp = useTimeAlmostUp(endsAt, HURRY_MS);
  const hurry = myPick === null && almostUp;
  // Same players the server waits for: online and not AFK.
  const waitingFor = room.members.filter(
    (m) => m.userId !== myId && m.isConnected && !isAfk(room.state, m.userId) && !pickedBy.includes(m.userId),
  ).length;
  // First round only: the buttons wiggle once, to say "tap me" to someone new to the game.
  const nudge = round === 1 && myPick === null;

  // One scale for every hand: each picture is as tall as the widest one (10, two open hands) can be
  // in a button, so 1–5 are drawn exactly as big as the hands in 6–10.
  const buttonWidth = (rowWidth - GAP * 4) / 5;
  const handHeight = Math.max(Math.min((buttonWidth - 8) / HAND_RATIOS[9]!, MAX_HAND_HEIGHT), 0);

  const pick = async (value: number) => setError(await pickNumber(value));

  return (
    <View className="gap-3">
      <RoundTitle room={room} />

      {endsAt !== null && phaseMs !== null ? <Countdown endsAt={endsAt} totalMs={phaseMs} urgent={hurry} /> : null}
      {hurry ? (
        <Text accessibilityLiveRegion="assertive" className="font-sans-bold text-sm text-redpen">
          Cepat pilih! Kalau tidak, angkamu dipilihkan acak.
        </Text>
      ) : null}

      <View className="h-0.5 bg-paper-line" />

      <View className="gap-2">
        <View className="self-start pl-4">
          <Sparks color={colors.highlight} style={{ top: -6, left: -6 }} />
          <Text accessibilityRole="header" className="font-sans-bold text-2xl text-ink">
            Pilih angkamu!
          </Text>
        </View>
        <Text className="font-sans text-sm leading-5 text-ink-soft">
          Ketuk satu angka. Angka semua pemain dijumlahkan dan diubah menjadi huruf untuk ronde ini.
        </Text>

        <View className="mt-1" style={{ gap: GAP + 2 }}>
          {ROWS.map((row) => (
            <View
              key={row[0]}
              className="flex-row"
              style={{ gap: GAP }}
              onLayout={(e) => setRowWidth(e.nativeEvent.layout.width)}
            >
              {row.map((n) => (
                <Wiggle key={n} play={nudge} delay={300 + (n - 1) * 40}>
                  <ChoiceButton
                    selected={myPick === n}
                    onPress={() => void pick(n)}
                    accessibilityLabel={`Pilih angka ${n}`}
                    className="items-center gap-1 pb-1 pt-2.5"
                  >
                    <View className="justify-end" style={{ height: handHeight }}>
                      <Image
                        source={HANDS[n - 1]}
                        style={{ height: handHeight, width: handHeight * HAND_RATIOS[n - 1]! }}
                        contentFit="contain"
                      />
                    </View>
                    <Text className="font-sans-bold text-3xl text-ink">{n}</Text>
                  </ChoiceButton>
                </Wiggle>
              ))}
            </View>
          ))}
        </View>

        {error ? (
          <Text accessibilityRole="alert" className="font-sans-semibold text-sm text-redpen">
            {error}
          </Text>
        ) : null}

        {myPick !== null ? (
          <View accessibilityLiveRegion="polite" className="mt-1 flex-row items-center gap-3 rounded-2xl bg-paper-line px-3 py-2">
            <PlayersIcon />
            <View className="h-10 w-0.5 rounded-full bg-ink/20" />
            <Text className="flex-1 font-sans text-sm leading-5 text-ink">
              <Text className="font-sans-bold">Kamu memilih {myPick}.</Text>{" "}
              {waitingFor > 0 ? `Menunggu ${waitingFor} pemain lain… (masih bisa diganti)` : "Semua sudah memilih."}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

/** One short hop when the button appears, off under reduce motion. */
function Wiggle({ play, delay, children }: { play: boolean; delay: number; children: React.ReactNode }) {
  const reduceMotion = useReducedMotion();
  const lift = useSharedValue(0);

  useEffect(() => {
    if (!play || reduceMotion) return;
    lift.set(withDelay(delay, withSequence(withTiming(1, { duration: 150 }), withTiming(0, { duration: 250 }))));
  }, [play, delay, reduceMotion, lift]);

  // One animated style object (no style array), see lib/nativewind-interop.ts.
  const style = useAnimatedStyle(() => ({
    flex: 1,
    transform: [{ translateY: -5 * lift.get() }, { rotate: `${-3 * lift.get()}deg` }],
  }));

  return <Animated.View style={style}>{children}</Animated.View>;
}

/** Three players in highlighter yellow and ink: "the others", in the waiting note. */
function PlayersIcon() {
  return (
    <Svg width={44} height={36} viewBox="0 0 48 40">
      <G fill={colors.highlight} stroke={colors.ink} strokeWidth={2.5} strokeLinejoin="round">
        <Circle cx={11} cy={14} r={5} />
        <Path d="M2 36a9 9 0 0 1 18 0z" />
        <Circle cx={37} cy={14} r={5} />
        <Path d="M28 36a9 9 0 0 1 18 0z" />
        <Circle cx={24} cy={12} r={6.5} />
        <Path d="M12 38a12 11 0 0 1 24 0z" />
      </G>
    </Svg>
  );
}
