import { MessageCircle } from "lucide-react-native";
import { useState } from "react";
import { Text, View } from "react-native";

import { useAuthStore } from "@/features/auth/auth-store";
import { useRoomStore } from "@/features/room/room-store";
import { playSound } from "@/lib/sounds";
import { colors } from "@/theme/tokens";

import { ChatSheet } from "./chat-sheet";
import { Pressable } from "@/components/pressable";

/** How far down the screen the tab sits: clear of the score row and of the voting footer. */
const TOP = "58%";

/**
 * Chat (web chat-dock.tsx): a bookmark tab on the right edge of the page, like a marker sticking out
 * of a notebook (owner's choice, 2026-11-28; the round button in the corner covered Tolak buttons).
 * It sits in the page margin, so it never covers the game, shows the number of new messages from
 * other players, and opens the chat as a sheet from the bottom.
 */
export function ChatButton() {
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
    playSound("chatClose");
    setOpen(false);
    setSeen(total);
  };

  return (
    <>
      <View pointerEvents="box-none" style={{ position: "absolute", right: 0, top: TOP }}>
        <Pressable
          onPress={() => setOpen(true)}
          sound="chatOpen"
          hitSlop={{ top: 4, bottom: 4, left: 16 }}
          accessibilityRole="button"
          accessibilityLabel={unread > 0 ? `Buka obrolan, ${unread} pesan baru` : "Buka obrolan"}
        >
          {({ pressed }) => (
            <View
              className="items-center gap-1 rounded-l-lg border-2 border-r-0 border-ink bg-highlight py-3"
              // Reaches a little over the card's edge, like a bookmark clipped onto the page (owner, 2026-11-28).
              style={{
                width: 30,
                boxShadow: `0px ${pressed ? 1 : 3}px 0 ${colors.ink}`,
                transform: [{ translateX: pressed ? 2 : 0 }],
              }}
            >
              <MessageCircle size={18} color={colors.ink} strokeWidth={2.5} />
              {unread > 0 ? (
                <View className="min-w-4 items-center rounded-full bg-redpen px-0.5">
                  <Text className="font-sans-bold text-[11px] text-white">{unread > 99 ? "99+" : unread}</Text>
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
