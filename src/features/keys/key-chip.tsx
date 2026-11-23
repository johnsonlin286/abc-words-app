import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { KeyRow } from "./key-icon";
import { KeysDialog } from "./keys-dialog";
import { formatCountdown, useRoomKeys } from "./use-room-keys";

/** Room keys at a glance (top of the home screen): five keys, used ones faded, and the time to the next. */
export function KeyChip() {
  const { keys, msUntilNext, isError } = useRoomKeys();
  const [open, setOpen] = useState(false);

  const label =
    keys === null
      ? "Kunci room"
      : `${keys.count} dari ${keys.max} kunci room${msUntilNext === null ? ", penuh" : `, berikutnya dalam ${formatCountdown(msUntilNext)}`}`;

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={label}
        hitSlop={6}
        className="h-11 flex-row items-center gap-2 rounded-xl border-2 border-ink bg-white px-3 active:bg-highlight-soft"
      >
        {keys ? (
          <KeyRow count={keys.count} max={keys.max} size={18} />
        ) : (
          <Text className="font-sans-bold text-base text-ink">{isError ? "–" : "…"}</Text>
        )}
        {msUntilNext !== null ? (
          <View className="border-l border-paper-line pl-2">
            <Text className="font-sans-semibold text-sm text-ink-soft">{formatCountdown(msUntilNext)}</Text>
          </View>
        ) : null}
      </Pressable>
      <KeysDialog visible={open} onClose={() => setOpen(false)} />
    </>
  );
}
