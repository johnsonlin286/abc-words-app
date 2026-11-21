import * as SecureStore from "expo-secure-store";

import type { AuthSession } from "@/shared/contract";

// One entry holds user + tokens (well under SecureStore's 2 KB per value), encrypted with a key
// from the Android Keystore. Never AsyncStorage: that is plain text on the device.
const KEY = "abc.session.v1";

export async function loadSession(): Promise<AuthSession | null> {
  try {
    const raw = await SecureStore.getItemAsync(KEY);
    return raw ? (JSON.parse(raw) as AuthSession) : null;
  } catch {
    // Unreadable (e.g. the Keystore key was reset after a backup restore): start signed out.
    await clearSession();
    return null;
  }
}

export function saveSession(session: AuthSession): Promise<void> {
  return SecureStore.setItemAsync(KEY, JSON.stringify(session));
}

export async function clearSession(): Promise<void> {
  await SecureStore.deleteItemAsync(KEY).catch(() => {});
}
