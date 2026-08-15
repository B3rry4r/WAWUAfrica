import type { ExploreCategory, ExploreCategoryId } from "@/types/explore";
import { EXPLORE_CATEGORIES } from "@/types/explore";
import { getMockCategories, getMockCreators } from "./mocks/explore";

// SEAM: replace with GET /api/hub/explore/categories
export async function getCategories(): Promise<ExploreCategory[]> {
  return getMockCategories();
}

// SEAM: replace with GET /api/hub/explore/creators
export async function getCreators(category?: ExploreCategoryId) {
  return getMockCreators(category);
}

// SEAM: replace with POST /api/hub/creators/:wawuId/follow
export async function toggleFollow(wawuId: string): Promise<boolean> {
  return (await import("./mocks/explore")).toggleMockFollow(wawuId);
}

export { EXPLORE_CATEGORIES };