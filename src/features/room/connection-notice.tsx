import { Text } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

import { useRoomStore } from "./room-store";

/** Quiet while online; otherwise says that the game server isn't reachable yet. */
export function ConnectionNotice() {
  const connection = useRoomStore((s) => s.connection);
  const error = useRoomStore((s) => s.connectionError);
  if (connection === "online" || connection === "idle") return null;

  return (
    // The delay keeps a normal, quick connection from flashing the notice.
    <Animated.View
      entering={FadeIn.delay(800)}
      accessibilityLiveRegion="polite"
      className="rounded-xl border-2 border-dashed border-ink-soft bg-highlight-soft px-3.5 py-2.5"
    >
      <Text className="font-sans text-sm text-ink">
        {error ?? (connection === "connecting" ? "Menghubungkan ke server…" : "Menghubungkan ulang ke server…")}
      </Text>
    </Animated.View>
  );
}
