import "@/global.css";

import { Fredoka_400Regular, Fredoka_500Medium, Fredoka_600SemiBold, Fredoka_700Bold } from "@expo-google-fonts/fredoka";
import { Kalam_700Bold } from "@expo-google-fonts/kalam";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";

import { restoreSession, useAuthStore } from "@/features/auth/auth-store";
import { colors } from "@/theme/tokens";

SplashScreen.preventAutoHideAsync();

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
  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.paper } }}>
        <Stack.Protected guard={signedIn}>
          <Stack.Screen name="(app)" />
        </Stack.Protected>
        <Stack.Protected guard={!signedIn}>
          <Stack.Screen name="login" />
        </Stack.Protected>
      </Stack>
    </QueryClientProvider>
  );
}
