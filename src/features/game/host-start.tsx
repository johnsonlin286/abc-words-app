import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Text, View } from "react-native";

import { PrimaryButton } from "@/components/primary-button";
import { KeyCost } from "@/features/keys/key-cost";
import { OutOfKeysNote } from "@/features/keys/out-of-keys-note";
import { useRoomKeys } from "@/features/keys/use-room-keys";
import { startGame, useRoomStore } from "@/features/room/room-store";

/**
 * The host's "Mulai Permainan": costs one room key. Without keys the button waits and counts down
 * to the next one; the server checks the count again when the game starts.
 */
export function HostStart({ canStart, status }: { canStart: boolean; status: string | null }) {
  const online = useRoomStore((s) => s.connection === "online");
  const { keys, msUntilNext } = useRoomKeys();
  const queryClient = useQueryClient();
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const outOfKeys = keys?.count === 0;

  const start = async () => {
    setStarting(true);
    const message = await startGame();
    setError(message);
    setStarting(false);
    // The server may know better, e.g. the keys were used on another phone.
    if (message) void queryClient.invalidateQueries({ queryKey: ["room-keys"] });
  };

  return (
    <View className="gap-3">
      <PrimaryButton
        label={starting ? "Memulai…" : "Mulai Permainan"}
        accessibilityLabel="Mulai Permainan, memakai 1 kunci"
        onPress={() => void start()}
        loading={starting}
        disabled={!canStart || outOfKeys || !online}
        accessory={<KeyCost />}
      />
      {/* Why the game can't start yet, right under the button. */}
      {status ? <Text className="font-sans text-sm leading-5 text-ink-soft">{status}</Text> : null}
      {outOfKeys ? (
        <OutOfKeysNote msUntilNext={msUntilNext} />
      ) : keys ? (
        <Text className="font-sans text-sm text-ink-faint">Kamu punya {keys.count} kunci.</Text>
      ) : null}
      {/* The note above already says it when the keys ran out. */}
      {error && !outOfKeys ? (
        <Text accessibilityRole="alert" className="font-sans-semibold text-sm text-redpen">
          {error}
        </Text>
      ) : null}
    </View>
  );
}
