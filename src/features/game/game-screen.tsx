import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { BackHandler, KeyboardAvoidingView, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { NoteCard } from "@/components/note-card";
import { Paper } from "@/components/paper";
import { useAuthStore } from "@/features/auth/auth-store";
import { ConnectionNotice } from "@/features/room/connection-notice";
import { leaveRoom, useRoomStore } from "@/features/room/room-store";

import { GameInProgress } from "./game-in-progress";
import { PingAlert } from "./ping-alert";
import { RoomBar } from "./room-bar";
import { WaitingRoom } from "./waiting-room";

/** The room: code and actions on the paper, the current phase on one index card. */
export function GameScreen() {
  const room = useRoomStore((s) => s.room);
  const myId = useAuthStore((s) => s.user?.id);
  const [askLeave, setAskLeave] = useState(false);

  // The Android back button would leave the app; ask about leaving the room instead.
  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
        setAskLeave(true);
        return true;
      });
      return () => subscription.remove();
    }, []),
  );

  return (
    <Paper>
      <SafeAreaView className="flex-1">
        {/* The ping note is positioned inside this view, so it stays below the status bar. */}
        <View className="flex-1">
          <KeyboardAvoidingView className="flex-1" behavior="padding">
            <ScrollView
              contentContainerClassName="gap-5 px-6 pb-8 pt-3"
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {!room || !myId ? (
                <Text className="font-sans text-base text-ink-soft">Memuat room…</Text>
              ) : (
                <>
                  <RoomBar room={room} />
                  <ConnectionNotice />
                  <NoteCard className="p-4">
                    {room.state.phase === "waiting" ? (
                      <WaitingRoom room={room} myId={myId} />
                    ) : (
                      <GameInProgress room={room} isHost={room.hostId === myId} />
                    )}
                  </NoteCard>
                </>
              )}
            </ScrollView>
          </KeyboardAvoidingView>
          {room && myId ? (
            <PingAlert isReady={room.state.phase !== "waiting" || room.state.ready.includes(myId)} />
          ) : null}
        </View>
      </SafeAreaView>
      <ConfirmDialog
        visible={askLeave}
        title="Keluar dari room?"
        message="Kamu bisa bergabung lagi dengan kode room selama permainannya belum dimulai."
        confirmLabel="Keluar Room"
        onConfirm={() => {
          setAskLeave(false);
          void leaveRoom();
        }}
        onCancel={() => setAskLeave(false)}
      />
    </Paper>
  );
}
