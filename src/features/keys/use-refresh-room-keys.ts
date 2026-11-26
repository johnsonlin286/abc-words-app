import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { useRoomStore } from "@/features/room/room-store";

/**
 * The server spends a key when a game starts and may give it back when one is cancelled: refetch
 * when a game begins or ends, and when the player enters or leaves a room. Not on every phase
 * change, which would run into the API's rate limit.
 */
export function useRefreshRoomKeys() {
  const queryClient = useQueryClient();
  const roomId = useRoomStore((s) => s.roomId);
  const playing = useRoomStore((s) => s.room !== null && s.room.state.phase !== "waiting");

  useEffect(() => {
    void queryClient.invalidateQueries({ queryKey: ["room-keys"] });
  }, [roomId, playing, queryClient]);
}
