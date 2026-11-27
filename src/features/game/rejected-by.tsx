import { Text, View } from "react-native";

import type { GameRoomView } from "@/features/room/room-store";
import { rejectReasonLabel, type RejectReason } from "@/shared/game";

type Answer = GameRoomView["state"]["answers"][number];

/**
 * Public votes: who rejected the answer, and why, in the teacher's red pen. One line per reason
 * (the web has one per player), so eight players don't push the other answers off the screen.
 */
export function RejectedBy({ answer }: { answer: Answer }) {
  if (answer.rejectedBy.length === 0) return null;
  const names = new Map<RejectReason, string[]>();
  for (const r of answer.rejectedBy) names.set(r.reason, [...(names.get(r.reason) ?? []), r.name]);

  return (
    <View>
      {[...names].map(([reason, rejecters]) => (
        <Text key={reason} className="font-hand text-base leading-6 text-redpen">
          Ditolak {rejecters.join(", ")}: {rejectReasonLabel(reason)}
        </Text>
      ))}
    </View>
  );
}
