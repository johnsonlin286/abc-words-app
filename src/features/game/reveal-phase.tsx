import { Image } from "expo-image";
import { useEffect, useRef, useState, type ComponentRef } from "react";
import { Text, View } from "react-native";
import Animated, { FadeInDown, Keyframe } from "react-native-reanimated";

import { PenCircle } from "@/components/pen-circle";
import { useAuthStore } from "@/features/auth/auth-store";
import { setLetterVote, useRoomStore, type GameRoomView } from "@/features/room/room-store";
import type { RevealInfo } from "@/shared/game";

import { isAfk } from "./afk";
import { ChoiceButton } from "./choice-button";
import { Countdown } from "./countdown";
import { CrossedText } from "./crossed-text";
import { HAND_RATIOS, HANDS } from "./hands";
import { RoundTitle } from "./round-title";

/** Each player's number appears this long after the one before; then the total, then the letter. */
const STEP_MS = 250;
const STAMP_MS = 450;
const HAND_HEIGHT = 22;

const appear = (delay: number) => FadeInDown.delay(delay).duration(300);
/** The letter comes down like a rubber stamp. */
const stamp = (delay: number) =>
  new Keyframe({
    0: { opacity: 0, transform: [{ scale: 2.2 }, { rotate: "-14deg" }] },
    100: { opacity: 1, transform: [{ scale: 1 }, { rotate: "0deg" }] },
  })
    .duration(STAMP_MS)
    .delay(delay);

type ShowVote = (buttons: ComponentRef<typeof View> | null) => void;

type Props = {
  room: GameRoomView;
  reveal: RevealInfo;
  /** Called once the stamped letter has landed, so the screen can make sure the vote buttons show. */
  onVoteShown: ShowVote;
};

/**
 * Each player's number appears in turn, then the total, then the letter is stamped and circled.
 * Kept short (two columns of players, the letter beside the total) so the vote buttons under it are
 * on the screen of a small phone without scrolling.
 */
export function RevealPhase({ room, reveal, onVoteShown }: Props) {
  const myId = useAuthStore((s) => s.user?.id);
  const endsAt = useRoomStore((s) => s.phaseEndsAt);
  const totalDelay = reveal.picks.length * STEP_MS;
  const letterDelay = totalDelay + STEP_MS;
  const myAutoPick = reveal.picks.find((p) => p.userId === myId && p.auto);
  const changed = reveal.changedFrom !== null;
  const stampDelay = changed ? 0 : letterDelay;

  return (
    <View className="gap-3">
      <RoundTitle room={room} />

      {myAutoPick ? (
        <View
          accessibilityLiveRegion="polite"
          className="rounded-xl border-2 border-dashed border-ink-soft bg-highlight-soft px-3 py-1"
        >
          <Text className="font-sans text-sm text-ink">
            🎲 Angkamu dipilihkan acak: <Text className="font-sans-bold">{myAutoPick.value}</Text>
          </Text>
        </View>
      ) : null}

      <View className="flex-row flex-wrap justify-between">
        {reveal.picks.map((p, i) => (
          <Animated.View key={p.userId} entering={appear(i * STEP_MS)} style={{ width: "47%" }}>
            <View
              accessible
              accessibilityLabel={`${p.name}: ${p.value}${p.auto ? ", acak" : ""}`}
              className="flex-row items-center gap-1.5 border-b-2 border-paper-line py-1"
            >
              <Text numberOfLines={1} className="flex-1 font-sans-semibold text-sm text-ink">
                {p.auto ? "🎲 " : ""}
                {p.name}
              </Text>
              <Image
                source={HANDS[p.value - 1]}
                style={{ height: HAND_HEIGHT, width: HAND_HEIGHT * HAND_RATIOS[p.value - 1]! }}
                contentFit="contain"
              />
              <Text className="w-5 text-right font-sans-bold text-base text-ink">{p.value}</Text>
            </View>
          </Animated.View>
        ))}
      </View>

      <View className="flex-row items-center">
        <Animated.View entering={appear(totalDelay)} style={{ flex: 1 }}>
          <View className="items-center">
            <Text className="font-sans-bold text-sm text-ink">Jumlah</Text>
            <Text className="font-sans-bold text-3xl text-ink">{reveal.total}</Text>
            {changed ? (
              <View
                accessible
                accessibilityLabel={`Huruf ${reveal.changedFrom} diganti menjadi ${reveal.letter}.`}
                className="flex-row items-center gap-1.5"
              >
                <Text className="font-sans text-sm text-ink-soft">Huruf</Text>
                <CrossedText text={reveal.changedFrom!} className="text-base" />
                <Text className="font-sans text-sm text-ink-soft">diganti</Text>
              </View>
            ) : reveal.skippedFrom ? (
              <Text className="text-center font-sans text-sm text-ink-soft">
                {reveal.skippedFrom} sudah keluar, lompat ke {reveal.letter}.
              </Text>
            ) : null}
          </View>
        </Animated.View>
        <View className="flex-1 items-center py-3">
          {/* Keyed by the letter, so a replacement letter is stamped and circled again. */}
          <Animated.View key={reveal.letter} entering={stamp(stampDelay)}>
            {/* A fixed width, so the loop stays round around narrow letters like I. */}
            <View className="w-20 items-center">
              <Text
                accessibilityLabel={`Huruf ronde ini: ${reveal.letter}`}
                accessibilityLiveRegion="polite"
                className="font-sans-bold text-redpen"
                style={{ fontSize: 64, lineHeight: 72 }}
              >
                {reveal.letter}
              </Text>
              <PenCircle inset={12} drawDelay={stampDelay + 350} />
            </View>
          </Animated.View>
        </View>
      </View>

      {endsAt !== null && room.state.phaseMs !== null ? <Countdown endsAt={endsAt} totalMs={room.state.phaseMs} /> : null}
      {changed ? null : <LetterVote room={room} delay={letterDelay + STAMP_MS} onShown={onVoteShown} />}
    </View>
  );
}

