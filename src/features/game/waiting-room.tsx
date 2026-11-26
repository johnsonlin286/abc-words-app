import { Check } from "lucide-react-native";
import { useState } from "react";
import { Text, View } from "react-native";

import { PrimaryButton } from "@/components/primary-button";
import { SecondaryButton } from "@/components/secondary-button";
import { setReady, type GameRoomView } from "@/features/room/room-store";
import { MIN_PLAYERS, playersNotReady } from "@/shared/game";
import { colors } from "@/theme/tokens";

import { GameSettingsForm, RulesSummary } from "./game-settings-form";
import { HostStart } from "./host-start";
import { PlayerSeats } from "./player-seats";

/** Before the game: who is in, the rules, and "Siap" (players) or "Mulai" (host). */
export function WaitingRoom({ room, myId }: { room: GameRoomView; myId: string }) {
  const isHost = room.hostId === myId;
  const hostName = room.members.find((m) => m.userId === room.hostId)?.name;
  const [error, setError] = useState<string | null>(null);

  const enoughPlayers = room.members.filter((m) => m.isConnected).length >= MIN_PLAYERS;
  const categoryMissing = room.settings.category === "custom" && !room.settings.customCategory;
  // Same rule as the server: every online player other than the host has pressed "Siap".
  const notReady = playersNotReady(room.members, room.hostId, room.state.ready);
  const iAmReady = room.state.ready.includes(myId);

  // Same conditions the server checks before it starts a game.
  const canStart = enoughPlayers && !categoryMissing && notReady.length === 0;

  let status: string | null = null;
  if (!enoughPlayers) status = `Butuh minimal ${MIN_PLAYERS} pemain. Bagikan kode room ke temanmu.`;
  else if (!isHost) {
    status = iAmReady
      ? `Kamu sudah siap. Menunggu ${hostName} memulai permainan.`
      : "Tekan “Saya Siap!” kalau sudah siap bermain.";
  } else if (categoryMissing) status = "Tulis nama kategorinya dulu.";
  else if (notReady.length > 0) {
    status = `Menunggu ${notReady.map((m) => m.name).join(", ")} siap. Tekan ikon lonceng untuk memanggil.`;
  }

  const toggleReady = async () => setError(await setReady(!iAmReady));

  return (
    <View className="gap-6">
      {room.state.endedReason ? (
        <View
          accessibilityLiveRegion="polite"
          className="rounded-xl border-2 border-dashed border-ink-soft bg-highlight-soft px-3.5 py-2.5"
        >
          <Text className="font-sans text-sm text-ink">{room.state.endedReason}.</Text>
        </View>
      ) : null}

      <PlayerSeats
        members={room.members}
        maxMembers={room.maxMembers}
        hostId={room.hostId}
        myId={myId}
        ready={room.state.ready}
      />

      {/* Only the host can change the rules, so the others get them in one line. */}
      {isHost ? <GameSettingsForm settings={room.settings} /> : <RulesSummary settings={room.settings} />}

      <View className="gap-3 border-t-2 border-dashed border-ink-faint pt-5">
        {isHost ? (
          <HostStart canStart={canStart} status={status} />
        ) : iAmReady ? (
          <SecondaryButton label="Batal Siap" onPress={() => void toggleReady()} />
        ) : (
          <PrimaryButton
            label="Saya Siap!"
            onPress={() => void toggleReady()}
            accessory={<Check size={20} color={colors.ink} strokeWidth={3} />}
          />
        )}
        {!isHost && status ? <Text className="font-sans text-sm leading-5 text-ink-soft">{status}</Text> : null}
        {error ? (
          <Text accessibilityRole="alert" className="font-sans-semibold text-sm text-redpen">
            {error}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
