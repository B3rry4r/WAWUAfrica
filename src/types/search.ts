import type { ContentPiece } from "./content";
import type { VerificationLevel } from "./account";

export type SearchTab = "all" | "content" | "creators" | "communities";

export interface SearchCreatorResult {
  wawuId: string;
  fullName: string;
  avatarUrl?: string | null;
  headline: string;
  location?: string;
  verificationLevel: VerificationLevel;
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