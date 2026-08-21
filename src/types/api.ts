export interface Paginated<T> {
  data: T[];
  page: number;
  hasMore: boolean;
}

/**
 * There is exactly one ApiError, and it lives with the fetch wrapper that
 * throws it. A second class by the same name used to be declared here; nothing
 * threw it, but any `e instanceof ApiError` check that happened to import this
 * one would have silently failed against a real error from the API layer.
 */
export { ApiError, NetworkError, isNetworkError } from "@/lib/api/client";
