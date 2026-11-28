import { useEffect, useRef } from "react";

import { playSound, type SoundName } from "@/lib/sounds";
import type { GameRoomView } from "@/features/room/room-store";
import { finalRanking } from "@/shared/game";

/** The sound for the phase the room just moved to, or null for none. */
function phaseSound(room: GameRoomView, myId: string): SoundName | null {
  const { state } = room;
  switch (state.phase) {
    case "reveal":
      return "stamp";
    case "result":
      return state.answers.find((a) => a.userId === myId)?.accepted ? "passed" : null;
    case "finished": {
      const me = finalRanking(room.members, state.departed, state.scores, state.speed).find((p) => p.userId === myId);
      // A 0-point player can still have a rank by answer time; for the jingle that counts as no
      // ranking (owner, 2026-11-28).
      return me?.rank != null && me.score > 0 ? "jingleRanked" : "jingleUnranked";
    }
    default:
      // No sound for the other phases (owner, 2026-11-28: the phase sound was too much).
      return null;
  }
}

/**
 * A sound for some moves of the game: the letter stamped on the reveal (again after "Ganti huruf"),
 * your answer passing, and the final scores. Nothing plays for the screen the player opens the room on.
 */
export function useGameSounds(room: GameRoomView | null, myId: string | undefined): void {
  const key = room ? `${room.state.round}:${room.state.phase}:${room.state.reveal?.letter ?? ""}` : null;
  const last = useRef<string | null>(null);

  useEffect(() => {
    if (!room || !myId || key === null) return;
    const previous = last.current;
    last.current = key;
    if (previous === null || previous === key) return;
    const sound = phaseSound(room, myId);
    if (sound) playSound(sound);
    // Only a new key plays; the room itself changes on every vote.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, myId]);
}
