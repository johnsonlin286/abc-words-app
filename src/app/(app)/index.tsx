import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { NoteCard } from "@/components/note-card";
import { Paper } from "@/components/paper";
import { signOut, useAuthStore } from "@/features/auth/auth-store";
import { signOutOfGoogle } from "@/features/auth/google-sign-in";

/** Temporary home until the lobby exists: shows who is signed in and lets them sign out. */
export default function Home() {
  const user = useAuthStore((s) => s.user);
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    await signOutOfGoogle();
    await signOut();
  }

  return (
    <Paper>
      <SafeAreaView className="flex-1 justify-center px-8">
        <NoteCard className="gap-4 p-5">
          <Text className="font-sans-bold text-2xl text-ink">Halo, {user?.displayName}!</Text>
          <Text className="font-sans text-base leading-6 text-ink-soft">
            Masuk sebagai <Text className="font-sans-semibold text-ink">{user?.email ?? "akun Google"}</Text>.
            Lobi dan permainan menyusul di tahap berikutnya.
          </Text>
          <View className="items-start">
            <Pressable
              onPress={logout}
              disabled={busy}
              accessibilityRole="button"
              className="rounded-xl border-2 border-ink bg-white px-5 py-2.5 active:bg-highlight-soft"
            >
              <Text className="font-sans-semibold text-base text-ink">{busy ? "Keluar…" : "Keluar"}</Text>
            </Pressable>
          </View>
        </NoteCard>
      </SafeAreaView>
    </Paper>
  );
}
