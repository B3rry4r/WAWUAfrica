import type { ContentPiece } from "./content";
import type { VerificationState } from "./verification";

export type SearchTab = "all" | "content" | "creators" | "communities";

export interface SearchCreatorResult {
  wawuId: string;
  fullName: string;
  avatarUrl?: string | null;
  headline: string;
  location?: string;
  verification: VerificationState;
  pieceCount: number;
}

export interface SearchCommunityResult {
  id: string;
  name: string;
  memberCount: number;
  visibility: "open" | "private";
}

export interface SearchResults {
  content: ContentPiece[];
  creators: SearchCreatorResult[];
  communities: SearchCommunityResult[];
}

export interface SearchResponse {
  query: string;
  results: SearchResults;
}