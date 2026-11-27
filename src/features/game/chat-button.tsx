import { MessageCircle } from "lucide-react-native";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { useAuthStore } from "@/features/auth/auth-store";
import { useRoomStore } from "@/features/room/room-store";
import { colors } from "@/theme/tokens";

import { ChatSheet } from "./chat-sheet";

/** Space from the screen edge, and above the voting footer while it is shown. */
const EDGE = 16;
const FOOTER_HEIGHT = 84;

/**
 * Chat (web chat-dock.tsx): a speech-bubble button in the bottom-right corner with the number of new
 * messages from other players, opening the chat as a sheet from the bottom. `aboveFooter` lifts it
 * over the voting footer so it never covers "Selesai Menilai".
 */
export function ChatButton({ aboveFooter }: { aboveFooter: boolean }) {
  const myId = useAuthStore((s) => s.user?.id);
  // Only the number of unread messages, so new messages don't redraw more than the badge.
  const total = useRoomStore((s) => s.messages.length);
  const [open, setOpen] = useState(false);
  /** How many messages there were when the sheet was last closed. */
  const [seen, setSeen] = useState(0);
  const unread = useRoomStore((s) =>
    open ? 0 : s.messages.slice(Math.min(seen, s.messages.length)).filter((m) => m.userId !== null && m.userId !== myId).length,
  );

  const close = () => {
    setOpen(false);
    setSeen(total);
  };

  return (
    <>
      <View pointerEvents="box-none" style={{ position: "absolute", right: EDGE, bottom: EDGE + (aboveFooter ? FOOTER_HEIGHT : 0) }}>
        <Pressable
          onPress={() => setOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={unread > 0 ? `Buka obrolan, ${unread} pesan baru` : "Buka obrolan"}
        >
          {({ pressed }) => (
            <View
              className="h-14 w-14 items-center justify-center rounded-full border-2 border-ink bg-highlight"
              style={{
                boxShadow: `${pressed ? 1 : 3}px ${pressed ? 1 : 3}px 0 ${colors.ink}`,
                transform: [{ translateX: pressed ? 2 : 0 }, { translateY: pressed ? 2 : 0 }],
              }}
            >
              <MessageCircle size={28} color={colors.ink} strokeWidth={2.5} />
              {unread > 0 ? (
                <View className="absolute -right-1.5 -top-1.5 min-w-6 items-center rounded-full border-2 border-ink bg-redpen px-1">
                  <Text className="font-sans-bold text-xs text-white">{unread > 9 ? "9+" : unread}</Text>
                </View>
              ) : null}
            </View>
          )}
        </Pressable>
      </View>
      {open ? <ChatSheet onClose={close} /> : null}
    </>
  );
}
