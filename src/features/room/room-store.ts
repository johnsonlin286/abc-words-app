import { create } from "zustand";

import { getAccessToken } from "@/features/auth/auth-store";
import { getGameSocket, request, type GameSocket } from "@/lib/game-socket";
import type { RoomView } from "@/shared/contract";
import { LIMITS, NAME_TAKEN, ROOM_TYPE, UNAUTHORIZED, type GameSettings, type GameState } from "@/shared/game";

/** Longest wait between two attempts after the server refused the connection. */
const RETRY_MAX_MS = 15_000;

/** Why the server refused the connection, for the codes a player can understand. */
const REJECTION_MESSAGES: Record<string, string> = {
  [NAME_TAKEN]: "Nama panggilanmu sedang dipakai pemain lain. Mencoba lagi…",
};

export type Connection = "idle" | "connecting" | "online" | "reconnecting";
export type GameRoomView = RoomView<GameState, GameSettings>;

type RoomState = {
  connection: Connection;
  /** True once the server has told us, after connecting, whether we are in a room. */
  ready: boolean;
  /** The room the server says we are in. Screens follow this, not user actions. */
  roomId: string | null;
  room: GameRoomView | null;
  /** Local time at which the current game phase ends; null when it has no limit. */
  phaseEndsAt: number | null;
  /** Shown in the lobby after being kicked / the room closing. */
  notice: string | null;
  /** Why the server keeps refusing the connection. */
  connectionError: string | null;
  /** A create or join request is on its way. */
  pending: boolean;
  /** Why the last create or join request failed. */
  requestError: string | null;
  /** The host's last call to this player (waiting room); `at` changes on every call. */
  ping: { from: string; at: number } | null;
};

const NO_ROOM = { roomId: null, room: null, phaseEndsAt: null, ping: null };
const INITIAL: RoomState = {
  connection: "idle",
  ready: false,
  ...NO_ROOM,
  notice: null,
  connectionError: null,
  pending: false,
  requestError: null,
};

export const useRoomStore = create<RoomState>()(() => INITIAL);

const set = useRoomStore.setState;

function showRoom(room: GameRoomView) {
  set({
    roomId: room.id,
    room,
    phaseEndsAt: room.state.remainingMs === null ? null : Date.now() + room.state.remainingMs,
  });
}

/** True between connectGame() and disconnectGame(): retries stop once the player signs out. */
let wanted = false;
let bound = false;
let rejections = 0;
let retryTimer: ReturnType<typeof setTimeout> | null = null;

function clearRetry() {
  if (retryTimer) clearTimeout(retryTimer);
  retryTimer = null;
}

/** socket.io gives up when the server refuses or drops a connection itself, so retry here. */
function scheduleRetry(s: GameSocket, code?: string) {
  clearRetry();
  const delay = Math.min(1_000 * 2 ** rejections++, RETRY_MAX_MS);
  retryTimer = setTimeout(async () => {
    // The server may find the token expired before this phone does (clock difference). A refresh the
    // server rejects signs the player out, which ends the connection through disconnectGame().
    if (code === UNAUTHORIZED) await getAccessToken({ forceRefresh: true }).catch(() => {});
    if (wanted) s.connect();
  }, delay);
}

function bindSocket(): GameSocket {
  const s = getGameSocket();
  if (bound) return s;
  bound = true;

  // Sent after every successful (re)connect; the server restores our room by itself.
  s.on("session", (session) => {
    // No room: e.g. it expired or the server restarted. Otherwise `room:state` follows.
    set(session.roomId ? { ready: true, roomId: session.roomId } : { ready: true, ...NO_ROOM });
  });
  // Full snapshot of our room: the source of truth.
  s.on("room:state", (room) => showRoom(room as GameRoomView));
  s.on("room:event", ({ roomId, event, data }) => {
    if (roomId !== useRoomStore.getState().room?.id) return;
    if (event === "ping") set({ ping: { from: (data as { from: string }).from, at: Date.now() } });
  });
  s.on("room:kicked", () => set({ ...NO_ROOM, notice: "Kamu dikeluarkan dari room oleh host." }));
  s.on("room:closed", ({ reason }) =>
    set({
      ...NO_ROOM,
      notice: reason === "idle" ? "Room ditutup karena tidak ada aktivitas." : "Room sudah ditutup.",
    }),
  );

  s.on("connect", () => {
    rejections = 0;
    clearRetry();
    set({ connection: "online", connectionError: null });
  });
  s.on("disconnect", (reason) => {
    if (reason === "io client disconnect") return set({ connection: "idle" });
    set({ connection: "reconnecting" });
    if (reason === "io server disconnect") scheduleRetry(s);
  });
  s.on("connect_error", (err) => {
    set({ connection: "reconnecting", connectionError: REJECTION_MESSAGES[err.message] ?? null });
    // Still active: a network problem, which socket.io retries by itself.
    if (!s.active) scheduleRetry(s, err.message);
  });

  return s;
}

