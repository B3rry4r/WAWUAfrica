/**
 * WAWUBasket and WAWUBeauty are SEPARATE WAWU APPS. This app surfaces what is
 * listed there and hands over — payment and delivery happen in the other app.
 * Never model a cart, a checkout, or an order here.
 */
export type ShopId = "basket" | "beauty";

export interface Shop {
  id: ShopId;
  name: string;
  tagline: string;
  /** e.g. "4,120 items" / "890 services" */
  stat: string;
  categories: string[];
}

export interface MarketplaceItem {
  id: string;
  shop: ShopId;
  title: string;
  /** Seller display name. Beauty listings append a location. */
  seller: string;
  location?: string;
  category: string;
  /** Integer Naira. */
  price: number;
}

export interface MarketplaceProduct extends MarketplaceItem {
  description: string;
  /** Short facts shown as rows under the description. */
  facts: string[];
  deliveryNote?: string;
}

export interface MarketplaceSearchResults {
  query: string;
  basket: MarketplaceItem[];
  beauty: MarketplaceItem[];
  /** WAWU's own results, shown after the shop results. */
  alsoOnWawu: { id: string; title: string; subtitle: string; href: string }[];
}
