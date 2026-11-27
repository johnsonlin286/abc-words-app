import { Text, View } from "react-native";

import { AFK_ROUNDS, type GameState } from "@/shared/game";

import { InfoBadge } from "./info-badge";

/** Same rule as the server: this many rounds in a row without picking a number or answering. */
export function isAfk(state: GameState, userId: string): boolean {
  return (state.idleRounds[userId] ?? 0) >= AFK_ROUNDS;
}

/** "AFK" next to a player the game no longer waits for; tapping it says why. */
export function AfkBadge({ name }: { name: string }) {
  return (
    <InfoBadge
      label={`${name} AFK`}
      explanation={`${name} tidak memilih angka dan tidak menjawab ${AFK_ROUNDS} ronde berturut-turut, jadi permainan tidak menunggunya. Begitu ${name} memilih angka atau menjawab, ia aktif lagi.`}
    >
      <View className="rounded-full border-2 border-ink-faint px-1.5">
        <Text className="font-sans text-xs text-ink-soft">AFK</Text>
      </View>
    </InfoBadge>
  );
}

/** Shown to the AFK player themself, so they know how to get back in. */
export function AfkNotice() {
  return (
    <View
      accessibilityLiveRegion="polite"
      className="rounded-xl border-2 border-dashed border-ink-soft bg-highlight-soft px-3.5 py-2.5"
    >
      <Text className="font-sans text-sm leading-5 text-ink">
        Kamu dianggap AFK karena {AFK_ROUNDS} ronde tidak memilih angka dan tidak menjawab, jadi permainan tidak
        menunggumu. Pilih angka atau kirim jawaban untuk kembali aktif.
      </Text>
    </View>
  );
}
