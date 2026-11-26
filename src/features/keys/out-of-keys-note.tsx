import { Text, View } from "react-native";

import { KeyIcon } from "./key-icon";
import { formatCountdown } from "./use-room-keys";

/** "Kuncimu habis" with the countdown to the next key, under the button that has to wait for it. */
export function OutOfKeysNote({ msUntilNext }: { msUntilNext: number | null }) {
  return (
    <View
      accessible
      className="flex-row items-center gap-3 rounded-xl border-2 border-dashed border-ink-soft bg-highlight-soft px-3.5 py-2.5"
    >
      <KeyIcon used size={22} />
      <Text className="flex-1 font-sans text-sm leading-5 text-ink">
        Kuncimu habis.
        {msUntilNext === null ? null : (
          <Text>
            {" "}
            Kunci berikutnya dalam <Text className="font-sans-bold">{formatCountdown(msUntilNext)}</Text>.
          </Text>
        )}
      </Text>
    </View>
  );
}
