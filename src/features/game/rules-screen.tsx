import { router } from "expo-router";
import { ChevronDown } from "lucide-react-native";
import { useState } from "react";
import { Linking, Pressable, ScrollView, Text, View } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { BackButton } from "@/components/back-button";
import { NoteCard } from "@/components/note-card";
import { Paper } from "@/components/paper";
import { PrimaryButton } from "@/components/primary-button";
import { useRoomStore } from "@/features/room/room-store";
import { formatPoints } from "@/shared/game";
import { colors } from "@/theme/tokens";

import { FingerSum } from "./finger-sum";
import { CHAT_RULES, SCORE_NOTE, SCORE_ROWS, STEPS } from "./rules-content";

function Bullets({ items }: { items: readonly string[] }) {
  return (
    <View className="mt-2 gap-1.5">
      {items.map((line) => (
        <View key={line} className="flex-row gap-2">
          <Text className="font-sans text-base leading-6 text-ink-faint">•</Text>
          <Text className="flex-1 font-sans text-base leading-6 text-ink-soft">{line}</Text>
        </View>
      ))}
    </View>
  );
}

/** Layout changes glide instead of jumping; Reanimated turns this off under reduce motion. */
const glide = LinearTransition.duration(220);

/** One step of a round: number and title always shown, the details unfold on tap. */
function Step({ number, title, body }: { number: number; title: string; body: readonly string[] }) {
  const [open, setOpen] = useState(false);
  const turn = useDerivedValue(() => withTiming(open ? 180 : 0, { duration: 220 }), [open]);
  const chevron = useAnimatedStyle(() => ({ transform: [{ rotate: `${turn.get()}deg` }] }));

  return (
    <Animated.View
      layout={glide}
      className="overflow-hidden rounded-2xl border-2 border-ink bg-white px-4 py-3"
      style={{ boxShadow: `3px 3px 0 ${colors.ink}` }}
    >
      <Pressable
        onPress={() => setOpen((o) => !o)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        className="flex-row items-center gap-3"
      >
        <View className="h-9 w-9 items-center justify-center rounded-lg border-2 border-ink bg-highlight">
          <Text className="font-sans-bold text-lg text-ink">{number}</Text>
        </View>
        <Text accessibilityRole="header" className="flex-1 font-sans-bold text-xl text-ink">
          {title}
        </Text>
        <Animated.View style={chevron}>
          <ChevronDown size={22} color={colors.ink} strokeWidth={2.5} />
        </Animated.View>
      </Pressable>
      {open ? (
        <Animated.View entering={FadeIn.duration(220).delay(80)} exiting={FadeOut.duration(120)}>
          <Bullets items={body} />
        </Animated.View>
      ) : null}
    </Animated.View>
  );
}

/**
 * Aturan lengkap: every rule, the same words as the web /cara-main page (rules-content.ts is a
 * verbatim copy of the web's, built from shared/game.ts). The steps are folded so the page reads
 * as a list of titles; the word-list sources stay visible at the end (GeoNames is CC BY 4.0).
 * The short illustrated version is how-to-play-screen.tsx.
 */
export function RulesScreen() {
  // Opened from a room, the button at the end goes back there instead of to the lobby.
  const inRoom = useRoomStore((s) => s.roomId !== null);

  return (
    <Paper>
      <SafeAreaView className="flex-1">
        <ScrollView contentContainerClassName="gap-8 px-8 pb-10 pt-2" showsVerticalScrollIndicator={false}>
          <View className="gap-3">
            <BackButton />
            <View className="self-start">
              <View
                className="absolute -left-2 -right-2 bottom-1 top-[42%] bg-highlight"
                style={{
                  transform: [{ rotate: "-1deg" }],
                  borderTopLeftRadius: 19,
                  borderTopRightRadius: 10,
                  borderBottomRightRadius: 24,
                  borderBottomLeftRadius: 12,
                }}
              />
              <Text accessibilityRole="header" className="font-sans-bold text-5xl leading-[56px] text-ink">
                Aturan lengkap
              </Text>
            </View>
            <Text className="font-sans text-lg leading-7 text-ink-soft">
              Ketuk setiap langkah untuk membaca detailnya.
            </Text>
          </View>

          <NoteCard className="gap-4 p-5">
            <View className="self-start rounded-sm bg-highlight-soft px-2.5" style={{ transform: [{ rotate: "-1deg" }] }}>
              <Text className="font-hand text-lg text-ink">Contoh satu ronde</Text>
            </View>
            <FingerSum />
            <Text className="font-sans text-sm leading-6 text-ink-soft">
              Budi, Sari dan Andi menunjukkan 3, 5 dan 2. Jumlahnya 10, huruf ke-10 adalah J. Sekarang semua adu cepat
              menulis kata berawalan J, misalnya “Jerapah” untuk kategori Hewan.
            </Text>
          </NoteCard>

          <View className="gap-3">
            {STEPS.map((step, i) => (
              <Step key={step.title} number={i + 1} title={step.title} body={step.body} />
            ))}
          </View>

          <Animated.View layout={glide} className="gap-8">
          <NoteCard className="p-5">
            <Text accessibilityRole="header" className="font-sans-bold text-2xl text-ink">
              Poin
            </Text>
            <View className="mt-3">
              {SCORE_ROWS.map((row, i) => (
                <View
                  key={row.label}
                  className={`flex-row items-center gap-4 py-2.5 ${i < SCORE_ROWS.length - 1 ? "border-b-2 border-paper-line" : ""}`}
                >
                  <Text className="flex-1 font-sans text-base leading-6 text-ink-soft">{row.label}</Text>
                  <Text className={`font-sans-bold text-xl ${row.points > 0 ? "text-success" : "text-redpen"}`}>
                    {formatPoints(row.points)}
                  </Text>
                </View>
              ))}
            </View>
            <Text className="mt-3 font-hand text-lg leading-6 text-redpen">{SCORE_NOTE}</Text>
          </NoteCard>

          <View>
            <Text accessibilityRole="header" className="font-sans-bold text-2xl text-ink">
              Obrolan
            </Text>
            <Bullets items={CHAT_RULES} />
          </View>

          {/* Word-list sources (GeoNames is CC BY 4.0): credited where players read about verified answers. */}
          <Text className="font-sans text-xs leading-5 text-ink-faint">
            Jawaban terverifikasi memakai data Unicode CLDR (negara),{" "}
            <Text onPress={() => void Linking.openURL("https://www.geonames.org")} accessibilityRole="link" className="underline">
              GeoNames
            </Text>{" "}
            (kota, CC BY 4.0), serta Wordnet Bahasa (MIT) dan Princeton WordNet 3.0 (hewan).
          </Text>

          <View className="gap-3 border-t-2 border-dashed border-ink-faint pt-8">
            <Text className="font-sans-bold text-xl text-ink">Sudah paham? Ajak temanmu!</Text>
            <PrimaryButton
              label={inRoom ? "Kembali ke Room" : "Main Sekarang"}
              onPress={() => (inRoom ? router.back() : router.dismissTo("/"))}
            />
          </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </Paper>
  );
}
