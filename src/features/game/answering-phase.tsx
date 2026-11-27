import type { ComponentRef } from "react";
import { Text, View } from "react-native";

import { useAuthStore } from "@/features/auth/auth-store";
import { useRoomStore, type GameRoomView } from "@/features/room/room-store";

import { AnswerForm } from "./answer-form";
import { AnswerPills } from "./answer-pills";
import { Countdown } from "./countdown";
import { RoundHeader } from "./round-header";

type Props = {
  room: GameRoomView;
  letter: string;
  /** Called when the answer field should be on screen. */
  onFormShown: (row: ComponentRef<typeof View> | null) => void;
};

/** Letter, time and the answer field close together, so all of it fits above the keyboard. */
export function AnsweringPhase({ room, letter, onFormShown }: Props) {
  const myId = useAuthStore((s) => s.user?.id);
  const endsAt = useRoomStore((s) => s.phaseEndsAt);
  const mine = room.state.answers.find((a) => a.userId === myId);

  return (
    <View className="gap-3">
      <RoundHeader room={room} letter={letter} />
      {endsAt !== null && room.state.phaseMs !== null ? <Countdown endsAt={endsAt} totalMs={room.state.phaseMs} /> : null}

      {mine ? (
        <View accessibilityLiveRegion="polite" className="rounded-xl border-2 border-ink bg-highlight-soft px-3.5 py-2.5">
          <Text className="font-sans text-base leading-6 text-ink">
            Jawabanmu: <Text className="font-sans-bold text-lg">{mine.text}</Text>. Menunggu pemain lain.
          </Text>
        </View>
      ) : (
        <AnswerForm letter={letter} paused={room.state.paused} onShow={onFormShown} />
      )}

      <AnswerPills room={room} />
    </View>
  );
}
