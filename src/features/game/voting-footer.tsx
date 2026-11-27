import { ArrowDown } from "lucide-react-native";
import { useState } from "react";
import { Text, View } from "react-native";

import { PrimaryButton } from "@/components/primary-button";
import { SecondaryButton } from "@/components/secondary-button";
import { setVotingDone, type GameRoomView } from "@/features/room/room-store";
import { colors } from "@/theme/tokens";

import { isAfk } from "./afk";

/** Same rule as the server: online, with someone else's unverified answer to judge. */
function canJudge({ members, state }: GameRoomView, userId: string): boolean {
  const member = members.find((m) => m.userId === userId);
  return !!member?.isConnected && state.answers.some((a) => a.userId !== userId && !a.verified);
}

/** The judges voting waits for (server `judgesOf`): AFK players may judge, but aren't waited for. */
function awaitedJudges(room: GameRoomView) {
  return room.members.filter((m) => !isAfk(room.state, m.userId) && canJudge(room, m.userId));
}

type Props = {
  room: GameRoomView;
  myId: string;
  /** Answers this player hasn't had on screen yet this round. */
  below: number;
  /** Scrolls on to the answers still below the screen. */
  onShowMore: () => void;
};

/**
 * Stays at the bottom of the screen while voting: how many are done, and the button that says this
 * player is. Until every answer has been on screen it reads "Lihat N Lagi" and scrolls
 * instead, so nobody finishes judging without seeing them all (owner, 2026-11-27). Its height
 * doesn't change, so the list above never jumps.
 */
export function VotingFooter({ room, myId, below, onShowMore }: Props) {
  const [error, setError] = useState<string | null>(null);
  const { votingDone, paused } = room.state;
  const judges = awaitedJudges(room);
  const isJudge = canJudge(room, myId);
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
            (isJudge ? `${doneCount}/${judges.length} selesai` : "Menunggu pemain lain menilai jawabanmu."))}
      </Text>
      {!isJudge ? null : !iAmDone && below > 0 ? (
        <PrimaryButton
          label={`Lihat ${below} Lagi`}
          accessibilityLabel={`Lihat ${below} jawaban lagi di bawah`}
          accessory={<ArrowDown size={20} color={colors.ink} strokeWidth={2.75} />}
          onPress={onShowMore}
        />
      ) : iAmDone ? (
        <SecondaryButton label="Belum Selesai" onPress={() => void toggle()} disabled={paused} />
      ) : (
        <PrimaryButton label="Selesai Menilai" onPress={() => void toggle()} disabled={paused} />
      )}
    </View>
  );
}
