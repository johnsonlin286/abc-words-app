import { useEffect } from "react";
import { AppState } from "react-native";

import { useAuthStore } from "@/features/auth/auth-store";

import { connectGame, disconnectGame, resumeGame } from "./room-store";

/**
 * Keeps the game socket open while a signed-in player is in the app. The server reads the nickname
 * at the handshake, so a rename reconnects.
 */
export function useGameConnection() {
  const name = useAuthStore((s) => s.user?.displayName);

  useEffect(() => {
    if (!name) return;
    connectGame();
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void resumeGame();
    });
    return () => {
      subscription.remove();
      disconnectGame();
    };
  }, [name]);
}
