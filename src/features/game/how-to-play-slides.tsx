import { Image } from "expo-image";
import { useEffect, useState, type JSX } from "react";
import { Text, View } from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInRight,
  useAnimatedStyle,
  useDerivedValue,
  useReducedMotion,
  withDelay,
  withTiming,
  ZoomIn,
} from "react-native-reanimated";

import { NoteCard } from "@/components/note-card";
import { VerifiedBadge } from "@/components/verified-badge";
import { ANSWER_MS, formatPoints, POINTS } from "@/shared/game";
import { colors } from "@/theme/tokens";

import { FingerSum } from "./finger-sum";
import { HAND_RATIOS, HANDS } from "./hands";

/**
 * Every illustration gets `active`: it is only drawn on the card in view, and mounting it plays
 * its entrance once (the carousel remounts it each time the card comes back). Reanimated skips
 * these entering animations under the system's reduce-motion setting; the hand-made ones below
 * check `useReducedMotion` and show their end state instead.
 */
type IllustrationProps = { active: boolean };

const TROPHIES = {
  gold: { source: require("@/assets/trophies/gold.webp"), ratio: 168 / 192 },
  silver: { source: require("@/assets/trophies/silver.webp"), ratio: 151 / 181 },
  bronze: { source: require("@/assets/trophies/bronze.webp"), ratio: 134 / 162 },
} as const;

function Hand({ value, height, rotate, delay }: { value: number; height: number; rotate: string; delay: number }) {
  return (
    <Animated.View entering={ZoomIn.delay(delay).springify()}>
      <Image
        source={HANDS[value - 1]}
        style={{ height, width: height * HAND_RATIOS[value - 1]!, transform: [{ rotate }] }}
        contentFit="contain"
      />
    </Animated.View>
  );
}

function Fingers({ active }: IllustrationProps) {
  if (!active) return null;
  return (
    <View className="flex-row items-end gap-3">
      <Hand value={2} height={96} rotate="-10deg" delay={0} />
      <Hand value={5} height={120} rotate="0deg" delay={150} />
      <Hand value={10} height={96} rotate="8deg" delay={300} />
    </View>
  );
}

function Sum({ active }: IllustrationProps) {
  return active ? <FingerSum animate /> : null;
}

const WORD = "Jerapah";
const DEMO_TOTAL_MS = ANSWER_MS;
/** The demo clock runs 8× fast and stops here, so the bar shows a round in progress. */
const DEMO_STOP_MS = 12_000;

/**
 * The answering phase as the web draws it: red letter with "Huruf", round and category, then the
 * countdown (highlighter stroke in a pen outline, seconds on the right), then the answer field.
 * The word types itself while the clock runs.
 */
function Answering({ active }: IllustrationProps) {
  const reduceMotion = useReducedMotion();
  const [left, setLeft] = useState(reduceMotion ? DEMO_STOP_MS : DEMO_TOTAL_MS);
  const [typed, setTyped] = useState(reduceMotion ? WORD.length : 0);

  useEffect(() => {
    if (!active || reduceMotion) return;
    // The clock reaches its stop after the word is typed; the timer ends there.
    let left = DEMO_TOTAL_MS;
    const timer = setInterval(() => {
      left = Math.max(left - 1_000, DEMO_STOP_MS);
      setLeft(left);
      setTyped((t) => Math.min(t + 1, WORD.length));
      if (left === DEMO_STOP_MS) clearInterval(timer);
    }, 125);
    return () => clearInterval(timer);
  }, [active, reduceMotion]);

  if (!active) return null;
  return (
    <Animated.View entering={FadeIn.duration(250)} className="w-full">
      <NoteCard className="w-full gap-4 p-4">
        <View className="flex-row items-center gap-4">
          <View className="w-14 items-center">
            <Text className="font-sans-semibold text-xs uppercase tracking-wide text-ink-soft">Huruf</Text>
            <Text className="font-sans-bold text-5xl leading-[52px] text-redpen">J</Text>
          </View>
          <View className="flex-1">
            <Text className="font-sans-bold text-xl text-ink">
              Ronde 1 <Text className="text-ink-faint">dari 5</Text>
            </Text>
            <Text className="font-sans text-base text-ink-soft">
              Kategori:{" "}
              <Text className="bg-highlight-soft font-sans-bold text-ink"> Hewan </Text>
            </Text>
          </View>
        </View>

        <View className="flex-row items-center gap-3">
          <View className="h-3.5 flex-1 overflow-hidden rounded-full border-2 border-ink bg-white">
            <View className="h-full rounded-full bg-highlight" style={{ width: `${(left / DEMO_TOTAL_MS) * 100}%` }} />
          </View>
          <Text className="w-8 text-right font-sans-bold text-xl text-ink">{Math.ceil(left / 1000)}</Text>
        </View>

        <View className="flex-row gap-2">
          <View className="flex-1 justify-center rounded-xl border-2 border-ink bg-white px-3 py-2">
            <Text className="font-sans text-lg text-ink">
              {WORD.slice(0, typed)}
              <Text className="text-ink-faint">|</Text>
            </Text>
          </View>
          <View
            className="justify-center rounded-xl border-2 border-ink bg-highlight px-4"
            style={{ boxShadow: `3px 3px 0 ${colors.ink}` }}
          >
            <Text className="font-sans-semibold text-base text-ink">Kirim</Text>
          </View>
        </View>
      </NoteCard>
    </Animated.View>
  );
}

