import { X } from "lucide-react-native";
import { useRef, useState, type ComponentRef } from "react";
import { FlatList, KeyboardAvoidingView, Modal, Pressable, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PrimaryButton } from "@/components/primary-button";
import { TextField } from "@/components/text-field";
import { useAuthStore } from "@/features/auth/auth-store";
import { sendMessage, useRoomStore } from "@/features/room/room-store";
import { useTimeLeft } from "@/lib/use-time-left";
import { LIMITS, type ChatMessage } from "@/shared/game";
import { cardShadow, colors } from "@/theme/tokens";

/** Share of the screen the sheet covers, as on the web. */
const SHEET_HEIGHT = 0.7;

/** "1:42" for a mute countdown. */
function clock(ms: number): string {
  const total = Math.ceil(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

/** "14:05", the time a message was sent. */
function timeOfDay(at: number): string {
  const date = new Date(at);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function Message({ message, myId }: { message: ChatMessage; myId: string | undefined }) {
  if (message.userId === null) {
    return <Text className="py-1 text-center font-sans text-xs text-ink-faint">{message.text}</Text>;
  }
  const mine = message.userId === myId;
  return (
    <View className={`gap-0.5 py-1 ${mine ? "items-end" : "items-start"}`}>
      <Text className="font-sans text-xs text-ink-soft">
        {mine ? "Kamu" : message.name} · {timeOfDay(message.at)}
      </Text>
      <View
        className={`max-w-[80%] rounded-2xl border-2 border-ink px-3 py-1.5 ${
          mine ? "rounded-br-sm bg-highlight-soft" : "rounded-bl-sm bg-white"
        }`}
      >
        <Text className="font-sans text-sm text-ink">{message.text}</Text>
      </View>
    </View>
  );
}

/**
 * The chat as a sheet from the bottom of the screen (web chat-dock.tsx): messages, status lines and
 * the message field. Mounted only while open.
 */
export function ChatSheet({ onClose }: { onClose: () => void }) {
  const myId = useAuthStore((s) => s.user?.id);
  const messages = useRoomStore((s) => s.messages);
  const connection = useRoomStore((s) => s.connection);
  const mutedMs = useTimeLeft(useRoomStore((s) => s.chatMutedUntil)) ?? 0;
  const muted = mutedMs > 0;
  const { height } = useWindowDimensions();
  const listRef = useRef<ComponentRef<typeof FlatList<ChatMessage>>>(null);

  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async () => {
    const value = text.trim();
    if (!value || sending || muted) return;
    setSending(true);
    const problem = await sendMessage(value);
    setSending(false);
    setError(problem);
    // A muted message stays in the field, so it isn't lost.
    if (!problem && !useRoomStore.getState().chatMutedUntil) setText("");
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent navigationBarTranslucent>
      <KeyboardAvoidingView className="flex-1" behavior="padding">
        <Pressable onPress={onClose} accessibilityLabel="Tutup obrolan" className="flex-1 bg-ink/40" />
        <SafeAreaView
          edges={["bottom"]}
          accessibilityViewIsModal
          className="rounded-t-2xl border-2 border-b-0 border-ink bg-white"
          // Shrinks when the keyboard opens, so the message field stays above it.
          style={{ height: height * SHEET_HEIGHT, flexShrink: 1, boxShadow: cardShadow }}
        >
          <View className="flex-row items-center justify-between border-b-2 border-ink px-4 py-2">
            <Text accessibilityRole="header" className="font-sans-bold text-lg text-ink">
              Obrolan
            </Text>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Tutup obrolan"
              hitSlop={8}
              className="h-9 w-9 items-center justify-center rounded-full border-2 border-ink bg-white active:bg-highlight-soft"
            >
              <X size={18} color={colors.ink} strokeWidth={3} />
            </Pressable>
          </View>

          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(m) => m.id}
            renderItem={({ item }) => <Message message={item} myId={myId} />}
            className="flex-1"
            contentContainerClassName="px-4 py-3"
            // New messages arrive at the bottom, and the keyboard makes the list shorter: keep the newest in view.
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
            onLayout={() => listRef.current?.scrollToEnd({ animated: false })}
            initialNumToRender={20}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <Text className="py-6 text-center font-sans text-sm text-ink-faint">Belum ada pesan. Sapa yang lain!</Text>
            }
          />

          <View className="gap-1 px-4">
            {connection === "reconnecting" ? (
              <Text className="font-sans-semibold text-xs text-ink-soft">Koneksi terputus, menghubungkan ulang…</Text>
            ) : null}
            {error ? (
              <Text accessibilityRole="alert" className="font-sans-semibold text-xs text-redpen">
                {error}
              </Text>
            ) : null}
            {muted ? (
              <Text accessibilityLiveRegion="polite" className="font-sans-semibold text-xs text-redpen">
                Kamu dibisukan karena melanggar aturan chat. Bisa mengirim pesan lagi dalam {clock(mutedMs)}.
              </Text>
            ) : null}
          </View>

          <View className="flex-row items-center gap-2 border-t-2 border-ink/15 p-3">
            <View className="flex-1">
              <TextField
                label="Tulis pesan"
                hideLabel
                value={text}
                onChangeText={(value) => {
                  setText(value);
                  setError(null);
                }}
                maxLength={LIMITS.message}
                placeholder={muted ? `Dibisukan · ${clock(mutedMs)}` : "Tulis pesan…"}
                editable={!muted}
                returnKeyType="send"
                submitBehavior="submit"
                onSubmitEditing={() => void send()}
              />
            </View>
            <PrimaryButton label="Kirim" onPress={() => void send()} disabled={!text.trim() || sending || muted} />
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
