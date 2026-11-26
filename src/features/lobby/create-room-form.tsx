import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { PrimaryButton } from "@/components/primary-button";
import { TextField } from "@/components/text-field";
import { KeyCost } from "@/features/keys/key-cost";
import { OutOfKeysNote } from "@/features/keys/out-of-keys-note";
import { useRoomKeys } from "@/features/keys/use-room-keys";
import { createRoom, useRoomStore } from "@/features/room/room-store";
import { LIMITS } from "@/shared/game";

const VISIBILITY = [
  { isPrivate: false, label: "Publik", hint: "Muncul di daftar, siapa saja bisa gabung" },
  { isPrivate: true, label: "Privat", hint: "Hanya yang tahu kata sandinya" },
];

export function CreateRoomForm() {
  const online = useRoomStore((s) => s.connection === "online");
  const pending = useRoomStore((s) => s.pending);
  const requestError = useRoomStore((s) => s.requestError);
  const { keys, msUntilNext } = useRoomKeys();
  const queryClient = useQueryClient();
  const outOfKeys = keys?.count === 0;

  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const submit = () => {
    if (outOfKeys) return;
    if (isPrivate && password.length < LIMITS.passwordMin) {
      return setLocalError(`Room privat butuh kata sandi minimal ${LIMITS.passwordMin} karakter.`);
    }
    setLocalError(null);
    void createRoom({ password: isPrivate ? password : undefined }).then((created) => {
      // The server may know better, e.g. the keys were used on another phone.
      if (!created) void queryClient.invalidateQueries({ queryKey: ["room-keys"] });
    });
  };

  // The note below already says it when the keys ran out.
  const error = localError ?? (outOfKeys ? null : requestError);

  return (
    <View className="gap-4">
      <View className="gap-2" accessibilityRole="radiogroup">
        <Text className="font-sans-semibold text-sm text-ink">Siapa yang boleh gabung?</Text>
        {VISIBILITY.map((option) => {
          const selected = isPrivate === option.isPrivate;
          return (
            <Pressable
              key={option.label}
              onPress={() => {
                setIsPrivate(option.isPrivate);
                setLocalError(null);
              }}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              className={`rounded-xl border-2 px-3.5 py-2 ${
                selected ? "border-ink bg-highlight-soft" : "border-ink-faint bg-white"
              }`}
            >
              <Text className="font-sans-bold text-base text-ink">{option.label}</Text>
              <Text className="font-sans text-sm text-ink-soft">{option.hint}</Text>
            </Pressable>
          );
        })}
      </View>

      {isPrivate ? (
        <TextField
          label="Kata sandi room"
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            setLocalError(null);
          }}
          secureTextEntry
          maxLength={LIMITS.passwordMax}
          placeholder={`Minimal ${LIMITS.passwordMin} karakter`}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="done"
          onSubmitEditing={submit}
        />
      ) : null}

      {error ? (
        <Text accessibilityRole="alert" className="font-sans-semibold text-sm text-redpen">
          {error}
        </Text>
      ) : null}

      <View className="gap-3">
        <PrimaryButton
          label={pending ? "Membuat Room…" : "Buat Room"}
          accessibilityLabel="Buat Room, permainannya memakai 1 kunci"
          onPress={submit}
          loading={pending}
          disabled={!online || outOfKeys}
          accessory={<KeyCost />}
        />
        {outOfKeys ? (
          <OutOfKeysNote msUntilNext={msUntilNext} />
        ) : (
          <Text className="text-center font-sans text-sm text-ink-soft">
            Kunci baru terpakai saat kamu menekan Mulai.
          </Text>
        )}
      </View>
    </View>
  );
}
