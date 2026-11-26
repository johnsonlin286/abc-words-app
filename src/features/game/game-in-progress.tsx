import { Flag } from "lucide-react-native";
import { useState } from "react";
import { Text, View } from "react-native";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { SecondaryButton } from "@/components/secondary-button";
import { endGame, type GameRoomView } from "@/features/room/room-store";
import { colors } from "@/theme/tokens";

/** Temporary screen for a running game until the phase screens exist; the host can end the game. */
export function GameInProgress({ room, isHost }: { room: GameRoomView; isHost: boolean }) {
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirm = async () => {
    setBusy(true);
    const message = await endGame();
    setBusy(false);
    setError(message);
    if (!message) setAsking(false);
  };

  return (
    <View className="gap-4">
      <Text accessibilityRole="header" className="font-sans-bold text-xl text-ink">
        Ronde {room.state.round} dari {room.settings.maxRounds}
      </Text>
      <Text className="font-sans text-base leading-6 text-ink-soft">
        Permainan sedang berjalan. Layar permainan menyusul di tahap berikutnya.
      </Text>
      {isHost ? (
        <SecondaryButton
          label="Akhiri Permainan"
          icon={<Flag size={20} color={colors.ink} strokeWidth={2.5} />}
          onPress={() => {
            setError(null);
            setAsking(true);
          }}
        />
      ) : null}
      <ConfirmDialog
        visible={asking && isHost}
        title="Akhiri permainan?"
        message="Semua pemain kembali ke ruang tunggu. Kunci yang sudah terpakai tidak kembali."
        confirmLabel="Ya, Akhiri"
        cancelLabel="Lanjut Main"
        danger
        busy={busy}
        error={error}
        onConfirm={() => void confirm()}
        onCancel={() => setAsking(false)}
      />
    </View>
  );
}
