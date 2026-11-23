import { useState } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, Text, View } from "react-native";

import { NoteCard } from "@/components/note-card";
import { TextField } from "@/components/text-field";
import { setDisplayName, useAuthStore } from "@/features/auth/auth-store";
import { ApiError } from "@/lib/api";
import { LIMITS, USER_NAME_HINT, validateUserName } from "@/shared/game";
import { colors } from "@/theme/tokens";

type Props = { visible: boolean; onClose: () => void };

/**
 * Rename as a card over the page (same look as the delete confirmation). Same field and rules as
 * the first nickname; the button says "Simpan" and only works once the name changed.
 */
export function NameDialog({ visible, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      {/* Mounted only while open, so the field starts from the current name every time. */}
      {visible ? <NameForm onClose={onClose} /> : null}
    </Modal>
  );
}

function NameForm({ onClose }: { onClose: () => void }) {
  const current = useAuthStore((s) => s.user?.displayName ?? "");
  const [name, setName] = useState(current);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmed = name.trim();
  const unchanged = trimmed === current;
  const validationError = validateUserName(trimmed);
  const shown = (trimmed.length > 0 || submitted ? validationError : null) ?? error;
  const canSave = !unchanged && !saving;

  async function save() {
    setSubmitted(true);
    if (validationError || unchanged) return;
    setSaving(true);
    setError(null);
    try {
      await setDisplayName(trimmed);
      onClose();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Gagal menyimpan nama panggilan. Coba lagi, ya.");
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 justify-center bg-ink/40 px-6"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <NoteCard className="gap-4 p-5" accessibilityViewIsModal>
        <View className="gap-1">
          <Text accessibilityRole="header" className="font-sans-bold text-2xl text-ink">
            Ubah nama panggilan
          </Text>
          <Text className="font-sans text-base leading-6 text-ink-soft">
            Nama lamamu bebas dipakai pemain lain setelah diganti.
          </Text>
        </View>
        <TextField
          label="Nama panggilan"
          hint={`${USER_NAME_HINT}.`}
          error={shown}
          value={name}
          onChangeText={(text) => {
            setName(text);
            setError(null);
          }}
          placeholder="budi_01"
          maxLength={LIMITS.userName}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="nickname"
          autoFocus
          selectTextOnFocus
          returnKeyType="done"
          onSubmitEditing={save}
          editable={!saving}
        />
        <View className="flex-row justify-end gap-3">
          <Pressable
            onPress={onClose}
            disabled={saving}
            accessibilityRole="button"
            className="rounded-xl border-2 border-ink bg-white px-4 py-2.5 active:bg-highlight-soft"
          >
            <Text className="font-sans-semibold text-base text-ink">Batal</Text>
          </Pressable>
          <Pressable
            onPress={save}
            disabled={!canSave}
            accessibilityRole="button"
            accessibilityState={{ disabled: !canSave, busy: saving }}
          >
            {({ pressed }) => (
              <View
                className={`rounded-xl border-2 px-4 py-2.5 ${canSave ? "border-ink bg-highlight" : "border-ink-faint bg-paper"}`}
                style={
                  canSave
                    ? {
                        boxShadow: `${pressed ? 1 : 3}px ${pressed ? 1 : 3}px 0 ${colors.ink}`,
                        transform: [{ translateX: pressed ? 2 : 0 }, { translateY: pressed ? 2 : 0 }],
                      }
                    : undefined
                }
              >
                <Text className={`font-sans-semibold text-base ${canSave ? "text-ink" : "text-ink-faint"}`}>
                  {saving ? "Menyimpan…" : "Simpan"}
                </Text>
              </View>
            )}
          </Pressable>
        </View>
      </NoteCard>
    </KeyboardAvoidingView>
  );
}
