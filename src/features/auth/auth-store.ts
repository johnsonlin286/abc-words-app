import { create } from "zustand";

import { ApiError, apiRequest } from "@/lib/api";
import type { AuthSession, AuthUser, DisplayNameInput } from "@/shared/contract";

import { clearSession, loadSession, saveSession } from "./session-storage";

/** Refresh this long before the access token expires, so a request never races the expiry. */
const REFRESH_MARGIN_MS = 60_000;

type AuthState = {
  status: "loading" | "signedOut" | "signedIn";
  user: AuthUser | null;
};

export const useAuthStore = create<AuthState>()(() => ({ status: "loading", user: null }));

// Tokens stay outside React state: nothing renders them, and keeping them here avoids re-renders
// every 15 minutes when the access token rotates.
let session: AuthSession | null = null;
let refreshing: Promise<AuthSession> | null = null;

function setSignedIn(next: AuthSession) {
  session = next;
  useAuthStore.setState({ status: "signedIn", user: next.user });
}

async function signOutLocally() {
  session = null;
  refreshing = null;
  await clearSession();
  useAuthStore.setState({ status: "signedOut", user: null });
}

/** Read the saved session at launch (the splash screen stays up until this settles). */
export async function restoreSession(): Promise<void> {
  const saved = await loadSession();
  if (!saved || saved.tokens.refreshTokenExpiresAt <= Date.now()) {
    await signOutLocally();
    return;
  }
  setSignedIn(saved);
}

/** Exchange a Google ID token for our own session. */
export async function signInWithIdToken(idToken: string): Promise<void> {
  const next = await apiRequest<AuthSession>("/api/auth/google", { body: { idToken } });
  await saveSession(next);
  setSignedIn(next);
}

/**
 * A valid access token for REST calls and the socket handshake, refreshed when close to expiry.
 * Single-flight: the server treats a refresh token used twice as stolen and ends the session, so
 * concurrent callers share one refresh. Offline keeps the session; only a rejected refresh signs out.
 */
export async function getAccessToken(): Promise<string> {
  if (!session) throw new ApiError("UNAUTHORIZED", "Belum masuk.", 401);
  if (session.tokens.accessTokenExpiresAt - REFRESH_MARGIN_MS > Date.now()) return session.tokens.accessToken;

  refreshing ??= apiRequest<AuthSession>("/api/auth/refresh", { body: { refreshToken: session.tokens.refreshToken } })
    .then(async (next) => {
      await saveSession(next);
      setSignedIn(next);
      return next;
    })
    .catch(async (error: unknown) => {
      if (error instanceof ApiError && error.status === 401) await signOutLocally();
      throw error;
    })
    .finally(() => {
      refreshing = null;
    });
  return (await refreshing).tokens.accessToken;
}

/** Choose or change the player name owned by this account (unique, checked by the server). */
export async function setDisplayName(name: string): Promise<void> {
  const body: DisplayNameInput = { name };
  const user = await apiRequest<AuthUser>("/api/auth/me/name", { method: "PUT", body, token: await getAccessToken() });
  if (!session) return;
  const next = { ...session, user };
  await saveSession(next);
  setSignedIn(next);
}

/** Sign out on this device: revoke the refresh token on the server (best effort), then forget it. */
export async function signOut(): Promise<void> {
  const refreshToken = session?.tokens.refreshToken;
  await signOutLocally();
  if (refreshToken) await apiRequest("/api/auth/logout", { body: { refreshToken } }).catch(() => {});
}

/** Delete the account on the server (Play Store requirement), then sign out locally. */
export async function deleteAccount(): Promise<void> {
  await apiRequest("/api/auth/me", { method: "DELETE", token: await getAccessToken() });
  await signOutLocally();
}
