import { Flag } from "lucide-react-native";
import { useState, type ReactNode } from "react";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { endGame, type GameRoomView } from "@/features/room/room-store";
import { hasFinishedRound } from "@/shared/game";

type Props = {
  room: GameRoomView;
  /** The button that opens the dialog, drawn by the room bar. */
  children: (open: () => void, icon: typeof Flag) => ReactNode;
};

/** Host only "Akhiri Permainan": asks first, because ending stops the game for everyone. */
export function EndGame({ room, children }: Props) {
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
    <>
      {children(() => {
        setError(null);
        setAsking(true);
      }, Flag)}
      <ConfirmDialog
        visible={asking}
        title="Akhiri permainan?"
        message={
          hasFinishedRound(room.state)
            ? "Semua pemain melihat skor akhir. Ronde yang belum selesai tidak dihitung. Kunci yang sudah terpakai tidak kembali."
            : "Belum ada ronde yang selesai, jadi semua pemain kembali ke ruang tunggu. Kunci yang sudah terpakai tidak kembali."
        }
        confirmLabel="Ya, Akhiri"
        cancelLabel="Lanjut Main"
        danger
        busy={busy}
        error={error}
        onConfirm={() => void confirm()}
        onCancel={() => setAsking(false)}
      />
    </>
  );
}
