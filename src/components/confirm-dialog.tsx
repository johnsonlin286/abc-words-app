import { Modal, Pressable, Text, View } from "react-native";

import { NoteCard } from "./note-card";

type Props = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  busy?: boolean;
  error?: string | null;
  /** Destructive actions confirm in red pen. */
  danger?: boolean;
};

/** A card over a dimmed page asking to confirm one action ("Batal" or the action). */
export function ConfirmDialog({ visible, title, message, confirmLabel, onConfirm, onCancel, busy, error, danger }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={busy ? () => {} : onCancel} statusBarTranslucent>
      <View className="flex-1 justify-center bg-ink/40 px-6">
        <NoteCard className="gap-4 p-5" accessibilityViewIsModal>
          <Text accessibilityRole="header" className="font-sans-bold text-2xl text-ink">
            {title}
          </Text>
          <Text className="font-sans text-base leading-6 text-ink-soft">{message}</Text>
          {error ? <Text accessibilityRole="alert" className="font-sans-semibold text-sm text-redpen">{error}</Text> : null}
          <View className="flex-row justify-end gap-3">
            <Pressable
              onPress={onCancel}
              disabled={busy}
              accessibilityRole="button"
              className="rounded-xl border-2 border-ink bg-white px-4 py-2.5 active:bg-highlight-soft"
            >
              <Text className="font-sans-semibold text-base text-ink">Batal</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              disabled={busy}
              accessibilityRole="button"
              className={`rounded-xl border-2 px-4 py-2.5 ${danger ? "border-redpen bg-redpen active:opacity-80" : "border-ink bg-highlight"}`}
            >
              <Text className={`font-sans-semibold text-base ${danger ? "text-white" : "text-ink"}`}>
                {busy ? "Sebentar…" : confirmLabel}
              </Text>
            </Pressable>
          </View>
        </NoteCard>
      </View>
    </Modal>
  );
}
