import "@/global.css";
import "@/lib/nativewind-interop";

import { Fredoka_400Regular, Fredoka_500Medium, Fredoka_600SemiBold, Fredoka_700Bold } from "@expo-google-fonts/fredoka";
import { Kalam_700Bold } from "@expo-google-fonts/kalam";
import { focusManager, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { AppState, Platform } from "react-native";

import { restoreSession, useAuthStore } from "@/features/auth/auth-store";
import { setUpAudio } from "@/lib/sounds";
import { colors } from "@/theme/tokens";

SplashScreen.preventAutoHideAsync();
// Other apps' music keeps playing under ours.
setUpAudio();

// TanStack Query's "window focus" on a phone is the app coming back to the foreground: refetch then
// (e.g. room keys that refilled while the app was in the background).
if (Platform.OS !== "web") {
  AppState.addEventListener("change", (state) => focusManager.setFocused(state === "active"));
}

export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient());
  const [fontsLoaded, fontError] = useFonts({
    Fredoka_400Regular,
    Fredoka_500Medium,
    Fredoka_600SemiBold,
    Fredoka_700Bold,
    Kalam_700Bold,
  });
  const status = useAuthStore((s) => s.status);
  const hasName = useAuthStore((s) => Boolean(s.user?.displayName));
  const ready = (fontsLoaded || fontError !== null) && status !== "loading";

  useEffect(() => {
    void restoreSession();
  }, []);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  // The splash screen covers fonts and the saved-session check, so the login screen never flashes
  // for a player who is already signed in.
  if (!ready) return null;

  const signedIn = status === "signedIn";
  // Where a guarded screen sends the player. Stated outright: with the unguarded "legal" screen in
  // the stack, the default (the stack's anchor) would open the privacy policy instead of the login.
  const home = !signedIn ? "/login" : !hasName ? "/choose-name" : "/";
  // Signed in -> pick a name once -> the app. Each screen is only reachable in its own state.
  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.paper } }}>
        <Stack.Protected guard={signedIn && hasName} redirectTo={home}>
          <Stack.Screen name="(app)" />
        </Stack.Protected>
        <Stack.Protected guard={signedIn && !hasName} redirectTo={home}>
          <Stack.Screen name="choose-name" />
        </Stack.Protected>
        <Stack.Protected guard={!signedIn} redirectTo={home}>
          <Stack.Screen name="login" />
        </Stack.Protected>
        {/* Privacy policy and terms: readable before signing in too. */}
        <Stack.Screen name="legal" />
      </Stack>
    </QueryClientProvider>
  );
}
