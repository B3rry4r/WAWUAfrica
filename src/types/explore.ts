import type { VerificationLevel } from "./account";
import { CATEGORIES, type Category, type CategoryId } from "@/lib/categories";

/**
 * Explore uses the app-wide taxonomy in src/lib/categories.ts. It is
 * deliberately not its own list: a category you can browse but cannot publish
 * into is a dead end, so discovery and the create flow read the same 25.
 */
export type ExploreCategoryId = CategoryId;
export type ExploreCategory = Category;

export const EXPLORE_CATEGORIES: ExploreCategory[] = CATEGORIES;

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