/** A red-pen line drawn across a failed answer, left to right (its width grows, tilted like a pen stroke). */
function StrikeThrough({ delay }: { delay: number }) {
  const reduceMotion = useReducedMotion();
  // Starts animating as soon as it mounts (the card came into view).
  const progress = useDerivedValue(() => (reduceMotion ? 1 : withDelay(delay, withTiming(1, { duration: 350 }))), [delay, reduceMotion]);
  // One animated style object (no style array): NativeWind's interop on Animated.View flattens
  // arrays, which loses the animated part.
  const grow = useAnimatedStyle(() => ({
    height: 2.5,
    backgroundColor: colors.redpen,
    width: `${progress.get() * 100}%`,
  }));
  return (
    <View
      pointerEvents="none"
      style={{ position: "absolute", left: -4, right: -4, top: 0, bottom: 0, justifyContent: "center", transform: [{ rotate: "-12deg" }] }}
    >
      <Animated.View style={grow} />
    </View>
  );
}

function Voting({ active }: IllustrationProps) {
  if (!active) return null;
  return (
    <NoteCard className="w-full gap-1 px-4 py-2">
      <Animated.View
        entering={FadeInDown.duration(300)}
        className="flex-row items-center justify-between border-b border-paper-line py-3"
      >
        <Text className="font-sans-semibold text-lg text-ink">Jerapah</Text>
        <Animated.View entering={ZoomIn.delay(400).springify()}>
          <VerifiedBadge />
        </Animated.View>
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(200).duration(300)} className="flex-row items-center justify-between py-3">
        <View className="justify-center">
          <Text className="font-sans-semibold text-lg text-ink-soft">Jeruk</Text>
          <StrikeThrough delay={800} />
        </View>
        <Animated.Text entering={FadeIn.delay(1100).duration(300)} className="font-hand text-lg text-redpen">
          bukan kategori
        </Animated.Text>
      </Animated.View>
    </NoteCard>
  );
}

function Points({ active }: IllustrationProps) {
  if (!active) return null;
  const rows = [
    { label: "Lolos", points: POINTS.accepted },
    { label: "Gugur", points: POINTS.rejected },
    { label: "Tidak menjawab", points: POINTS.noAnswer },
  ];
  return (
    <NoteCard className="w-full px-4 py-1">
      {rows.map((row, i) => (
        <Animated.View
          key={row.label}
          entering={FadeInRight.delay(i * 200).duration(300)}
          className={`flex-row items-center justify-between py-3 ${i < rows.length - 1 ? "border-b-2 border-paper-line" : ""}`}
        >
          <Text className="font-sans text-lg text-ink-soft">{row.label}</Text>
          <Text className={`font-sans-bold text-2xl ${row.points > 0 ? "text-success" : "text-redpen"}`}>
            {formatPoints(row.points)}
          </Text>
        </Animated.View>
      ))}
    </NoteCard>
  );
}

function Trophy({ kind, height, name, delay }: { kind: keyof typeof TROPHIES; height: number; name: string; delay: number }) {
  const trophy = TROPHIES[kind];
  return (
    <Animated.View entering={ZoomIn.delay(delay).springify()} className="items-center gap-1">
      <Image source={trophy.source} style={{ height, width: height * trophy.ratio }} contentFit="contain" />
      <Text className="font-sans-semibold text-sm text-ink-soft">{name}</Text>
    </Animated.View>
  );
}

function Winners({ active }: IllustrationProps) {
  if (!active) return null;
  // Bronze, then silver, then the winner last.
  return (
    <View className="flex-row items-end gap-4">
      <Trophy kind="silver" height={84} name="Sari" delay={200} />
      <Trophy kind="gold" height={112} name="Budi" delay={450} />
      <Trophy kind="bronze" height={72} name="Andi" delay={0} />
    </View>
  );
}

export type Slide = {
  key: string;
  title: string;
  text: string;
  Illustration: (props: IllustrationProps) => JSX.Element | null;
};

/** The whole game in six cards: one picture and one short sentence each. Details live in "Aturan lengkap". */
export const SLIDES: Slide[] = [
  { key: "fingers", title: "Tunjukkan jari", text: "Semua pemain memilih angka 1 sampai 10.", Illustration: Fingers },
  { key: "letter", title: "Dapat huruf", text: "Semua angka dijumlahkan, lalu dihitung dari A: 1 = A, 10 = J.", Illustration: Sum },
  {
    key: "answer",
    title: "Adu cepat menulis",
    text: `Tulis kata berawalan huruf itu dalam ${ANSWER_MS / 1000} detik. Hewan + J? Jerapah!`,
    Illustration: Answering,
  },
  {
    key: "vote",
    title: "Nilai bersama",
    text: "Jawaban aneh? Tolak bareng. Yang ada di kamus langsung lolos.",
    Illustration: Voting,
  },
  {
    key: "points",
    title: "Kumpulkan poin",
    text: `Lolos ${formatPoints(POINTS.accepted)}, gugur atau tidak menjawab ${formatPoints(POINTS.noAnswer)}.`,
    Illustration: Points,
  },
  { key: "win", title: "Jadi juara!", text: "Poin terbanyak setelah ronde terakhir menang.", Illustration: Winners },
];
