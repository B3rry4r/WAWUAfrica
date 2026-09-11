import type { CreatorDiscovery, ExploreCategory, ExploreCategoryId } from "@/types/explore";
import type { VerificationLevel } from "@/types/account";
import { EXPLORE_CATEGORIES } from "@/types/explore";
import { apiFetch, isMockModeError } from "./client";
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

/** One row of GET /api/hub/creators. */
interface RealCreatorDiscoveryItem {
  wawuId: string;
  name: string;
  handle: string | null;
  avatarUrl: string | null;
  field: string | null;
  pieceCount: number;
  verification: VerificationLevel;
  following: boolean;
}

/**
 * Real creators, from `GET /api/hub/creators`.
 *
 * This used to return mock data, because no discovery endpoint existed:
 * `/users/:wawuId/public-profile` is a single read and `/search` requires a
 * non-empty `q`, so there was nothing to list from. The mock people had
 * fabricated ids ("wawu-adaeze") that matched nothing in the database, which
 * meant every profile link and every follow on Explore was broken by
 * construction.
 *
 * ONE THING TO KNOW ABOUT `category`. The backend filters it against
 * `UserProfile.interests`, and three different vocabularies currently land in
 * that column: these 25 explore category ids (`agriculture_food`), the profile
 * editor's own tags, and free-text from the seed. Filtering by an explore
 * category therefore only matches profiles that actually chose one. The
 * profile editor now offers these categories, so it becomes true as people
 * edit their profiles — it is not retroactive.
 */
export async function getCreators(category?: ExploreCategoryId): Promise<CreatorDiscovery[]> {
  const query = category ? `?category=${encodeURIComponent(category)}&perPage=50` : "?perPage=50";
  try {
    // Explore is a Server Component (page.tsx's `dynamic = "force-dynamic"`
    // already says "don't cache this route"), but that route-level flag only
    // protects requests that actually run through it. Next.js's fetch data
    // cache is otherwise separate from the page/CDN cache and persists
    // ACROSS deploys until something invalidates it — so a build that ever
    // rendered this without the flag (or a subtly different one) can leave
    // every future visitor, incognito included, stuck on that one frozen
    // response. `cache: "no-store"` here means this specific call can never
    // be served from that cache, independent of what the route config is.
    const rows = await apiFetch<RealCreatorDiscoveryItem[]>(`/api/hub/creators${query}`, {
      cache: "no-store",
    });
    return rows.map((r) => ({
      wawuId: r.wawuId,
      name: r.name,
      handle: r.handle,
      avatarUrl: r.avatarUrl,
      // `field` is the creator's first interest, and a creator who has listed
      // none has no field. Empty string rather than a placeholder: the card
      // renders "field · N pieces", and inventing a category for somebody is
      // worse than the separator looking bare.
      field: r.field ?? "",
      pieceCount: r.pieceCount,
      verification: r.verification,
      following: r.following,
    }));
  } catch (e) {
    if (!isMockModeError(e)) throw e;
    return getMockCreators(category);
  }
}

/**
 * Real backend (src/follow-relationship/follow-relationship.controller.ts):
 * POST /api/hub/creators/:wawuId/follow and DELETE .../follow — two separate
 * endpoints, no single toggle route. `currentlyFollowing` (the state before
 * this call) picks which one to call; see the FollowButton.tsx call-site fix
 * required by this signature change.
 *
 * The ids reaching this are now REAL. Explore's creator list used to be mock
 * data with fabricated wawuIds ("wawu-adaeze") that existed nowhere in the
 * database, so every follow from that screen 404d by construction; it reads
 * `GET /api/hub/creators` now, so the target of a follow is a real account.
 *
 * The mock fallback stays for genuinely-no-backend mode only (isMockModeError).
 * A real 404 or error must still propagate so FollowButton's rollback
 * (`.catch(() => setFollowing(!next))`) fires, rather than the button
 * reporting a follow that did not happen.
 */
export async function toggleFollow(wawuId: string, currentlyFollowing: boolean): Promise<boolean> {
  try {
    const res = await apiFetch<{ following: boolean }>(`/api/hub/creators/${wawuId}/follow`, {
      method: currentlyFollowing ? "DELETE" : "POST",
      authed: true,
    });
    return res.following;
  } catch (e) {
    if (!isMockModeError(e)) throw e;
    return toggleMockFollow(wawuId);
  }
}

export { EXPLORE_CATEGORIES };
