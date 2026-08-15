import type { ExploreCategory, ExploreCategoryId } from "@/types/explore";
import { EXPLORE_CATEGORIES } from "@/types/explore";
import { getMockCategories, getMockCreators } from "./mocks/explore";

export async function getCategories(): Promise<ExploreCategory[]> {
  return getMockCategories();
}

export async function getCreators(category?: ExploreCategoryId) {
  return getMockCreators(category);
}

export async function toggleFollow(wawuId: string): Promise<boolean> {
  return (await import("./mocks/explore")).toggleMockFollow(wawuId);
}

export { EXPLORE_CATEGORIES };