/** Connect as the signed-in player. Safe to call repeatedly. */
export function connectGame(): void {
  const s = bindSocket();
  wanted = true;
  if (s.connected || s.active) return;
  set({ connection: "connecting" });
  s.connect();
}

/** Signing out (or changing the nickname): give up the seat right away, then disconnect. */
export function disconnectGame(): void {
  wanted = false;
  clearRetry();
  rejections = 0;
  const s = getGameSocket();
  if (s.connected && useRoomStore.getState().room) s.emit("room:leave", () => {});
  s.disconnect();
  set(INITIAL);
}

/** Back in the foreground: reconnect without waiting for the backoff, or catch up on the room. */
export async function resumeGame(): Promise<void> {
  if (!wanted) return;
  const s = getGameSocket();
  if (s.connected) {
    try {
      const room = await request("room:sync");
      if (room) showRoom(room as GameRoomView);
      else set(NO_ROOM);
      return;
    } catch {
      // No answer: the connection died while the app slept.
      if (!wanted) return;
    }
  }
  clearRetry();
  rejections = 0;
  s.disconnect();
  set({ connection: "reconnecting" });
  s.connect();
}

/** Shared flow for create and join. Resolves with true once in the room. */
async function enter(run: () => Promise<RoomView>): Promise<boolean> {
  set({ pending: true, requestError: null, notice: null });
  try {
    showRoom((await run()) as GameRoomView);
    return true;
  } catch (error) {
    set({ requestError: errorMessage(error) });
    return false;
  } finally {
    set({ pending: false });
  }
}

export function createRoom({ password }: { password?: string }): Promise<boolean> {
  return enter(() =>
    request("room:create", {
      type: ROOM_TYPE,
      maxMembers: LIMITS.maxMembers,
      // Every room is listed in the lobby; "private" means it needs a password.
      isPublic: true,
      ...(password && { password }),
    }),
  );
}

export function joinRoom({ roomId, password }: { roomId: string; password?: string }): Promise<boolean> {
  return enter(() => request("room:join", { roomId, ...(password && { password }) }));
}

export async function leaveRoom(): Promise<void> {
  // On error (e.g. NOT_IN_ROOM, timeout) we leave locally regardless.
  await request("room:leave").catch(() => {});
  set({ ...NO_ROOM, requestError: null });
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Terjadi kesalahan.";
}

/** Runs a game action; resolves with an error message, or null. The new state arrives by `room:state`. */
async function gameAction(action: string, payload?: unknown): Promise<string | null> {
  try {
    await request("room:action", { action, ...(payload !== undefined && { payload }) });
    return null;
  } catch (error) {
    return errorMessage(error);
  }
}

/** Host only. Every start spends a room key, and ending the game doesn't give it back. */
export const startGame = () => gameAction("start");
export const endGame = () => gameAction("end");

/** Waiting room: press (or take back) "Siap". */
export const setReady = (ready: boolean) => gameAction("ready", { ready });

/** Host only: call a player who isn't ready (sound and vibration on their phone). */
export const pingPlayer = (userId: string) => gameAction("ping", { userId });

export function clearPing(): void {
  set({ ping: null });
}

/** Host only, waiting room only: remove a player. They may join again. */
export async function kickPlayer(userId: string): Promise<string | null> {
  try {
    await request("room:kick", { userId });
    return null;
  } catch (error) {
    return errorMessage(error);
  }
}

/** Host only. Resolves with an error message, or null when saved. */
export async function updateSettings(patch: Partial<GameSettings>): Promise<string | null> {
  const before = useRoomStore.getState().room;
  if (!before) return "Kamu tidak sedang berada di room.";
  // Applied right away so quick repeated taps build on each other.
  set({ room: { ...before, settings: { ...before.settings, ...patch } } });
  try {
    await request("room:update", { settings: patch });
    return null; // the saved settings arrive through `room:state`
  } catch (error) {
    set(({ room }) => (room ? { room: { ...room, settings: before.settings } } : {}));
    return errorMessage(error);
  }
}

export function clearRequestError(): void {
  set({ requestError: null });
}
