import { Info } from "lucide-react-native";
import { useRef, useState, type ComponentRef, type RefObject } from "react";
import { Text, View, type LayoutChangeEvent } from "react-native";

import { VerifiedBadge } from "@/components/verified-badge";
import { useAuthStore } from "@/features/auth/auth-store";
import { playSound } from "@/lib/sounds";
import { setRejection, useRoomStore, type GameRoomView } from "@/features/room/room-store";
import { formatPoints, LONE_REJECTION_WARNINGS, POINTS, REJECT_REASONS, type RejectReason } from "@/shared/game";
import { colors } from "@/theme/tokens";

import { Countdown } from "./countdown";
import { InfoBadge } from "./info-badge";
import { RejectedBy } from "./rejected-by";
import { RoundHeader } from "./round-header";
import { WarningIcon, warningText } from "./warning-badge";
import { Pressable } from "@/components/pressable";

type Answer = GameRoomView["state"]["answers"][number];
type RowRef = ComponentRef<typeof View> | null;

type Props = {
  room: GameRoomView;
  letter: string;
  /** Called when reasons open under an answer, so they can be brought into view. */
  onReasonsShown: (row: RowRef) => void;
  /** Where the list and each answer are, so the footer knows which answers are still below the screen. */
  listRef: RefObject<ComponentRef<typeof View> | null>;
  onListLayout: (round: string) => void;
  onRowLayout: (round: string, answerUserId: string, e: LayoutChangeEvent) => void;
};

/** The rules of judging, behind the info button so the answers get the room. */
function rulesText(oneJudge: boolean, anyVerified: boolean): string {
  const rejecting = oneJudge
    ? "Kalian main berdua: jawaban yang kamu tolak langsung gugur, tapi tanpa pengurangan poin. Jatah tolak tidak dikembalikan."
    : `Jawaban yang gugur ${formatPoints(POINTS.rejected)} poin. Tolakan yang disetujui pemain lain dikembalikan ke jatahmu. Menolak sendirian jawaban yang tetap lolos, mulai kali ke-${LONE_REJECTION_WARNINGS + 1}: ${formatPoints(POINTS.loneRejection)} poin.`;
  const verified = "Jawaban Terverifikasi ada di daftar kategori ini, jadi langsung lolos dan tidak bisa ditolak.";
  return anyVerified ? `${rejecting}\n\n${verified}` : rejecting;
}

/** "Salah ejaan" on a button: every word capitalized. */
function buttonLabel(label: string): string {
  return label.replace(/\b\w/g, (first) => first.toUpperCase());
}

/**
 * All answers in one compact list: reject with a reason under the answer, votes public. The button
 * that ends this player's judging is in `VotingFooter`, which stays on screen.
 */
export function VotingPhase({ room, letter, onReasonsShown, listRef, onListLayout, onRowLayout }: Props) {
  const myId = useAuthStore((s) => s.user?.id);
  const endsAt = useRoomStore((s) => s.phaseEndsAt);
  /** Answer whose reasons are open before a rejection is sent. */
  const [choosingFor, setChoosingFor] = useState<string | null>(null);

  const { answers, rejectionsLeft, phaseMs } = room.state;
  const anyVerified = answers.some((a) => a.verified);
  const myLoneRejections = (myId && room.state.loneRejections[myId]) || 0;
  // Same rule as the server: with two players online, each answer has one judge.
  const oneJudge = room.members.filter((m) => m.isConnected).length === 2;

  return (
    <View className="gap-3">
      <RoundHeader room={room} letter={letter} />
      {endsAt !== null && phaseMs !== null ? <Countdown endsAt={endsAt} totalMs={phaseMs} /> : null}

      <View className="flex-row items-center justify-between gap-2">
        <View className="shrink flex-row items-center gap-2">
          <Text accessibilityRole="header" className="shrink font-sans-bold text-lg text-ink">
            Coret yang salah!
          </Text>
          <InfoBadge label="Aturan menilai" explanation={rulesText(oneJudge, anyVerified)}>
            <Info size={20} color={colors.inkSoft} strokeWidth={2.5} />
          </InfoBadge>
        </View>
        <Text className="font-sans text-sm text-ink-soft">
          Jatah tolak: <Text className="bg-highlight font-sans-bold text-ink"> {rejectionsLeft} </Text>
        </Text>
      </View>

      {oneJudge ? (
        <Text className="font-sans text-sm text-ink-soft">Main berdua: tolakanmu langsung menggugurkan.</Text>
      ) : null}
      {myLoneRejections >= LONE_REJECTION_WARNINGS ? (
        <View className="flex-row items-start gap-1.5">
          <View className="pt-0.5">
            <WarningIcon />
          </View>
          <Text className="flex-1 font-sans-semibold text-sm leading-5 text-redpen">
            {warningText(myLoneRejections, null)}
          </Text>
        </View>
      ) : null}

      <View ref={listRef} collapsable={false} onLayout={() => onListLayout(String(room.state.round))} className="gap-2">
        {answers.map((a) => (
          <AnswerRow
            key={a.userId}
            answer={a}
            myId={myId}
            choosing={choosingFor === a.userId}
            noRejectionsLeft={rejectionsLeft === 0}
            onChoose={(open) => setChoosingFor(open ? a.userId : null)}
            onReasonsShown={onReasonsShown}
            onLayout={(e) => onRowLayout(String(room.state.round), a.userId, e)}
          />
        ))}
      </View>
    </View>
  );
}

