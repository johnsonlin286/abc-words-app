import { create } from "zustand";

import { ApiError, apiRequest } from "@/lib/api";
import type { AuthSession, AuthUser, DisplayNameInput } from "@/shared/contract";

import { clearSession, loadSession, saveSession } from "./session-storage";

/** Refresh this long before the access token expires, so a request never races the expiry. */
const REFRESH_MARGIN_MS = 60_000;

/** Same words as the web, shown on the login screen after the app signed the player out by itself. */
const SESSION_ENDED = "Sesi berakhir. Silakan masuk lagi.";

type AuthState = {
  status: "loading" | "signedOut" | "signedIn";
  user: AuthUser | null;
  /** Why the app signed the player out by itself (expired or revoked session, account deleted elsewhere). */
  notice: string | null;
};

export const useAuthStore = create<AuthState>()(() => ({ status: "loading", user: null, notice: null }));

// Tokens stay outside React state: nothing renders them, and keeping them here avoids re-renders
// every 15 minutes when the access token rotates.
let session: AuthSession | null = null;
let refreshing: Promise<AuthSession> | null = null;

function setSignedIn(next: AuthSession) {
  session = next;
  useAuthStore.setState({ status: "signedIn", user: next.user, notice: null });
}

/** `notice` says why when the player didn't sign out themself. */
async function signOutLocally(notice: string | null = null) {
  session = null;
  refreshing = null;
  await clearSession();
  useAuthStore.setState({ status: "signedOut", user: null, notice });
}

/** Read the saved session at launch (the splash screen stays up until this settles). */
export async function restoreSession(): Promise<void> {
  const saved = await loadSession();
  if (!saved || saved.tokens.refreshTokenExpiresAt <= Date.now()) {
    // A saved but expired session ended without the player choosing to.
    await signOutLocally(saved ? SESSION_ENDED : null);
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
 * `forceRefresh` skips the expiry check, for a token the server already refused.
 */
export async function getAccessToken({ forceRefresh = false } = {}): Promise<string> {
  if (!session) throw new ApiError("UNAUTHORIZED", "Belum masuk.", 401);
  const fresh = session.tokens.accessTokenExpiresAt - REFRESH_MARGIN_MS > Date.now();
  if (fresh && !forceRefresh) return session.tokens.accessToken;

  refreshing ??= apiRequest<AuthSession>("/api/auth/refresh", { body: { refreshToken: session.tokens.refreshToken } })
    .then(async (next) => {
      await saveSession(next);
      setSignedIn(next);
      return next;
    })
    .catch(async (error: unknown) => {
      if (error instanceof ApiError && error.status === 401) await signOutLocally(SESSION_ENDED);
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
