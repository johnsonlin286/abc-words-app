import { create } from "zustand";

import { getAccessToken } from "@/features/auth/auth-store";
import { getGameSocket, request, RequestError, type GameSocket } from "@/lib/game-socket";
import type { RoomView } from "@/shared/contract";
import {
  LIMITS,
  NAME_TAKEN,
  ROOM_TYPE,
  UNAUTHORIZED,
  type ChatMessage,
  type GameSettings,
  type GameState,
  type RejectReason,
} from "@/shared/game";

/** Chat messages kept on the phone (the server sends its own recent history with the room). */
const MAX_MESSAGES = 200;

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
  /** Local time at which a game waiting for missing players gives up; null while enough are online. */
  waitingEndsAt: number | null;
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
  /** The room's chat, oldest first. */
  messages: ChatMessage[];
  /**
   * Local time until which this player is muted in chat for breaking the chat rules. The server only
   * says so when a message is sent; it lasts for this app session.
   */
  chatMutedUntil: number | null;
};

const NO_ROOM = {
  roomId: null,
  room: null,
  phaseEndsAt: null,
  waitingEndsAt: null,
  ping: null,
  messages: [] as ChatMessage[],
  chatMutedUntil: null,
};
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

/** End times computed from snapshots of the same phase differ only by network delay; below this they are kept. */
const JITTER_MS = 300;

/**
 * The end time from this snapshot, or the previous one when it is the same deadline seen again. Every
 * snapshot (each pick, vote or answer) would otherwise move it a little, restarting every countdown.
 */
function steadyEnd(before: number | null, remainingMs: number | null, sameClock: boolean): number | null {
  if (remainingMs === null) return null;
  const next = Date.now() + remainingMs;
  return sameClock && before !== null && Math.abs(next - before) < JITTER_MS ? before : next;
}

function showRoom(room: GameRoomView) {
  const { room: before, phaseEndsAt, waitingEndsAt } = useRoomStore.getState();
  const samePhase =
    before?.id === room.id &&
    before.state.round === room.state.round &&
    before.state.phase === room.state.phase &&
    before.state.paused === room.state.paused;
  const sameRoom = before?.id === room.id;
  set({
    roomId: room.id,
    room,
    messages: room.state.messages.slice(-MAX_MESSAGES),
    // A mute belongs to the room it was given in.
    ...(sameRoom ? {} : { chatMutedUntil: null }),
    phaseEndsAt: steadyEnd(phaseEndsAt, room.state.remainingMs, samePhase),
    waitingEndsAt: steadyEnd(waitingEndsAt, room.state.waitingForPlayersMs, before?.id === room.id),
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
    if (event === "chat:message") set(({ messages }) => ({ messages: mergeMessage(messages, data as ChatMessage) }));
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

/** Append without duplicates: a message can arrive both in `room:state` and as an event. */
function mergeMessage(list: ChatMessage[], message: ChatMessage): ChatMessage[] {
  return list.some((m) => m.id === message.id) ? list : [...list, message].slice(-MAX_MESSAGES);
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

/** The pick can be changed until everyone has picked; numbers stay secret until the reveal. */
export const pickNumber = (value: number) => gameAction("pick", { value });
/** Vote to replace or keep this round's letter; `null` takes the vote back. */
export const setLetterVote = (choice: "change" | "keep" | null) => gameAction("changeLetter", { choice });

/** Reject someone else's answer with a reason; `null` takes the rejection back. */
export const setRejection = (answerUserId: string, reason: RejectReason | null) =>
  gameAction("reject", reason ? { answerUserId, rejected: true, reason } : { answerUserId, rejected: false });
/** Mark (or unmark) this player as done judging; voting ends once every judge is done. */
export const setVotingDone = (done: boolean) => gameAction("doneVoting", { done });

export type AnswerOutcome =
  | { status: "accepted" }
  | { status: "duplicate" | "near-tie" | "error"; message: string; retryAfterMs?: number };

const ANSWER_MESSAGES = {
  duplicate: "Kata itu (atau nama lainnya) sudah dijawab pemain lain. Coba kata lain.",
  "near-tie": "Keduluan! Kata itu (atau nama lainnya) baru saja masuk. Waktumu ditambah, coba kata lain.",
};

/** The pause length the server attaches to a rejected answer, if any. */
function retryAfter(source: unknown): number | undefined {
  const value = (source as { retryAfterMs?: unknown } | null | undefined)?.retryAfterMs;
  return typeof value === "number" && value > 0 ? value : undefined;
}

/** One accepted answer per round; a refused one says why, and may start a short pause. */
export async function submitAnswer(text: string): Promise<AnswerOutcome> {
  try {
    const data = (await request("room:action", { action: "answer", payload: { text } })) as {
      status: "accepted" | "duplicate" | "near-tie";
      retryAfterMs?: number;
    };
    if (data.status === "accepted") return { status: "accepted" };
    return { status: data.status, message: ANSWER_MESSAGES[data.status], retryAfterMs: retryAfter(data) };
  } catch (error) {
    const details = error instanceof RequestError ? error.details : undefined;
    return { status: "error", message: errorMessage(error), retryAfterMs: retryAfter(details) };
  }
}

/**
 * Sends a chat message; resolves with null when sent, or why not. A mute isn't an error line: it is
 * kept in `chatMutedUntil`, which the chat shows with a countdown.
 */
export async function sendMessage(text: string): Promise<string | null> {
  try {
    const message = (await request("room:action", { action: "send", payload: { text } })) as ChatMessage;
    set(({ messages }) => ({ messages: mergeMessage(messages, message) }));
    return null;
  } catch (error) {
    const mutedMs = retryAfter(error instanceof RequestError ? error.details : undefined);
    if (!mutedMs) return errorMessage(error);
    set({ chatMutedUntil: Date.now() + mutedMs });
    return null;
  }
}

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
