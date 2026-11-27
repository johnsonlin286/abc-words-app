import { useState } from "react";
import { Text, View } from "react-native";

import { SecondaryButton } from "@/components/secondary-button";
import { endGame, type GameRoomView } from "@/features/room/room-store";

/** Temporary screen for the final scores, which don't have their own yet. */
export function FinishedPlaceholder({ room, isHost }: { room: GameRoomView; isHost: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { endedReason } = room.state;

  // Closing the final scores loses nothing, so it doesn't ask.
  const close = async () => {
    setBusy(true);
    setError(await endGame());
    setBusy(false);
  };

  return (
    <View className="gap-4">
      <Text accessibilityRole="header" className="font-sans-bold text-xl text-ink">
        Permainan selesai
      </Text>
      {endedReason ? <Text className="font-sans text-base text-ink">{endedReason}.</Text> : null}
      <Text className="font-sans text-base leading-6 text-ink-soft">Layar skor akhir menyusul di tahap berikutnya.</Text>
      {isHost ? (
        <>
          <SecondaryButton label="Kembali ke Ruang Tunggu" onPress={() => void close()} disabled={busy} />
          {error ? (
            <Text accessibilityRole="alert" className="font-sans-semibold text-sm text-redpen">
              {error}
            </Text>
          ) : null}
        </>
      ) : null}
    </View>
  );
}
