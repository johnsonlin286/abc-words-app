import { Image } from "expo-image";
import { useState } from "react";
import { KeyboardAvoidingView, ScrollView, Text, View } from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { NoteCard } from "@/components/note-card";
import { Paper } from "@/components/paper";
import { PrimaryButton } from "@/components/primary-button";
import { TextField } from "@/components/text-field";
import { LIMITS, USER_NAME_HINT, validateUserName } from "@/shared/game";

const logo = require("@/assets/images/logo.png");

type Props = {
  onSubmit: (name: string) => void;
  onSignOut: () => void;
  loading?: boolean;
  /** Server refusal (taken, inappropriate, network) in red pen under the card's field. */
  error?: string | null;
};

/**
 * First stop after the first sign-in: the nickname this account plays with. Same card, words and
 * live validation as the web "Mulai main" form (components/sign-in-form.tsx), except the
 * account-specific lines. The server checks the rules again and makes sure
 * nobody else owns the name.
 */
export function ChooseNameScreen({ onSubmit, onSignOut, loading = false, error = null }: Props) {
  const [name, setName] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const trimmed = name.trim();
  const validationError = validateUserName(trimmed);
  // Like the web: complain while typing; an empty field only after pressing Simpan.
  const showValidation = trimmed.length > 0 || submitted ? validationError : null;

  function submit() {
    setSubmitted(true);
    if (!validationError) onSubmit(trimmed);
  }

  return (
    <Paper>
      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView className="flex-1" behavior="padding">
          <ScrollView
            contentContainerClassName="flex-grow justify-center gap-8 px-8 py-6"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Animated.View entering={FadeInUp.duration(500)}>
              <Image
                source={logo}
                accessibilityLabel="ABC Lima Dasar"
                style={{ width: "100%", aspectRatio: 800 / 164 }}
                contentFit="contain"
              />
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(150).duration(500)}>
              <NoteCard className="gap-4 p-5">
                <View className="gap-1">
                  <Text className="font-sans-bold text-2xl text-ink">Mulai main</Text>
                  <Text className="font-sans text-base leading-6 text-ink-soft">
                    Masukkan nama panggilanmu.
                  </Text>
                </View>

                <TextField
                  label="Nama panggilan"
                  hint={`${USER_NAME_HINT}.`}
                  error={showValidation ?? error}
                  value={name}
                  onChangeText={setName}
                  placeholder="budi_01"
                  maxLength={LIMITS.userName}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="nickname"
                  returnKeyType="done"
                  onSubmitEditing={submit}
                  editable={!loading}
                />
                {/* "Masuk" like the web: this step is the way into the game. Renaming later says "Simpan". */}
                <PrimaryButton label={loading ? "Masuk…" : "Masuk"} onPress={submit} loading={loading} />

                <Text className="font-sans-regular text-sm leading-5 text-ink-faint">
                  Nama panggilan bisa diganti nanti.{" "}
                  <Text onPress={onSignOut} accessibilityRole="link" className="font-sans-semibold text-ink underline">
                    Bukan akunmu? Keluar
                  </Text>
                </Text>
              </NoteCard>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Paper>
  );
}
