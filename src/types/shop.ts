/**
 * WAWU Commerce — the creator-equipment storefront.
 *
 * Built 30 Aug 2026 on product-owner brief. Shapes are read off the real
 * backend at WAWU-Hub-API `src/shop/` (service returns + `common/types/
 * shop.type.ts`), not guessed. Dates cross the wire as ISO strings.
 *
 * ── WHAT THIS MVP DOES NOT DO, AND WHY ──────────────────────────────────────
 *   - No "build my setup" recommender. The brief describes one; the product
 *     owner asked for the storefront first and the specialisation later.
 *   - No delivery fee and no courier tracking. Logistics is arranged
 *     physically, off-platform, so `deliveryNaira` is always 0 and a package's
 *     progress is whatever a WAWU operator typed.
 *   - No star rating. The brief's card shows one; there is no review system to
 *     derive it from, and a hardcoded 4.8 is invented social proof on
 *     something people spend real money against. `ratingAvg` is null and the
 *     card renders nothing rather than a fake number.
 *   - No wallet. Card payment through Flutterwave, like everything else here.
 */

/** The eleven aisles from the brief. Mirrors the Prisma `ProductCategory`. */
export type ProductCategory =
  | "audio_music"
  | "video_film"
  | "lighting_studio"
  | "photography"
  | "computing"
  | "art_design"
  | "gaming_streaming"
  | "content_creation"
  | "live_events"
  | "professional"
  | "power_accessories";

/**
 * Aisle labels and the emoji the brief attaches to each.
 *
 * The emoji is part of the requested feel ("Gen-Z, premium, playful") and is
 * decorative — every category card also carries its name in text, and the
 * emoji is `aria-hidden` so a screen reader is not read a picture of a camera.
 */
export const PRODUCT_CATEGORY_LABEL: Record<ProductCategory, string> = {
  audio_music: "Audio & Music",
  video_film: "Video & Film",
  lighting_studio: "Lighting & Studio",
  photography: "Photography",
  computing: "Computing & Creator Tech",
  art_design: "Art, Design & Craft",
  gaming_streaming: "Gaming & Streaming",
  content_creation: "Content Creation",
  live_events: "Live & Events",
  professional: "Professional",
  power_accessories: "Power & Accessories",
};

export const PRODUCT_CATEGORY_EMOJI: Record<ProductCategory, string> = {
  audio_music: "🎵",
  video_film: "🎥",
  lighting_studio: "💡",
  photography: "📸",
  computing: "💻",
  art_design: "🎨",
  gaming_streaming: "🎮",
  content_creation: "📱",
  live_events: "🎤",
  professional: "🧑🏽‍💼",
  power_accessories: "⚡",
};

export const PRODUCT_CATEGORIES = Object.keys(
  PRODUCT_CATEGORY_LABEL,
) as ProductCategory[];

/** One product as a shopper sees it. */
export interface Product {
  id: string;
  name: string;
  /** In the URL. Stable across a rename, so a shared link keeps working. */
  slug: string;
  brand: string | null;
  description: string;
  category: ProductCategory;
  subcategory: string;
  priceNaira: number;
  /** The "was" price, or null when not on offer. Always exceeds priceNaira. */
  compareAtNaira: number | null;
  /** Whether anything is left. The exact count is deliberately not public. */
  inStock: boolean;
  /** A nudge, without saying how few. */
  lowStock: boolean;
  images: string[];
  /** The brief's "WAWU VERIFIED ✓" — WAWU vouching the item is genuine. */
  wawuVerified: boolean;
  /** The brief's "WAWU PICKS" shelf. */
  wawuPick: boolean;
  /** Null until reviews exist. Never render a placeholder here. */
  ratingAvg: number | null;
  ratingCount: number;
}

export interface ProductPage {
  products: Product[];
  total: number;
  currentPage: number;
  nextPage: number | null;
}

export interface ListProductsParams {
  category?: ProductCategory;
  subcategory?: string;
  search?: string;
  /** "Shop by budget" — a ceiling, so it returns everything affordable. */
  maxPriceNaira?: number;
  wawuPick?: boolean;
  page?: number;
  perPage?: number;
}

/* ------------------------------------------------------------------ *
 * The cart — the brief calls it WOW
 * ------------------------------------------------------------------ */

export interface CartLine {
  id: string;
  quantity: number;
  product: Product;
  /** Computed server-side, so the client cannot drift from what is charged. */
  lineTotalNaira: number;
}

export interface Cart {
  items: CartLine[];
  /** Items, not lines — the number on the cart badge. */
  itemCount: number;
  subtotalNaira: number;
  /** Always 0 today: delivery is arranged by hand, off-platform. */
  deliveryNaira: number;
  totalNaira: number;
}

/* ------------------------------------------------------------------ *
 * Orders
 * ------------------------------------------------------------------ */

export type ShopOrderStatus = "pending" | "paid" | "failed" | "cancelled" | "refunded";

/** Where the GOODS are. Moved by a human in the dashboard. */
export type ShopFulfilment = "awaiting_dispatch" | "dispatched" | "delivered";

export const FULFILMENT_LABEL: Record<ShopFulfilment, string> = {
  awaiting_dispatch: "Being packed",
  dispatched: "On its way",
  delivered: "Delivered",
};

export interface ShopOrderItem {
  id: string;
  productId: string;
  /** What it was called AT PURCHASE, not what it is called now. */
  name: string;
  priceNaira: number;
  quantity: number;
  imageUrl: string | null;
}

export interface ShopOrder {
  id: string;
  status: ShopOrderStatus;
  subtotalNaira: number;
  deliveryNaira: number;
  totalNaira: number;

  deliveryName: string;
  deliveryPhone: string;
  deliveryAddress: string;
  deliveryCity: string;
  deliveryState: string;
  deliveryNote: string | null;

  fulfilment: ShopFulfilment;
  dispatchedAt: string | null;
  deliveredAt: string | null;
  /** What a WAWU operator typed: courier and waybill. Not live tracking. */
  trackingNote: string | null;

  items: ShopOrderItem[];
  createdAt: string;
  paidAt: string | null;
}

/** The delivery address, as the checkout form submits it. */
export interface DeliveryDetails {
  deliveryName: string;
  deliveryPhone: string;
  deliveryAddress: string;
  deliveryCity: string;
  deliveryState: string;
  deliveryNote?: string;
}

export interface ShopCheckout {
  orderId: string;
  flutterwaveConfig: {
    txRef: string;
    amount: number;
    currency: string;
    publicKey: string;
  };
}

/** The backend's per-line ceiling. A bulk order is a conversation. */
export const MAX_QUANTITY_PER_LINE = 20;

/**
 * The budget bands for the brief's "shop by budget".
 *
 * Each is a CEILING, not a range: somebody with ₦50,000 wants to see
 * everything they can afford, not only the things near the top of the band.
 */
export const BUDGET_BANDS: ReadonlyArray<{ label: string; maxPriceNaira: number }> = [
  { label: "Under ₦50k", maxPriceNaira: 50_000 },
  { label: "Under ₦150k", maxPriceNaira: 150_000 },
  { label: "Under ₦500k", maxPriceNaira: 500_000 },
  { label: "Under ₦1m", maxPriceNaira: 1_000_000 },
];

/** Nigerian states, for the delivery address. */
export const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue",
  "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT",
  "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi",
  "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo",
  "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara",
] as const;
