import { apiFetch } from "./client";
import { mockSearch, mockSearchCommunities, mockSearchCreators, mockSearchResults, mockClosestResults, mockRecentSearches } from "./mocks/mockSearch";
import type { SearchResponse } from "@/types/search";
import type { ContentPiece } from "@/types/content";

export async function getRecentSearches(): Promise<string[]> {
  try {
    const res = await apiFetch<{ recent: string[] }>("/api/hub/search/recent", { authed: true });
    return res.recent;
  } catch {
    // SEAM: replace with GET /api/hub/search/recent
    return mockRecentSearches;
  }
}

export async function searchAll(query: string): Promise<SearchResponse> {
  try {
    return await apiFetch<SearchResponse>(`/api/hub/search?q=${encodeURIComponent(query)}`, { authed: true });
  } catch {
    return mockSearch(query);
  }
}

/** Fuzzy "closest matches" shown on a no-results screen. */
export async function getClosestResults(query: string): Promise<ContentPiece[]> {
  try {
    const res = await apiFetch<{ items: ContentPiece[] }>(`/api/hub/search/closest?q=${encodeURIComponent(query)}`, {
      authed: true,
    });
    return res.items;
  } catch {
    // SEAM: replace with GET /api/hub/search/closest
    return mockClosestResults(query);
  }
}

export async function getPopularSearches(): Promise<string[]> {
  try {
    const res = await apiFetch<{ popular: string[] }>("/api/hub/search/popular", { authed: true });
    return res.popular;
  } catch {
    return ["bookkeeping", "export to ghana", "poultry feed", "tailoring", "invoice template"];
  }
}

export async function getSuggestedCreators() {
  try {
    const res = await apiFetch<{ items: typeof mockSearchCreators }>("/api/hub/search/suggested-creators", { authed: true });
    return res.items;
  } catch {
    return mockSearchCreators;
  }
}

export async function getSuggestedCommunities() {
  try {
    const res = await apiFetch<{ items: typeof mockSearchCommunities }>("/api/hub/search/suggested-communities", { authed: true });
    return res.items;
  } catch {
    return mockSearchCommunities;
  }
}

export { mockSearchResults };