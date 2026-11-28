import { Text, View } from "react-native";

import type { LobbyRoom } from "@/shared/contract";

import { getRoomStatus, RoomStatusLabel, VisibilityBadge } from "./room-badges";
import { Pressable } from "@/components/pressable";

/** One open room in the lobby list; rooms that are full, playing or waiting for a key can't be picked. */
export function RoomRow({ room, onSelect }: { room: LobbyRoom; onSelect: (room: LobbyRoom) => void }) {
  const status = getRoomStatus(room);
  // Not offered from the list: someone looking for a game would only sit and wait there.
  const selectable = status.joinable && !room.hostNeedsKey;
  return (
    <Pressable
      onPress={() => onSelect(room)}
      disabled={!selectable}
      accessibilityRole="button"
      accessibilityState={{ disabled: !selectable }}
      accessibilityLabel={`Room ${room.id}, host ${room.hostName ?? "tidak ada"}, ${room.memberCount} dari ${room.maxMembers} pemain, ${room.hasPassword ? "privat" : "publik"}, ${status.label}`}
      className={`flex-row items-center gap-3 rounded-xl border-2 px-3.5 py-2.5 ${
        selectable ? "border-ink bg-white active:bg-highlight-soft" : "border-ink-faint bg-paper"
      }`}
    >
      <View className="flex-1">
        <Text className="font-sans-bold text-lg text-ink" style={{ letterSpacing: 2 }}>
          {room.id}
        </Text>
        <Text numberOfLines={1} className="font-sans text-sm text-ink-soft">
          Host {room.hostName ?? "—"}
        </Text>
        <Text className="font-sans text-sm text-ink-soft">
          {room.memberCount}/{room.maxMembers} pemain
        </Text>
      </View>
      <View className="items-end gap-1.5">
        <VisibilityBadge isPrivate={room.hasPassword} />
        <RoomStatusLabel room={room} />
      </View>
    </Pressable>
  );
}
