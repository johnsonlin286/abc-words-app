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
import type { GameState } from "@/shared/game";

import { AfkNotice, isAfk } from "./afk";
import { AlphabetStrip } from "./alphabet-strip";
import { AnsweringPhase } from "./answering-phase";
import { FinishedPlaceholder } from "./finished-placeholder";
import { PickingPhase } from "./picking-phase";
import { PingAlert } from "./ping-alert";
import { ResultPhase } from "./result-phase";
import { RevealPhase } from "./reveal-phase";
import { leaveMessage, RoomBar } from "./room-bar";
import { ScoreStrip } from "./score-strip";
import { useFocusGameCard } from "./use-focus-game-card";
import { VotingFooter } from "./voting-footer";
import { VotingPhase } from "./voting-phase";
import { WaitingForPlayers } from "./waiting-for-players";
import { WaitingRoom } from "./waiting-room";

/** While waiting for players the screen stays on the note at the top. */
function stayPut() {}

/** The new letter is crossed out only after its reveal, so the strip can't spoil it. */
function crossedOut({ phase, reveal, usedLetters }: GameState): string {
  const used = phase === "reveal" && reveal ? usedLetters.filter((letter) => letter !== reveal.letter) : usedLetters;
  return used.join("");
}

/** The room: code and actions on the paper, the current phase on one index card. */
export function GameScreen() {
  const room = useRoomStore((s) => s.room);
  const myId = useAuthStore((s) => s.user?.id);
  const [askLeave, setAskLeave] = useState(false);
  const phase = room?.state.phase;
  const playing = !!phase && phase !== "waiting" && phase !== "finished";
  // The "waiting for players" note sits at the top of the card, so it is brought into view as well.
  const waiting = !!room && room.state.waitingForPlayersMs !== null;
  const { scrollRef, onScrollLayout, onScroll, areaRef, onAreaLayout, areaMinHeight, showInArea, keepInView } =
    useFocusGameCard(!room || phase === "waiting" ? null : `${room.state.round}:${phase}:${waiting}`);

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
              ref={scrollRef}
              onLayout={onScrollLayout}
              onScroll={onScroll}
              scrollEventThrottle={100}
              contentContainerClassName="gap-5 px-6 pb-8 pt-3"
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {!room || !myId ? (
                <Text className="font-sans text-base text-ink-soft">Memuat room…</Text>
              ) : (
                <>
                  <RoomBar room={room} isHost={room.hostId === myId} />
                  <ConnectionNotice />
                  {playing ? <AlphabetStrip used={crossedOut(room.state)} /> : null}
                  {/* The game area: what a new phase scrolls to. */}
                  <View ref={areaRef} onLayout={onAreaLayout} className="gap-3" style={{ minHeight: areaMinHeight }}>
                    {playing ? <ScoreStrip room={room} /> : null}
                    <NoteCard className="gap-3 p-4">
                      {playing ? <WaitingForPlayers /> : null}
                      {playing && isAfk(room.state, myId) ? <AfkNotice /> : null}
                      {/* A paused game can be seen but not played. */}
                      <View
                        pointerEvents={room.state.paused ? "none" : "auto"}
                        className={room.state.paused ? "opacity-50" : ""}
                      >
                        {phase === "waiting" ? (
                          <WaitingRoom room={room} myId={myId} />
                        ) : phase === "picking" ? (
                          <PickingPhase key={room.state.round} room={room} />
                        ) : phase === "reveal" && room.state.reveal ? (
                          <RevealPhase
                            key={room.state.round}
                            room={room}
                            reveal={room.state.reveal}
                            onVoteShown={waiting ? stayPut : showInArea}
                          />
                        ) : phase === "answering" && room.state.reveal ? (
                          <AnsweringPhase
                            key={room.state.round}
                            room={room}
                            letter={room.state.reveal.letter}
                            onFormShown={waiting ? stayPut : showInArea}
                          />
                        ) : phase === "voting" && room.state.reveal ? (
                          <VotingPhase
                            key={room.state.round}
                            room={room}
                            letter={room.state.reveal.letter}
                            onReasonsShown={waiting ? stayPut : keepInView}
                          />
                        ) : phase === "result" && room.state.reveal ? (
                          <ResultPhase key={room.state.round} room={room} letter={room.state.reveal.letter} />
                        ) : (
                          <FinishedPlaceholder room={room} isHost={room.hostId === myId} />
                        )}
                      </View>
                    </NoteCard>
                  </View>
                </>
              )}
            </ScrollView>
            {room && myId && phase === "voting" ? (
              <VotingFooter key={room.state.round} room={room} myId={myId} />
            ) : null}
          </KeyboardAvoidingView>
          {/* Only the waiting room has calls; elsewhere it would hold a sound player for nothing. */}
          {room && myId && phase === "waiting" ? (
            <PingAlert isReady={room.state.phase !== "waiting" || room.state.ready.includes(myId)} />
          ) : null}
        </View>
      </SafeAreaView>
      <ConfirmDialog
        visible={askLeave}
        title="Keluar dari room?"
        message={leaveMessage(playing)}
        confirmLabel="Keluar Room"
        danger
        onConfirm={() => {
          setAskLeave(false);
          void leaveRoom();
        }}
        onCancel={() => setAskLeave(false)}
      />
    </Paper>
  );
}
