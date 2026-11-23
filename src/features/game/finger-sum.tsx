import { Image } from "expo-image";
import type { ReactNode } from "react";
import { Text, View } from "react-native";
import Animated, { FadeIn, ZoomIn } from "react-native-reanimated";

import { Sparks } from "@/components/doodles";
import { PenCircle } from "@/components/pen-circle";
import { colors } from "@/theme/tokens";

import { HAND_RATIOS, HANDS } from "./hands";

const PLAYERS = [
  { name: "Budi", value: 3 },
  { name: "Sari", value: 5 },
  { name: "Andi", value: 2 },
];
const HAND_HEIGHT = 44;

/** One part of the sum in three rows (fingers / value / caption), so numbers and signs line up. */
function Term({ top, children, bottom }: { top?: ReactNode; children: ReactNode; bottom?: string }) {
  return (
    <View className="items-center gap-1">
      <View className="justify-end" style={{ height: HAND_HEIGHT }}>
        {top}
      </View>
      <View className="h-11 justify-center">{children}</View>
      <Text className="h-4 font-sans text-xs leading-4 text-ink-soft">{bottom ?? ""}</Text>
    </View>
  );
}

function Sign({ children }: { children: string }) {
  return (
    <Term>
      <Text className="font-sans-bold text-3xl text-ink-faint">{children}</Text>
    </Term>
  );
}

/**
 * The whole game in one line (web features/game/finger-sum.tsx): everyone's fingers add up to a
 * number, the number is a letter, circled in red pen. `animate` plays the sum term by term, then
 * pops the letter (the how-to-play cards); the rules page shows it still.
 */
export function FingerSum({ animate = false }: { animate?: boolean }) {
  const total = PLAYERS.reduce((sum, p) => sum + p.value, 0);
  const letter = String.fromCharCode(64 + total);

  return (
    <View
      className="flex-row flex-wrap items-center gap-x-6 gap-y-5"
      accessible
      accessibilityLabel={`Contoh: Budi 3 jari, Sari 5 jari, Andi 2 jari. Jumlahnya ${total}, huruf ke-${total} adalah ${letter}.`}
    >
      <View className="flex-row items-start gap-2.5">
        {PLAYERS.map((p, i) => (
          <Animated.View
            key={p.name}
            entering={animate ? FadeIn.delay(i * 250).duration(300) : undefined}
            className="flex-row items-start gap-2.5"
          >
            {i > 0 ? <Sign>+</Sign> : null}
            <Term
              bottom={p.name}
              top={
                <Image
                  source={HANDS[p.value - 1]}
                  style={{ height: HAND_HEIGHT, width: HAND_HEIGHT * HAND_RATIOS[p.value - 1]! }}
                  contentFit="contain"
                />
              }
            >
              <Text className="font-sans-bold text-4xl text-ink">{p.value}</Text>
            </Term>
          </Animated.View>
        ))}
        <Animated.View entering={animate ? FadeIn.delay(750).duration(300) : undefined} className="flex-row items-start gap-2.5">
          <Sign>=</Sign>
          <Term bottom="jumlah">
            <Text className="font-sans-bold text-4xl text-ink">{total}</Text>
          </Term>
        </Animated.View>
      </View>

      <Animated.View entering={animate ? ZoomIn.delay(1100).springify() : undefined} className="items-center">
        <View className="px-2">
          <Text className="font-sans-bold text-7xl leading-[76px] text-redpen">{letter}</Text>
          <PenCircle inset={14} />
          <Sparks color={colors.highlight} style={{ top: -10, right: -14, transform: [{ scaleX: -1 }] }} />
        </View>
        <View className="mt-4 rounded-sm bg-highlight px-2.5 py-0.5" style={{ transform: [{ rotate: "-2deg" }] }}>
          <Text className="font-hand text-lg text-ink">Huruf ronde ini: {letter}</Text>
        </View>
      </Animated.View>
    </View>
  );
}
