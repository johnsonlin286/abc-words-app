import { Stack } from "expo-router";

import { useRefreshRoomKeys } from "@/features/keys/use-refresh-room-keys";
import { useRoomStore } from "@/features/room/room-store";
import { useGameConnection } from "@/features/room/use-game-connection";
import { colors } from "@/theme/tokens";

/** Screens for a signed-in player with a nickname. */
export default function AppLayout() {
  useGameConnection();
  useRefreshRoomKeys();
  const inRoom = useRoomStore((s) => s.roomId !== null);

  // The server decides whether we are in a room (also after a restart); the screens follow it.
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.paper } }}>
      <Stack.Protected guard={!inRoom}>
        <Stack.Screen name="index" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="how-to-play" />
      </Stack.Protected>
      <Stack.Protected guard={inRoom}>
        <Stack.Screen name="room" />
      </Stack.Protected>
      {/* Readable from both sides. Listed last: a screen that disappears falls back to the first one left. */}
      <Stack.Screen name="rules" />
    </Stack>
  );
}
