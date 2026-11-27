import * as Clipboard from "expo-clipboard";
import { router } from "expo-router";
import { BookOpen, Copy, LogOut, Share2, type LucideIcon } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Pressable, Share, Text, View } from "react-native";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { VisibilityBadge } from "@/features/lobby/room-badges";
import { leaveRoom, type GameRoomView } from "@/features/room/room-store";
import { colors } from "@/theme/tokens";

import { EndGame } from "./end-game";

/** The room code on the paper, with what to do with it and the way out. */
export function RoomBar({ room, isHost }: { room: GameRoomView; isHost: boolean }) {
  const [copied, setCopied] = useState(false);
  const [askLeave, setAskLeave] = useState(false);
  const { phase } = room.state;
  const playing = phase !== "waiting" && phase !== "finished";

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1_500);
    return () => clearTimeout(timer);
  }, [copied]);

  const copy = async () => {
    await Clipboard.setStringAsync(room.id);
    setCopied(true);
  };

  // Only the code for now; an invite link follows once the web has its domain.
  const share = () => {
    void Share.share({ message: `Ayo main ABC Lima Dasar! Gabung pakai kode room ${room.id}.` }).catch(() => {});
  };

  return (
    <View className="gap-3">
      <View className="flex-row flex-wrap items-center gap-3">
        <Text
          accessibilityRole="header"
          accessibilityLabel={`Kode room ${room.id.split("").join(" ")}`}
          className="font-sans-bold text-4xl text-ink"
          style={{ letterSpacing: 4 }}
        >
          {room.id}
        </Text>
        <VisibilityBadge isPrivate={room.hasPassword} />
      </View>
      <View className="flex-row flex-wrap gap-x-5 gap-y-3">
        <Action icon={BookOpen} label="Cara Main" onPress={() => router.push("/rules")} />
        <Action icon={Copy} label={copied ? "Kode Tersalin" : "Salin Kode"} onPress={() => void copy()} />
        <Action icon={Share2} label="Bagikan" onPress={share} />
        {/* A running game can't be rejoined, so leaving it asks first. */}
        <Action
          icon={LogOut}
          label="Keluar Room"
          onPress={() => (playing ? setAskLeave(true) : void leaveRoom())}
          danger
        />
        {isHost && playing ? (
          <EndGame room={room}>
            {(open, icon) => <Action icon={icon} label="Akhiri Permainan" onPress={open} danger />}
          </EndGame>
        ) : null}
      </View>
      <ConfirmDialog
        visible={askLeave && playing}
        title="Keluar dari room?"
        message={leaveMessage(true)}
        confirmLabel="Keluar Room"
        danger
        onConfirm={() => {
          setAskLeave(false);
          void leaveRoom();
        }}
        onCancel={() => setAskLeave(false)}
      />
    </View>
  );
}

/** What leaving means, for the dialogs that ask about it. */
export function leaveMessage(playing: boolean): string {
  return playing
    ? "Permainan sedang berjalan, jadi kamu tidak bisa masuk lagi sampai selesai."
    : "Kamu bisa bergabung lagi dengan kode room selama permainannya belum dimulai.";
}

type ActionProps = { icon: LucideIcon; label: string; onPress: () => void; danger?: boolean };

/** A link-style action with its icon. */
function Action({ icon: Icon, label, onPress, danger = false }: ActionProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      hitSlop={8}
      className="flex-row items-center gap-1.5 active:opacity-60"
    >
      <Icon size={16} color={danger ? colors.redpen : colors.ink} strokeWidth={2.5} />
      <Text className={`font-sans-semibold text-sm underline ${danger ? "text-redpen" : "text-ink"}`}>{label}</Text>
    </Pressable>
  );
}
