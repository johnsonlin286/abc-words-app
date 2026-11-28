import { BellRing, Check, Crown, X, type LucideIcon } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { Text, View } from "react-native";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { kickPlayer, pingPlayer } from "@/features/room/room-store";
import type { MemberView } from "@/shared/contract";
import { PING_COOLDOWN_MS } from "@/shared/game";
import { colors } from "@/theme/tokens";
import { Pressable } from "@/components/pressable";

type Props = {
  members: MemberView[];
  maxMembers: number;
  hostId: string;
  myId: string;
  /** Players who pressed "Siap"; the host counts as ready. */
  ready: string[];
};

/**
 * Waiting-room seats, two per row, with each player's "Siap" status. The host also gets a bell to
 * call a player who isn't ready (once per `PING_COOLDOWN_MS`) and a cross to remove a player, after
 * a confirmation. All empty seats share one cell.
 */
export function PlayerSeats({ members, maxMembers, hostId, myId, ready }: Props) {
  const emptySeats = Math.max(maxMembers - members.length, 0);
  const iAmHost = myId === hostId;
  const [error, setError] = useState<string | null>(null);
  /** Players called in the last `PING_COOLDOWN_MS`, so their bell greys out (the server enforces it too). */
  const [cooling, setCooling] = useState<string[]>([]);
  const coolingTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => coolingTimers.current.forEach(clearTimeout), []);

  const [kicking, setKicking] = useState<MemberView | null>(null);
  const [kickBusy, setKickBusy] = useState(false);
  const [kickError, setKickError] = useState<string | null>(null);

  const ping = async (member: MemberView) => {
    const message = await pingPlayer(member.userId);
    setError(message);
    if (message) return;
    setCooling((ids) => [...ids, member.userId]);
    coolingTimers.current.push(
      setTimeout(() => setCooling((ids) => ids.filter((id) => id !== member.userId)), PING_COOLDOWN_MS),
    );
  };

  const confirmKick = async () => {
    if (!kicking) return;
    setKickBusy(true);
    const message = await kickPlayer(kicking.userId);
    setKickBusy(false);
    setKickError(message);
    if (!message) setKicking(null);
  };

  const seats = members.map((member) => {
    const isHost = member.userId === hostId;
    const isReady = isHost || ready.includes(member.userId);
    const isMe = member.userId === myId;
    return (
      <View
        key={member.userId}
        className={`flex-1 gap-1.5 rounded-xl border-2 px-3 py-2 ${isMe ? "bg-highlight-soft" : "bg-white"} ${
          member.isConnected ? "border-ink" : "border-ink-faint"
        }`}
      >
        <View
          className="flex-row items-center gap-2"
          accessible
          accessibilityLabel={`${member.name}${isMe ? " (kamu)" : ""}${isHost ? ", host" : ""}${
            member.isConnected ? "" : ", terputus"
          }`}
        >
          <View className={`h-2.5 w-2.5 rounded-full ${member.isConnected ? "bg-success" : "bg-ink-faint"}`} />
          <Text
            numberOfLines={2}
            className={`flex-1 font-sans-semibold text-sm ${member.isConnected ? "text-ink" : "text-ink-faint"}`}
          >
            {member.name}
          </Text>
        </View>

        <View className="min-h-[30px] flex-row items-center justify-between gap-1">
          {isHost ? (
            <Text className="font-sans-semibold text-xs text-ink-soft">Host</Text>
          ) : isReady ? (
            <View className="flex-row items-center gap-1">
              <Check size={14} color={colors.success} strokeWidth={3.5} />
              <Text className="font-sans-bold text-xs text-success">Siap</Text>
            </View>
          ) : (
            // Wraps onto two lines when the host's buttons leave little room.
            <Text className="shrink font-sans text-xs leading-4 text-ink-faint">Belum siap</Text>
          )}
          {iAmHost && !isHost ? (
            <View className="flex-row gap-1.5">
              {!isReady && member.isConnected ? (
                <SeatButton
                  icon={BellRing}
                  label={cooling.includes(member.userId) ? `${member.name} baru dipanggil` : `Panggil ${member.name}`}
                  disabled={cooling.includes(member.userId)}
                  onPress={() => void ping(member)}
                />
              ) : null}
              <SeatButton
                icon={X}
                label={`Keluarkan ${member.name}`}
                danger
                onPress={() => {
                  setKickError(null);
                  setKicking(member);
                }}
              />
            </View>
          ) : null}
        </View>

        {/* Sits on the seat's corner so the name keeps the full width. */}
        {isHost ? (
          <View className="absolute -right-1.5 -top-2.5 rounded-full border-2 border-ink bg-highlight p-0.5">
            <Crown size={14} color={colors.ink} fill="white" strokeWidth={2.5} />
          </View>
        ) : null}
      </View>
    );
  });

  if (emptySeats > 0) {
    seats.push(
      <View
        key="empty"
        className="flex-1 items-center justify-center rounded-xl border-2 border-dashed border-ink-faint px-3 py-2"
      >
        <Text className="text-center font-sans text-sm text-ink-faint">
          {emptySeats === 1 ? "1 bangku kosong" : `+${emptySeats} bangku kosong`}
        </Text>
      </View>,
    );
  }

  return (
    <View className="gap-3">
      <Text accessibilityRole="header" className="font-sans-bold text-xl text-ink">
        Pemain{" "}
        <Text className="text-ink-faint">
          {members.length}/{maxMembers}
        </Text>
      </Text>
      <View className="gap-2.5">
        {Array.from({ length: Math.ceil(seats.length / 2) }, (_, row) => (
          <View key={row} className="flex-row gap-2.5">
            {seats[row * 2]}
            {/* An odd last seat keeps its half width. */}
            {seats[row * 2 + 1] ?? <View className="flex-1" />}
          </View>
        ))}
      </View>
      {error ? (
        <Text accessibilityRole="alert" className="font-sans-semibold text-sm text-redpen">
          {error}
        </Text>
      ) : null}
      <ConfirmDialog
        visible={kicking !== null}
        title={`Keluarkan ${kicking?.name ?? ""}?`}
        message="Dia dikeluarkan dari room ini, tapi masih bisa masuk lagi."
        confirmLabel="Ya, Keluarkan"
        danger
        busy={kickBusy}
        error={kickError}
        onConfirm={() => void confirmKick()}
        onCancel={() => setKicking(null)}
      />
    </View>
  );
}

type SeatButtonProps = {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  danger?: boolean;
};

function SeatButton({ icon: Icon, label, onPress, disabled = false, danger = false }: SeatButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      // The seat is small; the touch area reaches past the icon.
      hitSlop={{ top: 8, bottom: 8, left: 3, right: 3 }}
      className={`h-[30px] w-[30px] items-center justify-center rounded-lg border-2 bg-white ${
        disabled ? "border-ink-faint" : "border-ink active:bg-highlight-soft"
      }`}
    >
      <Icon size={15} color={disabled ? colors.inkFaint : danger ? colors.redpen : colors.ink} strokeWidth={2.75} />
    </Pressable>
  );
}
