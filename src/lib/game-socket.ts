import { io, type Socket } from "socket.io-client";

import { getAccessToken } from "@/features/auth/auth-store";
import type { AckResponse, ClientToServerEvents, ServerToClientEvents } from "@/shared/contract";

import { API_URL } from "./api";

export type GameSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const ACK_TIMEOUT_MS = 5_000;

let socket: GameSocket | null = null;

export function getGameSocket(): GameSocket {
  socket ??= io(API_URL, {
    autoConnect: false,
    transports: ["websocket", "polling"],
    // Read on every (re)connect, so an expired access token is refreshed first. Without a token
    // (refresh failed) the server rejects the handshake and the room store retries later.
    auth: (cb) => {
      getAccessToken().then(
        (token) => cb({ token }),
        () => cb({}),
      );
    },
  });
  return socket;
}

/** Error with the server's error `code` (e.g. "INVALID_PASSWORD") and optional `details`. */
export class RequestError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "RequestError";
  }
}

type AckEvent = keyof ClientToServerEvents;
type AckData<E extends AckEvent> =
  Parameters<ClientToServerEvents[E]> extends [...unknown[], (res: AckResponse<infer T>) => void] ? T : never;
type Payload<E extends AckEvent> =
  Parameters<ClientToServerEvents[E]> extends [infer P, (res: never) => void] ? [payload: P] : [];

/** Emit with ack; resolves with `data` or throws a RequestError. */
export async function request<E extends AckEvent>(event: E, ...payload: Payload<E>): Promise<AckData<E>> {
  const s = getGameSocket();
  if (!s.connected) throw new RequestError("DISCONNECTED", "Belum terhubung ke server.");
  let res: AckResponse<AckData<E>>;
  try {
    // emitWithAck's typing can't follow the generic event name, hence the cast.
    const timed = s.timeout(ACK_TIMEOUT_MS) as unknown as {
      emitWithAck: (e: string, ...a: unknown[]) => Promise<typeof res>;
    };
    res = await timed.emitWithAck(event, ...payload);
  } catch {
    throw new RequestError("TIMEOUT", "Server tidak merespons.");
  }
  if (!res.ok) throw new RequestError(res.error.code, res.error.message, res.error.details);
  return res.data;
}
