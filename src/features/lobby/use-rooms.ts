import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { apiRequest } from "@/lib/api";
import { getGameSocket } from "@/lib/game-socket";
import type { LobbyRoom } from "@/shared/contract";
import { LIMITS } from "@/shared/game";

/** How often to look again while a listed room waits for its host's next key. */
const KEY_WAIT_REFETCH_MS = 60_000;

/** Rooms listed in the lobby (public and password-protected): startable ones first, newest first. */
export function useRoomList() {
  return useQuery({
    queryKey: ["rooms"],
    queryFn: () => apiRequest<LobbyRoom[]>("/api/abc-words/rooms"),
    retry: false,
    // A refilled key changes nothing on the server's rooms, so no "rooms:changed" announces it.
    refetchInterval: ({ state }) => (state.data?.some((room) => room.hostNeedsKey) ? KEY_WAIT_REFETCH_MS : false),
  });
}

/** Looks a room up as soon as the code is complete, to know whether it needs a password. */
export function useRoomPreview(code: string) {
  return useQuery({
    queryKey: ["room-peek", code],
    queryFn: () => apiRequest<LobbyRoom>(`/api/abc-words/rooms/${encodeURIComponent(code)}`),
    enabled: code.length === LIMITS.roomCode,
    retry: false,
    staleTime: 0,
  });
}

/**
 * Keeps room data fresh: the server pushes "rooms:changed" whenever a room is created or closed,
 * players join or leave, or a game starts or ends.
 */
export function useLiveRoomData() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const socket = getGameSocket();
    const refresh = () => {
      void queryClient.invalidateQueries({ queryKey: ["rooms"] });
      void queryClient.invalidateQueries({ queryKey: ["room-peek"] });
    };
    socket.on("rooms:changed", refresh);
    socket.on("connect", refresh); // catch up on anything missed while disconnected
    return () => {
      socket.off("rooms:changed", refresh);
      socket.off("connect", refresh);
    };
  }, [queryClient]);
}
