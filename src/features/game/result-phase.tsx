import { Check, X } from "lucide-react-native";
import { Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { VerifiedBadge } from "@/components/verified-badge";
import type { GameRoomView } from "@/features/room/room-store";
import { formatPoints, POINTS, type Penalty } from "@/shared/game";
import { colors } from "@/theme/tokens";

import { CrossedText } from "./crossed-text";
import { RejectedBy } from "./rejected-by";
import { RoundHeader } from "./round-header";
import { strikeLabel, WarningIcon } from "./warning-badge";

type Answer = GameRoomView["state"]["answers"][number];

/** Time between two answers appearing. */
const STAGGER_MS = 60;

const PENALTY_POINTS: Record<Penalty["reason"], number> = {
  "no-answer": POINTS.noAnswer,
  "lone-rejection": POINTS.loneRejection,
};

function penaltyText(p: Penalty): string {
  return p.reason === "no-answer" ? `${p.name} tidak menjawab` : `${p.name} menolak "${p.answerText}" sendirian`;
}

/** What a lone rejection means for the player, so a warning is never a surprise. */
function strikeNote(p: Penalty): string {
  return p.warning
    ? `Belum ada potongan poin. Sekali lagi menolak sendirian dianggap sengaja: ${formatPoints(POINTS.loneRejection)} poin.`
    : `Sudah ${p.strike ?? 0}× menolak sendirian, dianggap sengaja (${strikeLabel(p.strike ?? 0)}).`;
}

/** The rule's points, so a penalty never looks like "0"; see `FloorNote`. */
function Points({ rule, lost }: { rule: number; lost: boolean }) {
  return (
    <Text
      className={`min-w-7 text-right font-sans-bold text-lg ${lost ? "text-redpen" : "text-success"}`}
      style={{ fontVariant: ["tabular-nums"] }}
    >
      {formatPoints(rule)}
    </Text>
  );
}

/** Why the score changed less than the points shown: scores never go below 0. */
function FloorNote() {
  return <Text className="font-sans text-xs leading-4 text-ink-soft">Skor tidak bisa minus.</Text>;
}

function ResultRow({ answer }: { answer: Answer }) {
  const accepted = !!answer.accepted;
  const rule = accepted ? POINTS.accepted : answer.judgedByOne ? POINTS.rejectedByOne : POINTS.rejected;
  const Icon = accepted ? Check : X;

  return (
    <View className="gap-0.5 py-1.5">
      <View className="flex-row items-center gap-2">
        <View className="flex-1">
          {accepted ? (
            <Text className="font-sans-bold text-lg leading-6 text-ink">{answer.text}</Text>
          ) : (
            // A failed answer is crossed out in red pen; the row keeps the stroke as wide as the word.
            <View className="flex-row">
              <View className="shrink">
                <CrossedText text={answer.text} className="text-lg leading-6" />
              </View>
            </View>
          )}
          <View className="flex-row flex-wrap items-center gap-x-2">
            <Text numberOfLines={1} className="shrink font-sans text-sm text-ink-soft">
              {answer.name}
            </Text>
            {answer.verified ? <VerifiedBadge compact /> : null}
          </View>
          {(answer.points ?? 0) !== rule ? <FloorNote /> : null}
        </View>
        <View
          className={`flex-row items-center gap-1 rounded-full border-2 px-2 py-0.5 ${
            accepted ? "border-success" : "border-redpen"
          }`}
        >
          <Icon size={14} color={accepted ? colors.success : colors.redpen} strokeWidth={3.5} />
          <Text className={`font-sans-bold text-sm ${accepted ? "text-success" : "text-redpen"}`}>
            {accepted ? "Lolos" : "Gugur"}
          </Text>
        </View>
        <Points rule={rule} lost={!accepted} />
      </View>
      <RejectedBy answer={answer} />
    </View>
  );
}

/** How each answer fared, and the other points taken this round. */
export function ResultPhase({ room, letter }: { room: GameRoomView; letter: string }) {
  const { answers, penalties } = room.state;

  return (
    <View className="gap-3">
      <RoundHeader room={room} letter={letter} />

      {answers.length === 0 ? (
        <Text className="font-sans text-base text-ink-soft">Tidak ada yang menjawab di ronde ini.</Text>
      ) : (
        <View>
          {answers.map((a, index) => (
            <Animated.View key={a.userId} entering={FadeInDown.delay(index * STAGGER_MS).duration(300)}>
              <View className={index < answers.length - 1 ? "border-b-2 border-paper-line" : ""}>
                <ResultRow answer={a} />
              </View>
            </Animated.View>
          ))}
        </View>
      )}

      {penalties.length > 0 ? (
        <View className="gap-2">
          <Text accessibilityRole="header" className="font-sans-bold text-base text-ink">
            Hukuman
          </Text>
          {penalties.map((p) => (
            <View
              key={`${p.reason}-${p.userId}-${p.answerText ?? ""}`}
              className="flex-row items-center justify-between gap-3 rounded-xl border-2 border-dashed border-redpen bg-white px-3 py-1.5"
            >
              <View className="flex-1">
                <Text className="font-sans-semibold text-sm text-ink">{penaltyText(p)}</Text>
                {p.reason === "lone-rejection" ? (
                  <Text className="font-sans text-xs leading-4 text-ink-soft">{strikeNote(p)}</Text>
                ) : null}
                {!p.warning && p.points !== PENALTY_POINTS[p.reason] ? <FloorNote /> : null}
              </View>
              {p.warning ? (
                <View className="flex-row items-center gap-1.5">
                  <WarningIcon />
                  <Text className="font-sans-bold text-sm text-ink">Peringatan {strikeLabel(p.strike ?? 0)}</Text>
                </View>
              ) : (
                <Points rule={PENALTY_POINTS[p.reason]} lost />
              )}
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}
