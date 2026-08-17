import { sessionStorage } from "@/lib/auth/session-storage";
import { API_BASE, USE_MOCKS, WAWU_ID_BASE } from "./config";

const REQUEST_TIMEOUT_MS = 8000;

/** Simulated latency for mock reads — mirrors a real round trip. */
export async function delay(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export class ApiError extends Error {
  readonly status: number;
  /** Machine-readable error code, when the backend sends one (e.g. WAWU ID's `USER_NOT_IN_WAWUID`). */
  readonly code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

/** Thrown by apiFetch in mock mode so the try/catch→mock pattern short-circuits. */
class MockModeError extends Error {
  constructor() {
    super("Running in mock mode — no backend configured");
    this.name = "MockModeError";
  }
}

/**
 * True only when there's genuinely no backend configured (dev/demo mode) --
 * false for every other failure, including a real backend's 4xx/5xx and a
 * network/timeout error. Callers that fall back to mock data on catch MUST
 * gate that fallback on this check for anything security- or money-bearing
 * (auth, payments) -- see auth.ts's doc comment for the incident this
 * distinction fixes. A bare `catch {}` cannot tell "no backend to call"
 * apart from "backend said no", and silently treating the latter as the
 * former converts real rejections into fake successes.
 */
export function isMockModeError(e: unknown): boolean {
  return e instanceof MockModeError;
}

interface ApiRequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  /** Attach the WAWU ID session token. */
  authed?: boolean;
  token?: string;
  /** Override the origin this call hits (default: API_BASE from ./config). Used to call WAWU ID directly. */
  baseUrl?: string;
}

/** Every Hub API success response wraps its payload as {statusCode, message, data}. */
interface Envelope<T> {
  statusCode?: number;
  message?: string;
  data: T;
}

interface PaginationMeta {
  currentPage: number;
  nextPage: number | null;
  perPage: number;
  total: number;
}

/** Paginated-list variant of the envelope: {statusCode, message, data: [], pagination}. */
interface PaginatedEnvelope<T> extends Envelope<T[]> {
  pagination: PaginationMeta;
}

function hasDataKey(body: unknown): body is { data: unknown } {
  return typeof body === "object" && body !== null && "data" in body;
}

/**
 * A stale access token (15-minute TTL on WAWU ID) used to strand the whole
 * app: every authed call 401'd forever after, with no path back to sign-in
 * short of manually clearing storage. WAWU ID has always had a real
 * POST /auth/refresh (rotates both tokens) that the frontend never called —
 * this wires it in. Concurrent 401s share one in-flight refresh instead of
 * each firing their own (a second call would rotate the refresh token out
 * from under the first and fail it).
 */
let refreshPromise: Promise<boolean> | null = null;

async function refreshSession(): Promise<boolean> {
  const refreshToken = sessionStorage.getRefreshToken();
  if (!refreshToken) return false;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(`${WAWU_ID_BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
      signal: controller.signal,
    });
    if (!res.ok) return false;
    const body = await res.json();
    const data = (body && typeof body === "object" && "data" in body ? body.data : body) as
      | { accessToken?: string; refreshToken?: string }
      | undefined;
    if (!data?.accessToken || !data?.refreshToken) return false;
    sessionStorage.setToken(data.accessToken);
    sessionStorage.setRefreshToken(data.refreshToken);
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

/** The refresh token itself is dead too — there is genuinely no way back in without a fresh sign-in. */
function forceSignIn(): void {
  sessionStorage.clear();
  if (typeof window !== "undefined") window.location.href = "/sign-in";
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
  const raw = await rawFetch(path, options);
  if (raw === undefined) return undefined as T;
  // Every Hub-style response wraps its payload as {statusCode, message, data}.
  // Unwrap it so domain modules receive the inner shape. Anything without a
  // `data` key (a non-enveloped endpoint, if one ever exists) passes through as-is.
  if (hasDataKey(raw)) return (raw as Envelope<T>).data;
  return raw as T;
}

/**
 * Same contract as apiFetch, but for endpoints returning a paginated list —
 * preserves the `pagination` metadata instead of unwrapping past it.
 */
export async function apiFetchPaginated<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<{ data: T[]; pagination: PaginationMeta }> {
  const raw = await rawFetch(path, options);
  if (raw === undefined) return { data: [], pagination: { currentPage: 1, nextPage: null, perPage: 0, total: 0 } };
  const envelope = raw as PaginatedEnvelope<T>;
  return { data: envelope.data, pagination: envelope.pagination };
}

/** Shared fetch + timeout + auth + error-handling core for apiFetch/apiFetchPaginated. */
async function rawFetch(path: string, options: ApiRequestOptions, isRetry = false): Promise<unknown> {
  if (USE_MOCKS) throw new MockModeError();

  const { body, authed, token, baseUrl, ...rest } = options;
  const isAuthedCall = Boolean(authed || token);

  const headers = new Headers(rest.headers);
  if (body !== undefined) headers.set("Content-Type", "application/json");
  if (isAuthedCall) {
    const sessionToken = token ?? sessionStorage.getToken();
    if (sessionToken) headers.set("Authorization", `Bearer ${sessionToken}`);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(`${baseUrl ?? API_BASE}${path}`, {
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

  // A stale access token on an already-signed-in session's own call — try a
  // silent refresh-and-retry before giving up. Never applies to `token`
  // (explicit override, e.g. a fresh sign-up flow's own token) or to a call
  // already retried once, and never to unauthenticated calls (a real 401
  // from e.g. a wrong sign-in password must reach the caller as-is).
  if (res.status === 401 && authed && !token && !isRetry) {
    if (!refreshPromise) refreshPromise = refreshSession().finally(() => { refreshPromise = null; });
    const refreshed = await refreshPromise;
    if (refreshed) return rawFetch(path, options, true);
    forceSignIn();
    // forceSignIn navigates away; throw so the caller's current render never
    // sees a resolved value for a session that's already gone.
    throw new ApiError("Session expired", 401);
  }

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    let code: string | undefined;
    try {
      const data = await res.json();
      if (data && typeof data.message === "string") message = data.message;
      if (data && typeof data.code === "string") code = data.code;
    } catch {
      /* non-JSON error body — keep the status message */
    }
    throw new ApiError(message, res.status, code);
  }

  if (res.status === 204) return undefined;
  return await res.json();
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
