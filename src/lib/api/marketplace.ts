import type {
  MarketplaceItem,
  MarketplaceProduct,
  MarketplaceSearchResults,
  Shop,
  ShopId,
} from "@/types/marketplace";
import { apiFetch, delay } from "./client";
import { ALSO_ON_WAWU, MARKETPLACE_ITEMS, SHOPS } from "./mocks/marketplace";

/**
 * Read-only surface over WAWUBasket and WAWUBeauty. Those are separate apps —
 * there is deliberately no cart, checkout, or order call here. The user is
 * handed over at the product page.
 *
 * Per .pipeline/supersedes.json S-5: this backend does NOT own the
 * WAWUBasket/WAWUBeauty product catalog (CLAUDE.md non-negotiable — never
 * rebuild their commerce engine). Everything below that reads Shop/item/
 * product/search data stays on mocks, SEAM-tagged as external-integration,
 * out of scope for this backend. Only the save/bookmark functions at the
 * bottom of this file call the real backend — MarketplaceSave is the one
 * marketplace resource this backend legitimately owns
 * (/workspace/projects/WAWU-Hub-API/src/marketplace-save/).
 */

// SEAM: external WAWUBasket/WAWUBeauty integration, out of scope for this backend (S-5) — stays on mocks
export async function getShops(): Promise<Shop[]> {
  await delay(120);
  return [SHOPS.basket, SHOPS.beauty];
}

// SEAM: external WAWUBasket/WAWUBeauty integration, out of scope for this backend (S-5) — stays on mocks
export async function getShop(shop: ShopId): Promise<Shop> {
  await delay(100);
  return SHOPS[shop];
}

// SEAM: external WAWUBasket/WAWUBeauty integration, out of scope for this backend (S-5) — stays on mocks
export async function getShopItems(
  shop: ShopId,
  category = "All",
): Promise<MarketplaceItem[]> {
  await delay(180);
  return MARKETPLACE_ITEMS.filter(
    (i) => i.shop === shop && (category === "All" || i.category === category),
  );
}

// SEAM: external WAWUBasket/WAWUBeauty integration, out of scope for this backend (S-5) — stays on mocks
export async function getProduct(
  shop: ShopId,
  id: string,
): Promise<MarketplaceProduct | undefined> {
  await delay(150);
  return MARKETPLACE_ITEMS.find((i) => i.shop === shop && i.id === id);
}

// SEAM: external WAWUBasket/WAWUBeauty integration, out of scope for this backend (S-5) — stays on mocks
export async function searchMarketplace(
  query: string,
): Promise<MarketplaceSearchResults> {
  await delay(220);
  const q = query.trim().toLowerCase();
  const match = (i: MarketplaceItem) =>
    !q ||
    i.title.toLowerCase().includes(q) ||
    i.seller.toLowerCase().includes(q) ||
    i.category.toLowerCase().includes(q);

  return {
    query,
    basket: MARKETPLACE_ITEMS.filter((i) => i.shop === "basket" && match(i)),
    beauty: MARKETPLACE_ITEMS.filter((i) => i.shop === "beauty" && match(i)),
    alsoOnWawu: q ? ALSO_ON_WAWU : [],
  };
}

/**
 * Where a buy action sends the user. The destination app owns payment and
 * delivery; the WAWU sign-in carries over.
 */
export function shopHandoffUrl(shop: ShopId, productId?: string): string {
  const base =
    shop === "basket" ? "https://basket.wawuafrica.com" : "https://beauty.wawuafrica.com";
  return productId ? `${base}/p/${productId}` : base;
}

/**
 * A WAWU-side bookmark referencing an external (WAWUBasket/WAWUBeauty)
 * productId by string — no product data duplicated. Matches
 * MarketplaceSave in /workspace/projects/WAWU-Hub-API/src/common/types
 * (Prisma model), returned verbatim by POST /marketplace/saves.
 */
export interface MarketplaceSave {
  id: string;
  userWawuId: string;
  productId: string;
  shop: ShopId;
  /** ISO timestamp. */
  savedAt: string;
}

// SEAM: replace with POST /api/hub/marketplace/saves
/**
 * Bookmark an external marketplace product. Idempotent on the backend — a
 * repeat save for the same (user, productId, shop) returns the existing row
 * rather than erroring, so this is safe to call as a plain "save" toggle-on.
 */
export async function saveMarketplaceItem(
  shop: ShopId,
  productId: string,
): Promise<MarketplaceSave> {
  return await apiFetch<MarketplaceSave>("/api/hub/marketplace/saves", {
    method: "POST",
    authed: true,
    body: { productId, shop },
  });
}

// SEAM: replace with DELETE /api/hub/marketplace/saves/:productId
/**
 * Remove a bookmark. The backend route only carries :productId (no shop) —
 * it removes any save matching that productId for this user, since a given
 * opaque productId is expected to belong to exactly one shop in practice.
 * A real 404 (item was never saved) is a real rejection and must reach the
 * caller as one, not be swallowed into a silent no-op.
 */
export async function unsaveMarketplaceItem(productId: string): Promise<void> {
  await apiFetch<void>(`/api/hub/marketplace/saves/${productId}`, {
    method: "DELETE",
    authed: true,
  });
}
