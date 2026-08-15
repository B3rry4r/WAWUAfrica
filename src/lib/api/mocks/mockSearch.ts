import type { SearchResponse, SearchResults } from "@/types/search";
import type { ContentPiece } from "@/types/content";
import { mockContent } from "./mockContent";

const searchContent = mockContent.filter((c) => c.accessType === "free" || c.title.includes("book") || c.title.toLowerCase().includes("book"));

export const mockSearchCreators = [
  { wawuId: "wawu_funmi", fullName: "Funmi Adeyemi", headline: "Accountant", location: "Lagos", verificationLevel: "certified_professional" as const, pieceCount: 6 },
  { wawuId: "wawu_adaeze", fullName: "Adaeze Okonkwo", headline: "Business Strategist", location: "Enugu", verificationLevel: "certified_professional" as const, pieceCount: 4 },
  { wawuId: "wawu_musa", fullName: "Musa Danladi", headline: "Welder and trainer", location: "Kaduna", verificationLevel: "verified_user" as const, pieceCount: 3 },
];

export const mockSearchCommunities = [
  { id: "books-and-records", name: "Books and records", memberCount: 312, visibility: "open" as const },
  { id: "traders-of-ogbete", name: "Traders of Ogbete", memberCount: 890, visibility: "open" as const },
  { id: "export-to-ghana", name: "Export to Ghana", memberCount: 204, visibility: "open" as const },
];

export const mockSearchResults: SearchResults = {
  content: searchContent,
  creators: mockSearchCreators,
  communities: mockSearchCommunities,
};

export function mockSearch(query: string): SearchResponse {
  const q = query.trim().toLowerCase();
  if (!q) {
    return { query, results: mockSearchResults };
  }
  const results: SearchResults = {
    content: mockContent.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        c.creator.fullName.toLowerCase().includes(q),
    ),
    creators: mockSearchCreators.filter(
      (c) =>
        c.fullName.toLowerCase().includes(q) ||
        c.headline.toLowerCase().includes(q) ||
        (c.location ?? "").toLowerCase().includes(q),
    ),
    communities: mockSearchCommunities.filter((c) => c.name.toLowerCase().includes(q)),
  };
  return { query, results };
}

/** Stand-in for the client's recent-search history until a backend stores it. */
export const mockRecentSearches = ["cac registration", "ankara pattern", "zainab bello"];

/** Fuzzy fallback shown when a query matches nothing ("Closest things we have"). */
export function mockClosestResults(query: string): ContentPiece[] {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  return mockContent.filter((c) =>
    words.some(
      (w) =>
        c.title.toLowerCase().includes(w) ||
        c.description.toLowerCase().includes(w) ||
        c.creator.fullName.toLowerCase().includes(w),
    ),
  );
}