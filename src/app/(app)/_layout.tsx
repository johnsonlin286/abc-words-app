import { Stack } from "expo-router";

import { colors } from "@/theme/tokens";

/** Screens for a signed-in player with a nickname. */
export default function AppLayout() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.paper } }} />;
}
