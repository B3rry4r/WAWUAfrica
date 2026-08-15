import type { VerificationLevel } from "./account";

/** The eleven Explore categories (WAWU Explore design). */
export type ExploreCategoryId =
  | "business"
  | "trade"
  | "finance"
  | "entertainment"
  | "career"
  | "education"
  | "agriculture"
  | "health"
  | "technology"
  | "creative_arts"
  | "culture";

export interface ExploreCategory {
  id: ExploreCategoryId;
  name: string;
}

export const EXPLORE_CATEGORIES: ExploreCategory[] = [
  { id: "business", name: "Business" },
  { id: "trade", name: "Trade" },
  { id: "finance", name: "Finance" },
  { id: "entertainment", name: "Entertainment" },
  { id: "career", name: "Career" },
  { id: "education", name: "Education" },
  { id: "agriculture", name: "Agriculture" },
  { id: "health", name: "Health" },
  { id: "technology", name: "Technology" },
  { id: "creative_arts", name: "Creative Arts" },
  { id: "culture", name: "Culture" },
];

export interface CreatorDiscovery {
  wawuId: string;
  name: string;
  field: string;
  /** Number of published content pieces. */
  pieceCount: number;
  verification?: VerificationLevel;
  following: boolean;
}

export interface Shop {
  id: "basket" | "beauty";
  name: string;
  tagline: string;
  /** e.g. "4,120 items". Handoff copy — the commerce engine is never rebuilt. */
  stat: string;
  icon: string;
}