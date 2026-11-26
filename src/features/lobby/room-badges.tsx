import { Globe, Lock } from "lucide-react-native";
import { Text, View } from "react-native";

import type { LobbyRoom } from "@/shared/contract";
import { colors } from "@/theme/tokens";

export function VisibilityBadge({ isPrivate }: { isPrivate: boolean }) {
  const Icon = isPrivate ? Lock : Globe;
  return (
    <View className="flex-row items-center gap-1 rounded-full border-2 border-ink bg-white px-2 py-0.5">
      <Icon size={12} color={colors.ink} strokeWidth={2.5} />
      <Text className="font-sans-semibold text-xs text-ink">{isPrivate ? "Privat" : "Publik"}</Text>
    </View>
  );
}

/**
 * Where a room stands for someone in the lobby. Only rooms that haven't started and have space can
 * be joined; one whose host has no key can still be joined by its code (friends waiting together).
 */
export function getRoomStatus(room: LobbyRoom): { label: string; dot: string; joinable: boolean } {
  if (room.locked) return { label: "Sedang bermain", dot: "bg-[#e0a21b]", joinable: false };
  if (room.memberCount >= room.maxMembers) return { label: "Ruangan penuh", dot: "bg-redpen", joinable: false };
  if (room.hostNeedsKey) return { label: "Host kehabisan kunci", dot: "bg-ink-faint", joinable: true };
  return { label: "Belum mulai", dot: "bg-success", joinable: true };
}

export function RoomStatusLabel({ room }: { room: LobbyRoom }) {
  const status = getRoomStatus(room);
  return (
    <View className="flex-row items-center gap-1.5">
      <View className={`h-2.5 w-2.5 rounded-full ${status.dot}`} />
      <Text className="font-sans text-sm text-ink-soft">{status.label}</Text>
    </View>
  );
}
