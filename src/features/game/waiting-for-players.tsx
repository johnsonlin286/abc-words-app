import { Pause, WifiOff } from "lucide-react-native";
import { Text, View } from "react-native";

import { useRoomStore } from "@/features/room/room-store";
import { useTimeLeft } from "@/lib/use-time-left";
import { colors } from "@/theme/tokens";

/**
 * Shown while fewer than two players are online: the game stands still (one pause per player per
 * game) or keeps running, and ends when the countdown does.
 */
export function WaitingForPlayers() {
  const endsAt = useRoomStore((s) => s.waitingEndsAt);
  const paused = useRoomStore((s) => s.room?.state.paused ?? false);
  const left = useTimeLeft(endsAt);
  if (left === null) return null;

  const Icon = paused ? Pause : WifiOff;
  return (
    <View className="flex-row items-center gap-3 rounded-xl border-2 border-dashed border-ink-soft bg-highlight-soft px-3.5 py-3">
      <Icon size={26} color={colors.ink} strokeWidth={2.5} />
      <View className="flex-1 gap-0.5">
        <Text accessibilityLiveRegion="polite" className="font-sans-bold text-lg text-ink">
          {paused ? "Permainan dijeda" : "Pemain lain terputus"}
        </Text>
        <Text className="font-sans text-sm leading-5 text-ink">
          Menunggu pemain tersambung lagi.{paused ? "" : " Waktu tetap berjalan."} Permainan berakhir dalam{" "}
          <Text className="font-sans-bold">{Math.ceil(left / 1000)} detik</Text>.
        </Text>
      </View>
    </View>
  );
}
