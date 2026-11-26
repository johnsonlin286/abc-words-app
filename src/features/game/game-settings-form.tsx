import Slider from "@react-native-community/slider";
import { Minus, Plus, type LucideIcon } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { TextField } from "@/components/text-field";
import { updateSettings } from "@/features/room/room-store";
import {
  ANSWER_SECONDS_OPTIONS,
  CATEGORIES,
  categoryLabel,
  CUSTOM_CATEGORY_MAX,
  MAX_ROUNDS,
  type GameSettings,
} from "@/shared/game";
import { colors } from "@/theme/tokens";

/** How long after the last keystroke the custom category is saved. */
const TYPING_PAUSE_MS = 600;

/** The host's rules: category, number of rounds and answering time, saved on every change. */
export function GameSettingsForm({ settings }: { settings: GameSettings }) {
  const [error, setError] = useState<string | null>(null);

  const save = async (patch: Partial<GameSettings>) => {
    setError(await updateSettings(patch));
  };

  return (
    <View className="gap-4">
      <Text accessibilityRole="header" className="font-sans-bold text-xl text-ink">
        Aturan main
      </Text>

      <View className="gap-2" accessibilityRole="radiogroup">
        <Text className="font-sans-semibold text-sm text-ink">Kategori</Text>
        <View className="flex-row flex-wrap gap-2">
          {CATEGORIES.map((category) => (
            <Choice
              key={category.id}
              label={category.label}
              selected={settings.category === category.id}
              onPress={() => void save({ category: category.id })}
            />
          ))}
        </View>
        {settings.category === "custom" ? (
          <CustomCategoryField
            value={settings.customCategory}
            onSave={(customCategory) => void save({ customCategory })}
          />
        ) : null}
      </View>

      <View className="flex-row items-center justify-between gap-3">
        <Text className="font-sans-semibold text-sm text-ink">Jumlah ronde</Text>
        <View className="flex-row items-center gap-3">
          <Stepper
            icon={Minus}
            label="Kurangi ronde"
            disabled={settings.maxRounds <= 1}
            onPress={() => void save({ maxRounds: settings.maxRounds - 1 })}
          />
          <Text accessibilityLiveRegion="polite" className="min-w-[32px] text-center font-sans-bold text-2xl text-ink">
            {settings.maxRounds}
          </Text>
          <Stepper
            icon={Plus}
            label="Tambah ronde"
            disabled={settings.maxRounds >= MAX_ROUNDS}
            onPress={() => void save({ maxRounds: settings.maxRounds + 1 })}
          />
        </View>
      </View>

      <AnswerTime value={settings.answerSeconds} onChange={(answerSeconds) => void save({ answerSeconds })} />

      {error ? (
        <Text accessibilityRole="alert" className="font-sans-semibold text-sm text-redpen">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

/**
 * Answering time as a slider over the five fixed steps (web `AnswerTime`). The number follows the
 * thumb while it is dragged and the value is saved once, when the thumb is released.
 */
function AnswerTime({ value, onChange }: { value: number; onChange: (seconds: number) => void }) {
  const options = ANSWER_SECONDS_OPTIONS;
  const index = Math.max(options.indexOf(value as (typeof options)[number]), 0);
  const [dragged, setDragged] = useState<number | null>(null);
  const shown = options[dragged ?? index]!;

  return (
    <View className="gap-1">
      <View className="flex-row items-baseline justify-between gap-3">
        <Text className="font-sans-semibold text-sm text-ink">Waktu menjawab</Text>
        <Text className="font-sans-bold text-lg text-ink">{shown} detik</Text>
      </View>
      <Slider
        value={index}
        minimumValue={0}
        maximumValue={options.length - 1}
        step={1}
        onValueChange={(next) => setDragged(Math.round(next))}
        onSlidingComplete={(next) => {
          setDragged(null);
          const seconds = options[Math.round(next)]!;
          if (seconds !== value) onChange(seconds);
        }}
        minimumTrackTintColor={colors.ink}
        maximumTrackTintColor={colors.inkFaint}
        thumbTintColor={colors.ink}
        accessibilityLabel={`Waktu menjawab, ${shown} detik`}
        style={styles.slider}
      />
      {/* The steps under the track, spaced like the thumb's stops. */}
      <View className="flex-row justify-between" style={styles.ticks} importantForAccessibility="no-hide-descendants">
        {options.map((seconds) => (
          <Text
            key={seconds}
            className={`text-center font-sans-semibold text-xs ${seconds === shown ? "text-ink" : "text-ink-faint"}`}
            style={styles.tick}
          >
            {seconds}
          </Text>
        ))}
      </View>
    </View>
  );
}

/** The rules for players who can't change them: one labelled line each, so no number stands alone. */
export function RulesSummary({ settings }: { settings: GameSettings }) {
  return (
    <View className="gap-1">
      <Text accessibilityRole="header" className="font-sans-bold text-xl text-ink">
        Aturan main
      </Text>
      <View>
        <Rule label="Kategori" value={categoryLabel(settings) || "Belum ditulis"} />
        <Rule label="Jumlah ronde" value={`${settings.maxRounds} ronde`} />
        <Rule label="Waktu menjawab" value={`${settings.answerSeconds} detik`} last />
      </View>
      <Text className="font-sans text-sm text-ink-faint">Diatur oleh host.</Text>
    </View>
  );
}

function Rule({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return (
    <View
      accessible
      className={`flex-row items-center justify-between gap-4 py-2.5 ${last ? "" : "border-b border-paper-line"}`}
    >
      <Text className="font-sans text-base text-ink-soft">{label}</Text>
      <Text className="shrink text-right font-sans-bold text-base text-ink">{value}</Text>
    </View>
  );
}

function Choice({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      hitSlop={3}
      className={`rounded-full border-2 px-3.5 py-1.5 ${selected ? "border-ink bg-highlight" : "border-ink-faint bg-white"}`}
    >
      <Text className={`font-sans-semibold text-sm ${selected ? "text-ink" : "text-ink-soft"}`}>{label}</Text>
    </Pressable>
  );
}

type StepperProps = { icon: LucideIcon; label: string; onPress: () => void; disabled: boolean };

function Stepper({ icon: Icon, label, onPress, disabled }: StepperProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      hitSlop={6}
      className={`h-10 w-10 items-center justify-center rounded-full border-2 bg-white ${
        disabled ? "border-ink-faint" : "border-ink active:bg-highlight-soft"
      }`}
    >
      <Icon size={18} color={disabled ? colors.inkFaint : colors.ink} strokeWidth={3} />
    </Pressable>
  );
}

/**
 * Saved when the typing pauses and when the field loses focus: on Android, closing the keyboard
 * with the back button doesn't blur the field.
 */
function CustomCategoryField({ value, onSave }: { value: string; onSave: (value: string) => void }) {
  const [draft, setDraft] = useState(value);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saved = useRef(value);

  const cancel = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };

  const commit = (text: string) => {
    cancel();
    if (text === saved.current) return;
    saved.current = text;
    onSave(text);
  };

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  return (
    <TextField
      label="Nama kategori"
      value={draft}
      onChangeText={(text) => {
        setDraft(text);
        cancel();
        timer.current = setTimeout(() => commit(text), TYPING_PAUSE_MS);
      }}
      onBlur={() => commit(draft)}
      maxLength={CUSTOM_CATEGORY_MAX}
      placeholder="Mis. nama jajanan"
      returnKeyType="done"
    />
  );
}

const styles = StyleSheet.create({
  slider: { width: "100%", height: 40 },
  // Android insets the track by the thumb's radius on both ends; the labels follow it.
  ticks: { paddingHorizontal: 4 },
  tick: { width: 24 },
});
