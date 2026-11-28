import { useEffect } from "react";
import { Text, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

import { playSound } from "@/lib/sounds";
import { useSecondsLeft } from "@/lib/use-time-left";
import { colors } from "@/theme/tokens";

/** Every bar turns red-pen for this last stretch of its phase. */
const URGENT_SECONDS = 3;

/**
 * Time left in the current phase (web features/game/countdown.tsx): a highlighter stroke in a pen
 * outline with the seconds on the right. `urgent` turns it red before the last `URGENT_SECONDS`.
 *
 * The bar shrinks on the UI thread, and the number redraws once a second: a countdown runs through
 * every timed phase, so it must not keep the JS thread busy while players type or vote.
 */
export function Countdown({ endsAt, totalMs, urgent: forced = false }: { endsAt: number; totalMs: number; urgent?: boolean }) {
  const seconds = useSecondsLeft(endsAt) ?? 0;
  const urgent = forced || seconds <= URGENT_SECONDS;
  const progress = useSharedValue(1);

  // A tick for each of the last seconds, with the red bar.
  useEffect(() => {
    if (seconds >= 1 && seconds <= URGENT_SECONDS) playSound("tick");
  }, [seconds]);

  useEffect(() => {
    // Capped: on a busy phone a newer end time can arrive before the phase starts, showing more than the phase.
    const left = Math.min(Math.max(endsAt - Date.now(), 0), totalMs);
    progress.set(totalMs > 0 ? left / totalMs : 0);
    progress.set(withTiming(0, { duration: left, easing: Easing.linear }));
  }, [endsAt, totalMs, progress]);

  // Every style of the bar is in this one object: NativeWind would merge a className with it and the
  // animation would be lost.
  const bar = useAnimatedStyle(() => ({
    height: "100%",
    borderRadius: 999,
    width: `${progress.get() * 100}%`,
    backgroundColor: urgent ? colors.redpen : colors.highlight,
  }));

  return (
    <View accessible accessibilityRole="timer" accessibilityLabel={`Sisa ${seconds} detik`} className="flex-row items-center gap-3">
      <View className="h-3.5 flex-1 overflow-hidden rounded-full border-2 border-ink bg-white">
        <Animated.View style={bar} />
      </View>
      <Text
        className={`w-8 text-right font-sans-bold text-xl ${urgent ? "text-redpen" : "text-ink"}`}
        style={{ fontVariant: ["tabular-nums"] }}
      >
        {Math.min(seconds, Math.ceil(totalMs / 1000))}
      </Text>
    </View>
  );
}
