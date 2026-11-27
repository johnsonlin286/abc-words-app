import { useState } from "react";
import { Text, View } from "react-native";

import { PrimaryButton } from "@/components/primary-button";
import { SecondaryButton } from "@/components/secondary-button";
import { setVotingDone, type GameRoomView } from "@/features/room/room-store";

import { isAfk } from "./afk";

/** Same rule as the server: online, not AFK, with someone else's unverified answer to judge. */
function votingJudges({ members, state }: GameRoomView) {
  return members.filter(
    (m) =>
      m.isConnected &&
      !isAfk(state, m.userId) &&
      state.answers.some((a) => a.userId !== m.userId && !a.verified),
  );
}

/**
 * Stays at the bottom of the screen while voting: how many are done, and the button that says this
 * player is. Its height doesn't change, so the list above never jumps.
 */
export function VotingFooter({ room, myId }: { room: GameRoomView; myId: string }) {
  const [error, setError] = useState<string | null>(null);
  const { votingDone, paused } = room.state;
  const judges = votingJudges(room);
  const isJudge = judges.some((m) => m.userId === myId);
  const iAmDone = votingDone.includes(myId);
  const doneCount = judges.filter((m) => votingDone.includes(m.userId)).length;

  const toggle = async () => setError(await setVotingDone(!iAmDone));

  return (
    <View className="min-h-20 flex-row items-center gap-3 border-t-2 border-ink bg-paper px-6 py-2">
      <Text
        accessibilityLiveRegion="polite"
        numberOfLines={3}
        className={`flex-1 text-sm ${error ? "font-sans-semibold text-redpen" : "font-sans text-ink-soft"}`}
      >
        {paused
          ? "Permainan dijeda."
          : (error ??
            (isJudge ? `${doneCount} dari ${judges.length} selesai menilai.` : "Menunggu pemain lain menilai jawabanmu."))}
      </Text>
      {!isJudge ? null : iAmDone ? (
        <SecondaryButton label="Belum Selesai" onPress={() => void toggle()} disabled={paused} />
      ) : (
        <PrimaryButton label="Selesai Menilai" onPress={() => void toggle()} disabled={paused} />
      )}
    </View>
  );
}
