import type { AckResponse } from "@/shared/contract";

/**
 * NESIO backend: Socket.IO and the REST API share one origin. On the Android emulator the Mac's
 * localhost is 10.0.2.2; on a phone use the Mac's LAN IP (see .env.example).
 */
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://10.0.2.2:3001";

const TIMEOUT_MS = 15_000;

/** A failed request: `code` from the server's error payload, or NETWORK_ERROR when unreachable. */
export class ApiError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type RequestOptions = { method?: "GET" | "POST" | "DELETE"; body?: unknown; token?: string };

/** JSON request to the backend; returns `data` of `{ ok, data }` or throws ApiError. */
export async function apiRequest<T>(path: string, { method, body, token }: RequestOptions = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: method ?? (body === undefined ? "GET" : "POST"),
      headers: {
        Accept: "application/json",
        ...(body !== undefined && { "Content-Type": "application/json" }),
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      ...(body !== undefined && { body: JSON.stringify(body) }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    throw new ApiError("NETWORK_ERROR", "Tidak bisa terhubung ke server. Cek koneksi internetmu.", 0);
  }
  const payload = (await res.json().catch(() => null)) as AckResponse<T> | null;
  if (!payload) throw new ApiError("INTERNAL_ERROR", `Server error (HTTP ${res.status}).`, res.status);
  if (!payload.ok) throw new ApiError(payload.error.code, payload.error.message, res.status);
  return payload.data;
}
