import type {
  MarketplaceItem,
  MarketplaceProduct,
  MarketplaceSearchResults,
  Shop,
  ShopId,
} from "@/types/marketplace";
import { delay } from "./client";
import { ALSO_ON_WAWU, MARKETPLACE_ITEMS, SHOPS } from "./mocks/marketplace";

/**
 * Read-only surface over WAWUBasket and WAWUBeauty. Those are separate apps —
 * there is deliberately no cart, checkout, or order call here. The user is
 * handed over at the product page.
 */

// SEAM: replace with GET /api/hub/marketplace/shops
export async function getShops(): Promise<Shop[]> {
  await delay(120);
  return [SHOPS.basket, SHOPS.beauty];
}

// SEAM: replace with GET /api/hub/marketplace/shops/:shop
export async function getShop(shop: ShopId): Promise<Shop> {
  await delay(100);
  return SHOPS[shop];
}

// SEAM: replace with GET /api/hub/marketplace/:shop/items
export async function getShopItems(
  shop: ShopId,
  category = "All",
): Promise<MarketplaceItem[]> {
  await delay(180);
  return MARKETPLACE_ITEMS.filter(
    (i) => i.shop === shop && (category === "All" || i.category === category),
  );
}

// SEAM: replace with GET /api/hub/marketplace/:shop/items/:id
export async function getProduct(
  shop: ShopId,
  id: string,
): Promise<MarketplaceProduct | undefined> {
  await delay(150);
  return MARKETPLACE_ITEMS.find((i) => i.shop === shop && i.id === id);
}

// SEAM: replace with GET /api/hub/marketplace/search
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
