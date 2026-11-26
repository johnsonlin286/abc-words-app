import { useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";

import { PrimaryButton } from "@/components/primary-button";
import { TextField, type TextFieldHandle } from "@/components/text-field";
import { joinRoom, useRoomStore } from "@/features/room/room-store";
import { LIMITS } from "@/shared/game";

import { getRoomStatus, RoomStatusLabel, VisibilityBadge } from "./room-badges";
import { useRoomPreview } from "./use-rooms";

type Props = {
  code: string;
  onCodeChange: (value: string) => void;
  /** A public room was picked from the list: no code field, only the room card. */
  codeLocked: boolean;
  /** Offers a way to type another code; used when `codeLocked`. */
  onUnlockCode: () => void;
  /** Changes every time a room is picked from the list, to move focus. */
  selectionId: number;
};

export function JoinRoomForm({ code, onCodeChange, codeLocked, onUnlockCode, selectionId }: Props) {
  const online = useRoomStore((s) => s.connection === "online");
  const pending = useRoomStore((s) => s.pending);
  const requestError = useRoomStore((s) => s.requestError);

  // The password belongs to one room: it is dropped as soon as the code changes.
  const [typed, setTyped] = useState({ code, password: "" });
  const password = typed.code === code ? typed.password : "";
  const [localError, setLocalError] = useState<string | null>(null);
  const passwordRef = useRef<TextFieldHandle>(null);

  const codeComplete = code.length === LIMITS.roomCode;
  const preview = useRoomPreview(code);
  const room = preview.data;
  const joinable = room ? getRoomStatus(room).joinable : false;
  const needsPassword = room?.hasPassword ?? false;

  // After picking a private room from the list, jump to the password field as soon as it appears.
  useEffect(() => {
    if (selectionId > 0 && needsPassword) passwordRef.current?.focus();
  }, [selectionId, needsPassword]);

  const submit = async () => {
    if (!room || !joinable || pending || !online) return;
    if (needsPassword && !password) return setLocalError("Kata sandi wajib diisi.");
    setLocalError(null);
    const joined = await joinRoom({ roomId: room.id, password: needsPassword ? password : undefined });
    if (!joined) void preview.refetch(); // the member count may have changed
  };

  const error = localError ?? requestError;

  return (
    <View className="gap-4">
      {!codeLocked ? (
        <TextField
          label="Kode room"
          variant="code"
          value={code}
          onChangeText={(text) => {
            setLocalError(null);
            onCodeChange(text.replace(/[^a-z0-9]/gi, "").toUpperCase().slice(0, LIMITS.roomCode));
          }}
          placeholder="ABC123"
          autoCapitalize="characters"
          autoCorrect={false}
          autoComplete="off"
          returnKeyType="done"
          onSubmitEditing={submit}
        />
      ) : null}

      {codeComplete ? (
        <View className="gap-2 rounded-xl border-2 border-dashed border-ink-faint bg-paper px-3.5 py-2.5">
          {room ? (
            <View className="flex-row items-center justify-between gap-3">
              <View className="flex-1">
                {codeLocked ? (
                  <Text className="font-sans-bold text-xl text-ink" style={{ letterSpacing: 3 }}>
                    {room.id}
                  </Text>
                ) : null}
                <Text numberOfLines={1} className="font-sans text-base text-ink">
                  Host: <Text className="font-sans-bold">{room.hostName ?? "—"}</Text>
                </Text>
                <Text className="font-sans text-sm text-ink-soft">
                  {room.memberCount}/{room.maxMembers} pemain
                </Text>
              </View>
              <View className="items-end gap-1.5">
                <VisibilityBadge isPrivate={room.hasPassword} />
                <RoomStatusLabel room={room} />
              </View>
            </View>
          ) : preview.isError ? (
            <Text accessibilityRole="alert" className="font-sans-semibold text-sm text-redpen">
              {preview.error.message}
            </Text>
          ) : (
            <Text className="font-sans text-base text-ink-soft">Mencari room…</Text>
          )}
          {codeLocked ? (
            <Pressable onPress={onUnlockCode} accessibilityRole="button" hitSlop={8} className="self-start">
              <Text className="font-sans-semibold text-sm text-ink underline">Pakai Kode Lain</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {needsPassword && joinable ? (
        <TextField
          ref={passwordRef}
          label="Kata sandi room"
          value={password}
          onChangeText={(text) => {
            setLocalError(null);
            setTyped({ code, password: text });
          }}
          secureTextEntry
          maxLength={LIMITS.passwordMax}
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

      <PrimaryButton
        label={pending ? "Bergabung…" : "Gabung Room"}
        onPress={submit}
        loading={pending}
        disabled={!joinable || !online}
      />
    </View>
  );
}