type RowProps = {
  answer: Answer;
  myId: string | undefined;
  choosing: boolean;
  noRejectionsLeft: boolean;
  onChoose: (open: boolean) => void;
  onReasonsShown: (row: RowRef) => void;
  onLayout: (e: LayoutChangeEvent) => void;
};

function AnswerRow({ answer, myId, choosing, noRejectionsLeft, onChoose, onReasonsShown, onLayout }: RowProps) {
  const rowRef = useRef<ComponentRef<typeof View>>(null);
  const [error, setError] = useState<string | null>(null);
  const isMine = answer.userId === myId;
  const mine = answer.rejectedBy.find((r) => r.userId === myId);
  const showReasons = !isMine && !answer.verified && (mine !== undefined || choosing);

  const send = async (reason: RejectReason | null) => {
    // The red-pen scribble when rejecting; taking it back is quiet.
    if (reason) playSound("reject");
    onChoose(false);
    setError(await setRejection(answer.userId, reason));
  };

  return (
    <View
      ref={rowRef}
      collapsable={false}
      onLayout={onLayout}
      className={`gap-1.5 rounded-xl border-2 bg-white px-3 py-2 ${
        answer.rejectedBy.length > 0 ? "border-redpen" : "border-ink/20"
      }`}
    >
      <View className="flex-row items-center justify-between gap-2">
        <View className="flex-1">
          <Text className="font-sans-bold text-lg leading-6 text-ink">{answer.text}</Text>
          <Text numberOfLines={1} className="font-sans text-sm text-ink-soft">
            {isMine ? "Jawabanmu" : answer.name}
          </Text>
        </View>
        {answer.verified ? (
          <VerifiedBadge />
        ) : isMine ? null : (
          <RejectButton
            label={mine ? "Batal Tolak" : choosing ? "Batal" : "Tolak"}
            word={answer.text}
            rejected={mine !== undefined}
            expanded={showReasons}
            disabled={mine === undefined && noRejectionsLeft}
            onPress={() => {
              if (mine) void send(null);
              else onChoose(!choosing);
            }}
          />
        )}
      </View>

      {showReasons ? (
        <View onLayout={() => onReasonsShown(rowRef.current)} className="gap-1">
          <View className="flex-row flex-wrap gap-1.5">
            {REJECT_REASONS.map((r) => {
              const selected = mine?.reason === r.id;
              return (
                <Pressable
                  key={r.id}
                  // Rejecting plays the red-pen scribble instead.
                  sound={null}
                  onPress={() => {
                    if (!selected) void send(r.id);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Tolak ${answer.text}: ${r.label}`}
                  accessibilityState={{ selected }}
                  className={`rounded-full border-2 px-3 py-1.5 ${
                    selected ? "border-redpen bg-redpen" : "border-ink/30 bg-white active:bg-highlight-soft"
                  }`}
                >
                  <Text className={`font-sans-semibold text-sm ${selected ? "text-white" : "text-ink"}`}>
                    {buttonLabel(r.label)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {mine ? null : <Text className="font-sans text-xs text-ink-soft">Pilih alasan untuk menolak.</Text>}
        </View>
      ) : null}

      <RejectedBy answer={answer} />
      {error ? (
        <Text accessibilityRole="alert" className="font-sans-semibold text-sm text-redpen">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

type RejectButtonProps = {
  label: string;
  word: string;
  rejected: boolean;
  expanded: boolean;
  disabled: boolean;
  onPress: () => void;
};

function RejectButton({ label, word, rejected, expanded, disabled, onPress }: RejectButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={`${label} ${word}`}
      accessibilityState={{ disabled, expanded }}
      hitSlop={6}
      className={`rounded-xl border-2 bg-white px-3.5 py-2 ${
        disabled ? "border-ink/20" : rejected ? "border-ink active:bg-highlight-soft" : "border-redpen active:bg-highlight-soft"
      }`}
    >
      <Text
        className={`font-sans-semibold text-sm ${disabled ? "text-ink-faint" : rejected ? "text-ink" : "text-redpen"}`}
      >
        {label}
      </Text>
    </Pressable>
  );
}