/**
 * "Hurufnya sulit?": each player picks "Ganti huruf" or "Tetap". More than half of the active
 * players wanting a change replaces the letter; half or more keeping it starts answering at once.
 * One line above the buttons counts both choices against what they need, so a "Tetap" tap visibly counts.
 */
function LetterVote({ room, delay, onShown }: { room: GameRoomView; delay: number; onShown: ShowVote }) {
  const myId = useAuthStore((s) => s.user?.id);
  const [error, setError] = useState<string | null>(null);

  // The buttons may still be below the fold on a very small phone, or with many players.
  const buttons = useRef<ComponentRef<typeof View>>(null);
  useEffect(() => {
    const timer = setTimeout(() => onShown(buttons.current), delay);
    return () => clearTimeout(timer);
  }, [onShown, delay]);

  // Same rule as the server: online players who aren't AFK.
  const active = room.members.filter((m) => m.isConnected && !isAfk(room.state, m.userId));
  const isActive = (id: string) => active.some((m) => m.userId === id);
  const { letterVotes, letterKeeps } = room.state;
  const changeNeeded = Math.floor(active.length / 2) + 1;
  const keepNeeded = Math.ceil(active.length / 2);
  const mine = !myId ? null : letterVotes.includes(myId) ? "change" : letterKeeps.includes(myId) ? "keep" : null;

  const canVote = !!myId && isActive(myId);
  const waiting = active.filter(
    (m) => m.userId !== myId && !letterVotes.includes(m.userId) && !letterKeeps.includes(m.userId),
  ).length;
  const choose = async (choice: "change" | "keep") => setError(await setLetterVote(mine === choice ? null : choice));

  const options = [
    { id: "change" as const, label: "Ganti Huruf", count: letterVotes.filter(isActive).length, needed: changeNeeded },
    { id: "keep" as const, label: "Tetap", count: letterKeeps.filter(isActive).length, needed: keepNeeded },
  ];

  return (
    <Animated.View entering={appear(delay)} className="gap-2">
      <View>
        <Text accessibilityRole="header" className="font-sans-bold text-lg text-ink">
          Hurufnya sulit?
        </Text>
        {/* One line in one place: the rule before voting, who is still deciding after. */}
        <Text accessibilityLiveRegion="polite" className="font-sans text-sm leading-5 text-ink-soft">
          {mine === null
            ? `Diganti kalau ${changeNeeded} pemain memilih ganti.`
            : waiting > 0
              ? `Menunggu ${waiting} pemain lain, masih bisa diubah.`
              : "Semua sudah memilih."}
        </Text>
      </View>

      <Text accessibilityLiveRegion="polite" className="font-sans-semibold text-sm text-ink">
        {options.map((o, i) => (
          <Text key={o.id}>
            {i > 0 ? <Text className="text-ink-faint"> · </Text> : null}
            {o.label} <Text className="bg-highlight-soft font-sans-bold"> {`${o.count}/${o.needed}`} </Text>
          </Text>
        ))}
      </Text>

      <View ref={buttons} collapsable={false} className="flex-row gap-3">
        {options.map((o) => (
          <View key={o.id} className="flex-1">
            <ChoiceButton
              selected={mine === o.id}
              disabled={!canVote}
              onPress={() => void choose(o.id)}
              accessibilityLabel={o.label}
              className="items-center py-2.5"
            >
              <Text className="font-sans-bold text-lg text-ink">{o.label}</Text>
            </ChoiceButton>
          </View>
        ))}
      </View>

      {error ? (
        <Text accessibilityRole="alert" className="font-sans-semibold text-sm text-redpen">
          {error}
        </Text>
      ) : null}
    </Animated.View>
  );
}
