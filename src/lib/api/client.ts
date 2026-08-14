import { ApiError } from "@/types/api";

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

/**
 * The single entry point for every network call. Components must never call
 * fetch() directly — go through a domain module in src/lib/api/.
 *
 * The backend is being rewritten. Until an endpoint exists, its domain module
 * should fall back to a named mock in src/lib/api/mocks/.
 */
export async function request<T>(
  path: string,
  init: RequestInit & { token?: string } = {}
): Promise<T> {
  const { token, headers, ...rest } = init;

  const res = await fetch(`${BASE}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  if (!res.ok) {
    let code: string | undefined;
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      code = body?.code;
      message = body?.message ?? message;
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(message, res.status, code);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
