import { Link } from "expo-router";
import { Settings } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { NoteCard } from "@/components/note-card";
import { Paper } from "@/components/paper";
import { useAuthStore } from "@/features/auth/auth-store";
import { KeyChip } from "@/features/keys/key-chip";
import { colors } from "@/theme/tokens";

/** Temporary home until the lobby exists: room keys, a greeting and the way to Pengaturan. */
export default function Home() {
  const user = useAuthStore((s) => s.user);

  return (
    <Paper>
      <SafeAreaView className="flex-1 px-6">
        <View className="flex-row items-center justify-between pt-2">
          <KeyChip />
          <Link href="/settings" asChild>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Pengaturan"
              hitSlop={8}
              className="h-11 w-11 items-center justify-center rounded-xl border-2 border-ink bg-white active:bg-highlight-soft"
            >
              <Settings size={22} color={colors.ink} strokeWidth={2.5} />
            </Pressable>
          </Link>
        </View>
        <View className="flex-1 justify-center">
          <NoteCard className="gap-3 p-5">
            <Text className="font-sans-bold text-2xl text-ink">Halo, {user?.displayName}!</Text>
            <Text className="font-sans text-base leading-6 text-ink-soft">
              Lobi dan permainan menyusul di tahap berikutnya.
            </Text>
          </NoteCard>
        </View>
      </SafeAreaView>
    </Paper>
  );
}
