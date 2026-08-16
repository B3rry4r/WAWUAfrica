import { sessionStorage } from "@/lib/auth/session-storage";
import { API_BASE, USE_MOCKS } from "./config";

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
async function rawFetch(path: string, options: ApiRequestOptions): Promise<unknown> {
  if (USE_MOCKS) throw new MockModeError();

  const { body, authed, token, baseUrl, ...rest } = options;

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
