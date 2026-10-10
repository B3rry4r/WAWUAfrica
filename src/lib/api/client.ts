import { isPublicPath } from "@/lib/auth/public-routes";
import { sessionStorage } from "@/lib/auth/session-storage";
import { API_BASE, USE_MOCKS, WAWU_ID_BASE } from "./config";

const REQUEST_TIMEOUT_MS = 8000;

/** Simulated latency for mock reads — mirrors a real round trip. */
export async function delay(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * The server answered, and the answer was a refusal. `status` is a REAL HTTP
 * status — a reply we received, not a failure to receive one.
 *
 * `serverMessage` is set only when the backend actually explained itself in
 * the body ({statusCode, message, data} — e.g. "This endpoint is only
 * available to creator accounts."). `message` always has something in it, but
 * it may be a synthesized "Request failed (403)" placeholder, which is a
 * status code in a sentence and must never be shown to a user. UI copy comes
 * from describeError() in ./errors, which reads `serverMessage` and ignores
 * the placeholder.
 */
export class ApiError extends Error {
  readonly status: number;
  /** Machine-readable error code, when the backend sends one (e.g. WAWU ID's `USER_NOT_IN_WAWUID`). */
  readonly code?: string;
  /** The backend's own explanation, verbatim — undefined when it sent none. */
  readonly serverMessage?: string;

  constructor(message: string, status: number, code?: string, serverMessage?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.serverMessage = serverMessage;
  }
}

/**
 * The request never got an answer at all: DNS/TLS failure, the device is
 * offline, the origin is unreachable, or our own 8s timeout fired.
 *
 * This is the ONLY failure that is honestly a "network error". It extends
 * ApiError with status 0 so existing `e instanceof ApiError` call sites keep
 * working, but `isNetworkError()` (or the status-0 check) lets the UI tell
 * "we could not reach WAWU" apart from "WAWU replied, and said no". Before
 * this class existed a transport failure was rethrown as a bare TypeError
 * ("Failed to fetch") or an AbortError DOMException, which no caller could
 * distinguish from anything else — so every screen told the same connectivity
 * story for both, including for a 403 with a perfectly good explanation in it.
 */
export class NetworkError extends ApiError {
  /** `timeout` = our own AbortController fired at REQUEST_TIMEOUT_MS. `offline` = fetch itself rejected. */
  readonly kind: "timeout" | "offline";

  constructor(kind: "timeout" | "offline", options?: { cause?: unknown }) {
    super(
      kind === "timeout" ? "The request timed out before WAWU answered" : "Could not reach WAWU",
      0,
      undefined,
      undefined,
    );
    this.name = "NetworkError";
    this.kind = kind;
    if (options && "cause" in options) this.cause = options.cause;
  }
}

/** True only for a genuine transport failure — never for a 4xx/5xx the server actually sent. */
export function isNetworkError(e: unknown): e is NetworkError {
  return e instanceof NetworkError;
}

/** Thrown by apiFetch in mock mode so the try/catch→mock pattern short-circuits. */
class MockModeError extends Error {
  constructor() {
    super("Running in mock mode. No backend configured");
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
  if (typeof window === "undefined") return;
  // A PUBLIC page must not be evicted by a 401.
  //
  // This is the third gate a public route has to clear (see
  // lib/auth/public-routes.ts). The store link at /wawu/:handle renders the
  // profile screen, which fires authed reads on mount — a visitor with no
  // session gets 401s back, there is no refresh token to rotate, and this
  // function used to hard-navigate them to /sign-in before they had read a
  // word. That is precisely the login wall build brief C3 forbids, and it
  // fired without any route gate being involved at all.
  //
  // On a public path the dead tokens are still cleared (they are dead either
  // way) and the caller still gets the thrown ApiError to handle; what does
  // not happen is the navigation.
  if (isPublicPath(window.location.pathname)) return;
  window.location.href = "/sign-in";
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

/**
 * Pulls the server's own explanation out of a failed response.
 *
 * Handles both shapes this backend emits: `message` as a string (the Hub
 * envelope, and Nest's default exception filter) and `message` as an array of
 * strings (class-validator's field errors on a 400). Returns undefined for a
 * body that carries no explanation at all — an empty body, HTML from a proxy,
 * a bare status page — so the caller can tell "the server explained itself"
 * apart from "the server said nothing", rather than inventing a sentence.
 */
async function readErrorBody(res: Response): Promise<{ message?: string; code?: string }> {
  let data: unknown;
  try {
    data = await res.json();
  } catch {
    return {};
  }
  if (typeof data !== "object" || data === null) return {};
  const body = data as { message?: unknown; code?: unknown; error?: unknown };
  let message: string | undefined;
  if (typeof body.message === "string" && body.message.trim()) message = body.message.trim();
  else if (Array.isArray(body.message)) {
    const parts = body.message.filter((m): m is string => typeof m === "string" && Boolean(m.trim()));
    if (parts.length) message = parts.join(". ");
  } else if (typeof body.error === "string" && body.error.trim()) message = body.error.trim();
  // Hub money-style routes explain a refusal as `reason: { code, message }`
  // (backend docs/contract/CONVENTIONS.md, section 3). A top-level `code`
  // (WAWU ID's shape) still wins when both are present.
  const reason = (body as { reason?: unknown }).reason;
  const reasonCode =
    typeof reason === "object" && reason !== null && typeof (reason as { code?: unknown }).code === "string"
      ? (reason as { code: string }).code
      : undefined;
  const code = typeof body.code === "string" ? body.code : reasonCode;
  return { message, code };
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
    // fetch only rejects when the request never completed — there is no
    // response and no status. Everything the server DID answer (401/403/404/
    // 5xx) resolves normally and is handled below, so nothing that has a
    // status can land here. Type it as such instead of rethrowing a bare
    // TypeError/AbortError, which the UI could only ever guess at.
    throw new NetworkError(controller.signal.aborted ? "timeout" : "offline", { cause: e });
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
    // Read the body BEFORE deciding what this failure is. A 4xx carries the
    // server's reason in exactly the same envelope a 200 does
    // ({statusCode, message, data}) — dropping it is what left the UI with
    // nothing to say but "check your connection".
    const { message: serverMessage, code } = await readErrorBody(res);
    throw new ApiError(serverMessage ?? `Request failed (${res.status})`, res.status, code, serverMessage);
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
