import type { ExploreCategory, ExploreCategoryId } from "@/types/explore";
import { EXPLORE_CATEGORIES } from "@/types/explore";
import { apiFetch } from "./client";
import { getMockCategories, getMockCreators, toggleMockFollow } from "./mocks/explore";

/**
 * Categories are a static, app-defined taxonomy (design-fixed list of 11),
 * not a Prisma model or a discoverable backend resource — confirmed no
 * `/explore/*` controller exists anywhere in WAWU-Hub-API (grepped every
 * `@Controller` in src/). This is intentional, not a gap: return the same
 * constant the mock returned, just without the network round trip.
 */
export async function getCategories(): Promise<ExploreCategory[]> {
  return EXPLORE_CATEGORIES;
}

/**
 * GAP (genuine, not a wiring miss): there is no backend endpoint to list or
 * discover creators, filtered by category or otherwise. UserProfileController
 * (src/user-profile/user-profile.controller.ts) only exposes `GET /users/me`
 * and `GET /users/:wawuId/public-profile` — both single-profile reads, never
 * a collection. SearchResponseController's `tab=creators` can't stand in for
 * this either: `q` is required and non-empty, and searchCreators() only
 * ILIKE-matches `handle`/`bio` substrings — there is no `interests`/category
 * predicate, so passing a category name as `q` would silently return wrong
 * results (a creator whose bio happens to mention the word), not a real
 * filter. Left on mock data until a real discovery endpoint exists.
 */
export async function getCreators(category?: ExploreCategoryId) {
  return getMockCreators(category);
}

/**
 * Real backend (src/follow-relationship/follow-relationship.controller.ts):
 * POST /api/hub/creators/:wawuId/follow and DELETE .../follow — two separate
 * endpoints, no single toggle route. `currentlyFollowing` (the state before
 * this call) picks which one to call; see the FollowButton.tsx call-site fix
 * required by this signature change.
 */
export async function toggleFollow(wawuId: string, currentlyFollowing: boolean): Promise<boolean> {
  try {
    const res = await apiFetch<{ following: boolean }>(`/api/hub/creators/${wawuId}/follow`, {
      method: currentlyFollowing ? "DELETE" : "POST",
      authed: true,
    });
    return res.following;
  } catch {
    return toggleMockFollow(wawuId);
  }
}

export { EXPLORE_CATEGORIES };
