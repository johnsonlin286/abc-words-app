import { useAudioPlayer } from "expo-audio";
import { BellRing, X } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Text, Vibration, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";

import { usePreferences } from "@/features/preferences/preferences-store";
import { clearPing, setReady, useRoomStore } from "@/features/room/room-store";
import { colors, cardShadow } from "@/theme/tokens";
import { Pressable } from "@/components/pressable";

const pingSound = require("../../../assets/sounds/ping.mp3");

/** How long the call stays on screen. */
const SHOW_MS = 8_000;
/** Wait, buzz, pause, buzz (ms). */
const VIBRATION = [0, 200, 100, 200];

/**
 * The host called this player from the waiting room: a sound, a vibration and a note pinned to the
 * top of the screen with a one-tap "Saya Siap!". A phone on silent only vibrates; the sound and the
 * vibration each follow their switch in Pengaturan.
 */
export function PingAlert({ isReady }: { isReady: boolean }) {
  const ping = useRoomStore((s) => s.ping);
  const player = useAudioPlayer(pingSound);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ping) return;
    // Read at call time: the switches in Pengaturan apply to the next call.
    const { sound, vibration } = usePreferences.getState();
    if (sound) {
      void player
        .seekTo(0)
        .then(() => player.play())
        .catch(() => {});
    }
    if (vibration) Vibration.vibrate(VIBRATION);
    const timer = setTimeout(clearPing, SHOW_MS);
    return () => clearTimeout(timer);
  }, [ping, player]);

  // Nothing to nag about once the player is ready (e.g. pressed it on the page itself).
  useEffect(() => {
    if (isReady) clearPing();
  }, [isReady, ping]);

  if (!ping || isReady) return null;

  return (
    <View className="absolute left-3 right-3 top-2">
      {/* Keyed by the call, so a second call drops in again. */}
      <Animated.View
        key={ping.at}
        entering={FadeInUp.springify()}
        accessibilityRole="alert"
        className="flex-row items-center gap-2.5 rounded-2xl border-2 border-ink bg-highlight px-3 py-3"
        style={{ boxShadow: cardShadow }}
      >
        <BellRing size={26} color={colors.ink} strokeWidth={2.5} />
        <Text className="flex-1 font-sans text-base leading-5 text-ink">
          <Text className="font-sans-bold">{ping.from}</Text> memanggilmu!
        </Text>
        <Pressable
          onPress={async () => setError(await setReady(true))}
          accessibilityRole="button"
          hitSlop={6}
          className="rounded-xl border-2 border-ink bg-white px-3 py-1.5 active:bg-highlight-soft"
        >
          <Text className="font-sans-semibold text-sm text-ink">Saya Siap!</Text>
        </Pressable>
        <Pressable onPress={clearPing} accessibilityRole="button" accessibilityLabel="Tutup" hitSlop={10}>
          <X size={18} color={colors.ink} strokeWidth={3} />
        </Pressable>
      </Animated.View>
      {error ? (
        <Text accessibilityRole="alert" className="mt-1 rounded-lg bg-white px-3 py-1 font-sans-semibold text-sm text-redpen">
          {error}
        </Text>
      ) : null}
    </View>
  );
}
