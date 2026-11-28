import { Stack } from "expo-router";
import { useEffect } from "react";

import { useRefreshRoomKeys } from "@/features/keys/use-refresh-room-keys";
import { useRoomStore } from "@/features/room/room-store";
import { useGameConnection } from "@/features/room/use-game-connection";
import { loadSounds, releaseSounds } from "@/lib/sounds";
import { useBackgroundMusic } from "@/lib/use-background-music";
import { colors } from "@/theme/tokens";

/** Screens for a signed-in player with a nickname. */
export default function AppLayout() {
  useGameConnection();
  useRefreshRoomKeys();
  const inRoom = useRoomStore((s) => s.roomId !== null);
  useBackgroundMusic();

  // Every press has its tap, in the lobby too, so the effects are loaded for the signed-in app.
  useEffect(() => {
    loadSounds();
    return releaseSounds;
  }, []);

  // The server decides whether we are in a room (also after a restart); the screens follow it.
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.paper } }}>
      <Stack.Protected guard={!inRoom}>
        <Stack.Screen name="index" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="how-to-play" />
        <Stack.Screen name="shop" />
      </Stack.Protected>
      <Stack.Protected guard={inRoom}>
        <Stack.Screen name="room" />
      </Stack.Protected>
      {/* Readable from both sides. Listed last: a screen that disappears falls back to the first one left. */}
      <Stack.Screen name="rules" />
    </Stack>
  );
}
