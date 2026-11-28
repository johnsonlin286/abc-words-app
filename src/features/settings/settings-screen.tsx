import Constants from "expo-constants";
import { router } from "expo-router";
import { LogOut, Trash2 } from "lucide-react-native";
import { useState } from "react";
import { Text, View } from "react-native";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { NoteCard } from "@/components/note-card";
import { SettingsRow } from "@/components/settings-row";
import { SubScreen } from "@/components/sub-screen";
import { deleteAccount, signOut, useAuthStore } from "@/features/auth/auth-store";
import { signOutOfGoogle } from "@/features/auth/google-sign-in";
import { SoundSwitches } from "@/features/preferences/sound-switches";
import { ApiError } from "@/lib/api";
import { colors } from "@/theme/tokens";

import { monthYear } from "./format";
import { NameDialog } from "./name-dialog";
import { Pressable } from "@/components/pressable";

function SectionTitle({ children }: { children: string }) {
  return <Text className="font-sans-bold text-xl text-ink">{children}</Text>;
}

/**
 * Pengaturan: who you are (nickname, email only you see, member since), about the app,
 * music, sound effects and vibration on this phone, and the account actions. The avatar comes with its own feature.
 */
export function SettingsScreen() {
  const user = useAuthStore((s) => s.user);
  const [renaming, setRenaming] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  async function leave() {
    setSigningOut(true);
    await signOutOfGoogle();
    await signOut();
  }

  async function removeAccount() {
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteAccount();
      await signOutOfGoogle();
    } catch (e) {
      setDeleteError(e instanceof ApiError ? e.message : "Gagal menghapus akun. Coba lagi, ya.");
      setDeleting(false);
    }
  }

  return (
    <SubScreen title="Pengaturan">
      <View className="gap-2">
        <SectionTitle>Profil</SectionTitle>
        <NoteCard className="px-4 py-1">
          <SettingsRow
            label="Nama panggilan"
            value={user?.displayName ?? "-"}
            onPress={() => setRenaming(true)}
          />
          {/* The email is only ever shown to its owner (Google user data policy). */}
          <SettingsRow label="Email" value={user?.email ?? "-"} />
          <SettingsRow label="Main sejak" value={user ? monthYear(user.createdAt) : "-"} last />
        </NoteCard>
      </View>

      <View className="gap-2">
        <SectionTitle>Suara & getar</SectionTitle>
        <NoteCard className="px-4 py-1">
          <SoundSwitches />
        </NoteCard>
      </View>

      <View className="gap-2">
        <SectionTitle>Tentang</SectionTitle>
        <NoteCard className="px-4 py-1">
          <SettingsRow label="Cara bermain" onPress={() => router.push("/how-to-play")} />
          <SettingsRow
            label="Kebijakan Privasi"
            onPress={() => router.push({ pathname: "/legal", params: { doc: "privasi" } })}
          />
          <SettingsRow
            label="Syarat & Ketentuan"
            onPress={() => router.push({ pathname: "/legal", params: { doc: "syarat" } })}
          />
          <SettingsRow label="Versi aplikasi" value={Constants.expoConfig?.version ?? "-"} last />
        </NoteCard>
      </View>

      <View className="gap-2">
        <SectionTitle>Akun</SectionTitle>
        <NoteCard className="gap-3 p-4">
          <Pressable
            onPress={leave}
            disabled={signingOut}
            accessibilityRole="button"
            className="flex-row items-center justify-center gap-2 rounded-xl border-2 border-ink bg-white px-5 py-3 active:bg-highlight-soft"
          >
            <LogOut size={20} color={colors.ink} strokeWidth={2.5} />
            <Text className="font-sans-semibold text-base text-ink">{signingOut ? "Keluar…" : "Keluar"}</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              setDeleteError(null);
              setConfirming(true);
            }}
            accessibilityRole="button"
            className="flex-row items-center justify-center gap-2 rounded-xl px-5 py-2.5 active:bg-highlight-soft"
          >
            <Trash2 size={20} color={colors.redpen} strokeWidth={2.5} />
            <Text className="font-sans-semibold text-base text-redpen">Hapus Akun</Text>
          </Pressable>
        </NoteCard>
      </View>

      <NameDialog visible={renaming} onClose={() => setRenaming(false)} />

      <ConfirmDialog
        visible={confirming}
        title="Hapus akun?"
        message={`Nama panggilan "${user?.displayName ?? ""}" dan semua data akunmu akan dihapus permanen. Ini tidak bisa dibatalkan.`}
        confirmLabel="Hapus Akun"
        danger
        busy={deleting}
        error={deleteError}
        onCancel={() => setConfirming(false)}
        onConfirm={removeAccount}
      />
    </SubScreen>
  );
}
