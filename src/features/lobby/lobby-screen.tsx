import { Link } from "expo-router";
import { Settings, Store } from "lucide-react-native";
import { useRef, useState } from "react";
import { FlatList, KeyboardAvoidingView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { NoteCard } from "@/components/note-card";
import { Paper } from "@/components/paper";
import { useAuthStore } from "@/features/auth/auth-store";
import { KeyChip } from "@/features/keys/key-chip";
import { ConnectionNotice } from "@/features/room/connection-notice";
import { clearRequestError, useRoomStore } from "@/features/room/room-store";
import type { LobbyRoom } from "@/shared/contract";
import { colors } from "@/theme/tokens";

import { CreateRoomForm } from "./create-room-form";
import { JoinRoomForm } from "./join-room-form";
import { RoomRow } from "./room-row";
import { useFormAboveKeyboard } from "./use-form-above-keyboard";
import { useLiveRoomData, useRoomList } from "./use-rooms";
import { Pressable } from "@/components/pressable";

type Tab = "create" | "join";

/** Space above the first row of the list. */
const LIST_TOP = 8;

const TABS: { id: Tab; label: string }[] = [
  { id: "create", label: "Buat Room" },
  { id: "join", label: "Gabung Room" },
];

/** Signed in, not in a room: create one, join by code, or pick an open room (same layout as the web). */
export function LobbyScreen() {
  const name = useAuthStore((s) => s.user?.displayName);
  const roomNotice = useRoomStore((s) => s.notice);
  const rooms = useRoomList();
  useLiveRoomData();

  const [tab, setTab] = useState<Tab>("create");
  const [code, setCode] = useState("");
  const [codeLocked, setCodeLocked] = useState(false);
  const [selectionId, setSelectionId] = useState(0);
  const [pickedNotice, setPickedNotice] = useState<string | null>(null);
  const listRef = useRef<FlatList<LobbyRoom>>(null);
  const form = useFormAboveKeyboard(listRef, LIST_TOP);

  const switchTab = (next: Tab) => {
    setTab(next);
    clearRequestError();
  };

  const showForm = () => listRef.current?.scrollToOffset({ offset: 0, animated: true });

  const selectRoom = (room: LobbyRoom) => {
    switchTab("join");
    setCode(room.id);
    setSelectionId((n) => n + 1);
    // Private: the code stays in its (editable) field and the password is asked. Public: one tap left.
    setCodeLocked(!room.hasPassword);
    setPickedNotice(room.hasPassword ? `Kode ${room.id} sudah diisi. Masukkan kata sandinya.` : null);
    showForm();
  };

  const count = rooms.data?.length;

  const header = (
    <View className="gap-6 pb-1">
      <View className="flex-row items-center justify-between">
        <KeyChip />
        <View className="flex-row gap-2">
          <Link href="/shop" asChild>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Toko"
              hitSlop={4}
              className="h-11 w-11 items-center justify-center rounded-xl border-2 border-ink bg-white active:bg-highlight-soft"
            >
              <Store size={22} color={colors.ink} strokeWidth={2.5} />
            </Pressable>
          </Link>
          <Link href="/settings" asChild>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Pengaturan"
              hitSlop={4}
              className="h-11 w-11 items-center justify-center rounded-xl border-2 border-ink bg-white active:bg-highlight-soft"
            >
              <Settings size={22} color={colors.ink} strokeWidth={2.5} />
            </Pressable>
          </Link>
        </View>
      </View>

      <NoteCard className="gap-4 p-4" onLayout={form.onCardLayout}>
        <Text accessibilityRole="header" numberOfLines={1} className="font-sans-bold text-2xl text-ink">
          Halo, {name}
        </Text>

        <ConnectionNotice />
        {roomNotice ? <Notice text={roomNotice} /> : null}

        <View className="flex-row gap-2" accessibilityRole="tablist">
          {TABS.map((t) => {
            const selected = tab === t.id;
            return (
              <Pressable
                key={t.id}
                onPress={() => switchTab(t.id)}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                className={`flex-1 items-center rounded-xl border-2 px-3 py-2 ${
                  selected ? "border-ink bg-ink" : "border-ink-faint bg-white"
                }`}
              >
                <Text className={`font-sans-semibold text-sm ${selected ? "text-paper" : "text-ink-soft"}`}>
                  {t.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {tab === "create" ? (
          <CreateRoomForm />
        ) : (
          <>
            {pickedNotice ? <Notice text={pickedNotice} /> : null}
            <JoinRoomForm
              code={code}
              onCodeChange={(value) => {
                setCode(value);
                setPickedNotice(null);
                clearRequestError();
              }}
              codeLocked={codeLocked}
              onUnlockCode={() => {
                setCodeLocked(false);
                setCode("");
                clearRequestError();
              }}
              selectionId={selectionId}
            />
          </>
        )}
      </NoteCard>

      <View className="flex-row items-baseline justify-between gap-4">
        <Text accessibilityRole="header" className="font-sans-bold text-lg text-ink">
          Room yang buka{count !== undefined ? <Text className="text-ink-faint"> ({count})</Text> : null}
        </Text>
        <Pressable
          onPress={() => void rooms.refetch()}
          disabled={rooms.isFetching}
          accessibilityRole="button"
          hitSlop={10}
        >
          <Text className="font-sans-semibold text-sm text-ink underline">
            {rooms.isFetching ? "Memuat…" : "Muat Ulang"}
          </Text>
        </Pressable>
      </View>

      {rooms.isPending ? <Text className="font-sans text-base text-ink-soft">Memuat daftar room…</Text> : null}
      {rooms.isError ? (
        <Text accessibilityRole="alert" className="font-sans-semibold text-sm text-redpen">
          {rooms.error.message}
        </Text>
      ) : null}
    </View>
  );

  return (
    <Paper>
      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView className="flex-1" behavior="padding">
          <FlatList
            ref={listRef}
            onLayout={form.onListLayout}
            data={rooms.data}
            keyExtractor={(room) => room.id}
            renderItem={({ item }) => <RoomRow room={item} onSelect={selectRoom} />}
            ListHeaderComponent={header}
            ListEmptyComponent={
              count === 0 ? (
                <EmptyRooms
                  onCreate={() => {
                    switchTab("create");
                    showForm();
                  }}
                />
              ) : undefined
            }
            contentContainerClassName="gap-2.5 px-6 pb-8"
            contentContainerStyle={{ paddingTop: LIST_TOP }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Paper>
  );
}

/** A short message pinned to the card (room closed, kicked, code filled in). */
function Notice({ text }: { text: string }) {
  return (
    <View
      accessibilityLiveRegion="polite"
      className="rounded-xl border-2 border-dashed border-ink-soft bg-highlight-soft px-3.5 py-2.5"
    >
      <Text className="font-sans text-sm text-ink">{text}</Text>
    </View>
  );
}

function EmptyRooms({ onCreate }: { onCreate: () => void }) {
  return (
    <View className="items-start gap-3 rounded-xl border-2 border-dashed border-ink-soft px-4 py-3.5">
      <Text className="font-sans-semibold text-base text-ink">Belum ada room. Buat yang pertama!</Text>
      <Pressable
        onPress={onCreate}
        accessibilityRole="button"
        className="rounded-xl border-2 border-ink bg-white px-4 py-2 active:bg-highlight-soft"
      >
        <Text className="font-sans-semibold text-sm text-ink">Buat Room</Text>
      </Pressable>
    </View>
  );
}
