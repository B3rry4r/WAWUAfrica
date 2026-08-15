import { apiFetch } from "./client";
import { mockSearch, mockSearchCommunities, mockSearchCreators, mockSearchResults } from "./mocks/mockSearch";
import type { SearchResponse } from "@/types/search";

export async function searchAll(query: string): Promise<SearchResponse> {
  try {
    return await apiFetch<SearchResponse>(`/api/hub/search?q=${encodeURIComponent(query)}`, { authed: true });
  } catch {
    return mockSearch(query);
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