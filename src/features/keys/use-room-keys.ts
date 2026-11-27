import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { getAccessToken, useAuthStore } from "@/features/auth/auth-store";
import { apiRequest } from "@/lib/api";
import { useTimeLeft } from "@/lib/use-time-left";
import type { RoomKeyStatus } from "@/shared/contract";

type RoomKeys = RoomKeyStatus & {
  /** Device clock minus server clock when the answer arrived; countdowns use server time. */
  skewMs: number;
};

/** The signed-in account's room keys, refetched when the next key is due and when the app returns. */
export function useRoomKeys() {
  const userId = useAuthStore((s) => s.user?.id);
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["room-keys", userId],
    enabled: Boolean(userId),
    staleTime: 60_000,
    queryFn: async (): Promise<RoomKeys> => {
      const status = await apiRequest<RoomKeyStatus>("/api/auth/me/keys", { token: await getAccessToken() });
      return { ...status, skewMs: Date.now() - status.serverNow };
    },
  });

  const nextAt = query.data?.nextAt ?? null;
  const left = useTimeLeft(nextAt === null || !query.data ? null : nextAt + query.data.skewMs);

  useEffect(() => {
    if (left === 0) void queryClient.invalidateQueries({ queryKey: ["room-keys", userId] });
  }, [left, queryClient, userId]);

  return { keys: query.data ?? null, msUntilNext: left, isError: query.isError };
}

/** "12:34", or "1:02:03" from an hour up. */
export function formatCountdown(ms: number): string {
  const total = Math.ceil(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = h > 0 ? String(m).padStart(2, "0") : String(m);
  return `${h > 0 ? `${h}:` : ""}${mm}:${String(s).padStart(2, "0")}`;
}
