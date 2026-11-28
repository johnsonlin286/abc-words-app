import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ComponentRef } from "react";
import { Keyboard, Text, View } from "react-native";

import { PrimaryButton } from "@/components/primary-button";
import { TextField, type TextFieldHandle } from "@/components/text-field";
import { submitAnswer } from "@/features/room/room-store";
import { playSound } from "@/lib/sounds";
import { useTimeLeft } from "@/lib/use-time-left";
import { ANSWER_MAX, validateAnswer } from "@/shared/game";

/** The keyboard is asked for once the phase is on screen. */
const FOCUS_MS = 150;
/** Android first scrolls just far enough to show the field; bring the whole area up after that. */
const SETTLE_MS = 120;

type Props = {
  letter: string;
  /** A paused game takes no answers, so the keyboard goes away until it resumes. */
  paused: boolean;
  /** Called when the field should be on screen: at the start and when the keyboard opens. */
  onShow: (row: ComponentRef<typeof View> | null) => void;
};

/**
 * Type one answer and send it. The keyboard opens by itself: this phase is a race. Answers have to
 * be typed, so the field has no paste menu.
 */
export function AnswerForm({ letter, paused, onShow }: Props) {
  const input = useRef<TextFieldHandle>(null);
  const row = useRef<ComponentRef<typeof View>>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [alert, setAlert] = useState<string | null>(null);
  /** Local time until which the server refuses answers after too many rejected tries. */
  const [blockedUntil, setBlockedUntil] = useState<number | null>(null);
  const blockedMs = useTimeLeft(blockedUntil, 250) ?? 0;
  const blocked = blockedMs > 0;

  useEffect(() => {
    if (paused) {
      Keyboard.dismiss();
      return;
    }
    const timer = setTimeout(() => input.current?.focus(), FOCUS_MS);
    return () => clearTimeout(timer);
  }, [paused]);

  // When the phase ends the field goes away; take the keyboard with it, or it covers the next screen.
  // A layout effect, so the field is still there to blur: once it is gone, Keyboard.dismiss() alone
  // no longer knows which field had the keyboard, and the keyboard stays up.
  useLayoutEffect(() => {
    const field = input.current;
    return () => {
      field?.blur();
      Keyboard.dismiss();
    };
  }, []);

  // At the start, and again once the keyboard has opened and the screen got shorter.
  const show = useCallback(() => setTimeout(() => onShow(row.current), SETTLE_MS), [onShow]);
  useEffect(() => {
    let timer = show();
    const subscription = Keyboard.addListener("keyboardDidShow", () => {
      clearTimeout(timer);
      timer = show();
    });
    return () => {
      clearTimeout(timer);
      subscription.remove();
    };
  }, [show]);

  const submit = async () => {
    if (sending || blocked || !text.trim()) return;
    const invalid = validateAnswer(text, letter);
    if (invalid) return setAlert(invalid);

    setSending(true);
    const result = await submitAnswer(text);
    setSending(false);

    playSound(result.status === "accepted" ? "sent" : "refused");
    if (result.status === "accepted") return Keyboard.dismiss();
    // The pause gets its own line below; the alert still says what was wrong with this answer.
    if (result.retryAfterMs) setBlockedUntil(Date.now() + result.retryAfterMs);
    setAlert(result.message);
    if (result.status !== "error") setText("");
  };

  return (
    <View className="gap-2">
      <View ref={row} collapsable={false} className="flex-row items-center gap-3">
        <View className="flex-1">
          <TextField
            ref={input}
            label={`Jawaban berawalan huruf ${letter}`}
            hideLabel
            value={text}
            onChangeText={(value) => {
              setText(value);
              setAlert(null);
            }}
            placeholder={`Berawalan ${letter}…`}
            maxLength={ANSWER_MAX}
            editable={!paused}
            contextMenuHidden
            autoComplete="off"
            autoCorrect={false}
            spellCheck={false}
            returnKeyType="send"
            // Keeps the keyboard open, so a refused answer can be retyped at once.
            submitBehavior="submit"
            onSubmitEditing={() => void submit()}
          />
        </View>
        <PrimaryButton
          label={blocked ? `Tunggu ${Math.ceil(blockedMs / 1000)}` : "Kirim"}
          onPress={() => void submit()}
          sound={null}
          disabled={sending || blocked || !text.trim()}
        />
      </View>
      {blocked ? (
        <Text accessibilityLiveRegion="polite" className="font-sans-semibold text-sm text-redpen">
          Terlalu banyak jawaban ditolak. Tunggu {Math.ceil(blockedMs / 1000)} detik.
        </Text>
      ) : null}
      {alert ? (
        <Text accessibilityRole="alert" className="font-sans-semibold text-sm text-redpen">
          {alert}
        </Text>
      ) : null}
    </View>
  );
}
