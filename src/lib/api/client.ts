import { sessionStorage } from "@/lib/auth/session-storage";
import { API_BASE, USE_MOCKS } from "./config";

const REQUEST_TIMEOUT_MS = 8000;

/** Simulated latency for mock reads — mirrors a real round trip. */
export async function delay(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/** Thrown by apiFetch in mock mode so the try/catch→mock pattern short-circuits. */
class MockModeError extends Error {
  constructor() {
    super("Running in mock mode — no backend configured");
    this.name = "MockModeError";
  }
}

interface ApiRequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  /** Attach the WAWU ID session token. */
  authed?: boolean;
  token?: string;
}

/**
 * Thin fetch wrapper — the only place raw fetch lives. Components call the
 * domain modules in src/lib/api/*, never fetch directly.
 *
 * In mock mode (no NEXT_PUBLIC_API_BASE_URL) it throws immediately so the
 * domain modules return their mock data instantly, with no network round-trip.
 * Otherwise it applies an 8s timeout so a misconfigured/unreachable backend
 * fails fast and the mock fallback kicks in instead of hanging the UI.
 */
export async function apiFetch<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  if (USE_MOCKS) throw new MockModeError();

  const { body, authed, token, ...rest } = options;

  const headers = new Headers(rest.headers);
  if (body !== undefined) headers.set("Content-Type", "application/json");
  if (authed || token) {
    const sessionToken = token ?? sessionStorage.getToken();
    if (sessionToken) headers.set("Authorization", `Bearer ${sessionToken}`);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...rest,
      headers,
      signal: controller.signal,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (e) {
    throw e instanceof Error ? e : new ApiError("Network error", 0);
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      if (data && typeof data.message === "string") message = data.message;
    } catch {
      /* non-JSON error body — keep the status message */
    }
    throw new ApiError(message, res.status);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
/**
 * Mock read helper used by the creator-side API modules (earnings, kyc,
 * messaging, subscription). Resolves after a simulated round trip.
 *
 * SEAM: every caller of this is a mock read — grep "SEAM:" to find them.
 */
export async function mockRequest<T>(data: T, delayMs = 350): Promise<T> {
  await delay(delayMs);
  return data;
}
