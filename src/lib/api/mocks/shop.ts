import type {
  Cart,
  CartLine,
  DeliveryDetails,
  ListProductsParams,
  Product,
  ProductCategory,
  ProductPage,
  ShopCheckout,
  ShopOrder,
} from "@/types/shop";
import { MAX_QUANTITY_PER_LINE } from "@/types/shop";

/**
 * DEV FIXTURES for WAWU Commerce. Replaced wholesale by the real backend —
 * every read in ../shop.ts is tagged with the endpoint that supersedes it.
 *
 * The stock levels here are chosen to reach the states that are hard to
 * arrange on demand and easy to get wrong: something SOLD OUT, something with
 * one left (`lowStock`), and something on offer with a real "was" price. A
 * fixture set where everything is plentiful lets a grid ship having only been
 * looked at in its best state.
 *
 * NOTHING HERE HAS A RATING, deliberately. There is no review system, and a
 * fixture that invented one would make the card look finished while shipping
 * fabricated social proof.
 */

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Placeholder imagery. A data-URI gradient rather than a remote URL: the
 * storefront's whole design is large imagery, and a mock that 404s every
 * image makes the grid look broken instead of unfinished.
 */
function swatch(from: string, to: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs><rect width="800" height="800" fill="url(#g)"/></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const MOCK_PRODUCTS: Product[] = [
  {
    id: "pr-nt-usb",
    name: "Rode NT-USB Studio Microphone",
    slug: "rode-nt-usb-studio-microphone",
    brand: "Rode",
    description:
      "A studio condenser that plugs straight into a laptop. Comes with a pop shield and a desk stand, so it is a complete setup out of the box rather than the first of four purchases.",
    category: "audio_music",
    subcategory: "Microphones",
    priceNaira: 185_000,
    compareAtNaira: 210_000,
    inStock: true,
    lowStock: false,
    images: [swatch("#6d28d9", "#c026d3"), swatch("#7c3aed", "#a21caf")],
    wawuVerified: true,
    wawuPick: true,
    ratingAvg: null,
    ratingCount: 0,
  },
  {
    id: "pr-fx30",
    name: "Sony FX30 Cinema Camera Body",
    slug: "sony-fx30-cinema-camera-body",
    brand: "Sony",
    description:
      "Super 35 sensor, 10-bit internal recording, and the same colour science as the FX3. Body only — pair it with a lens from the same aisle.",
    category: "video_film",
    subcategory: "Cameras",
    priceNaira: 2_950_000,
    compareAtNaira: null,
    inStock: true,
    lowStock: true,
    images: [swatch("#0f766e", "#0891b2")],
    wawuVerified: true,
    wawuPick: false,
    ratingAvg: null,
    ratingCount: 0,
  },
  {
    id: "pr-ring-18",
    name: "18-inch LED Ring Light with Stand",
    slug: "18-inch-led-ring-light-with-stand",
    brand: "Neewer",
    description:
      "Bi-colour, dimmable to 1%, with a phone cradle and a 2-metre stand. The light most content shot in a bedroom actually needs.",
    category: "lighting_studio",
    subcategory: "Ring lights",
    priceNaira: 78_000,
    compareAtNaira: 95_000,
    inStock: true,
    lowStock: false,
    images: [swatch("#b45309", "#f59e0b")],
    wawuVerified: true,
    wawuPick: true,
    ratingAvg: null,
    ratingCount: 0,
  },
  {
    id: "pr-dji-mic",
    name: "DJI Mic 2 Wireless Kit",
    slug: "dji-mic-2-wireless-kit",
    brand: "DJI",
    description:
      "Two transmitters, one receiver, and a charging case. Internal recording on the transmitter means a dropout does not cost you the take.",
    category: "content_creation",
    subcategory: "Wireless microphones",
    priceNaira: 430_000,
    compareAtNaira: null,
    inStock: false,
    lowStock: false,
    images: [swatch("#1e3a8a", "#3b82f6")],
    wawuVerified: true,
    wawuPick: false,
    ratingAvg: null,
    ratingCount: 0,
  },
  {
    id: "pr-macbook",
    name: 'MacBook Pro 14" M4 Pro, 24GB',
    slug: "macbook-pro-14-m4-pro-24gb",
    brand: "Apple",
    description:
      "The machine most of this catalogue plugs into. 24GB of unified memory is the point at which a timeline with four 4K layers stops stuttering.",
    category: "computing",
    subcategory: "Laptops",
    priceNaira: 4_250_000,
    compareAtNaira: null,
    inStock: true,
    lowStock: false,
    images: [swatch("#334155", "#64748b")],
    wawuVerified: true,
    wawuPick: true,
    ratingAvg: null,
    ratingCount: 0,
  },
  {
    id: "pr-elgato",
    name: "Elgato Stream Deck MK.2",
    slug: "elgato-stream-deck-mk-2",
    brand: "Elgato",
    description:
      "Fifteen keys that do whatever you tell them. Mostly bought to stop a live stream being a series of frantic alt-tabs.",
    category: "gaming_streaming",
    subcategory: "Streaming accessories",
    priceNaira: 165_000,
    compareAtNaira: null,
    inStock: true,
    lowStock: true,
    images: [swatch("#4c1d95", "#7e22ce")],
    wawuVerified: false,
    wawuPick: false,
    ratingAvg: null,
    ratingCount: 0,
  },
  {
    id: "pr-wacom",
    name: "Wacom Intuos Pro Medium",
    slug: "wacom-intuos-pro-medium",
    brand: "Wacom",
    description:
      "8,192 levels of pressure and a surface that feels like paper rather than glass. The tablet illustrators stop replacing.",
    category: "art_design",
    subcategory: "Drawing tablets",
    priceNaira: 385_000,
    compareAtNaira: 420_000,
    inStock: true,
    lowStock: false,
    images: [swatch("#831843", "#db2777")],
    wawuVerified: true,
    wawuPick: false,
    ratingAvg: null,
    ratingCount: 0,
  },
  {
    id: "pr-jackery",
    name: "Jackery Explorer 500 Power Station",
    slug: "jackery-explorer-500-power-station",
    brand: "Jackery",
    description:
      "518Wh, which is a full shoot day of lights and a laptop. Bought here for the reason everything in this aisle is bought here.",
    category: "power_accessories",
    subcategory: "Power stations",
    priceNaira: 690_000,
    compareAtNaira: null,
    inStock: true,
    lowStock: false,
    images: [swatch("#166534", "#65a30d")],
    wawuVerified: true,
    wawuPick: true,
    ratingAvg: null,
    ratingCount: 0,
  },
];

// SEAM: replace with GET /api/hub/shop/products
export async function getMockProducts(params: ListProductsParams): Promise<ProductPage> {
  await delay(280);
  const perPage = params.perPage ?? 24;
  const page = params.page ?? 1;
  const term = params.search?.toLowerCase().trim();

  const matched = MOCK_PRODUCTS.filter(
    (p) =>
      (params.category === undefined || p.category === params.category) &&
      (params.subcategory === undefined || p.subcategory === params.subcategory) &&
      (params.wawuPick === undefined || p.wawuPick === params.wawuPick) &&
      (params.maxPriceNaira === undefined || p.priceNaira <= params.maxPriceNaira) &&
      (!term ||
        p.name.toLowerCase().includes(term) ||
        (p.brand ?? "").toLowerCase().includes(term) ||
        p.subcategory.toLowerCase().includes(term)),
    // Mirrors the backend's order: in stock first, so a grid never opens on a
    // row of things nobody can buy.
  ).sort((a, b) => Number(b.inStock) - Number(a.inStock) || Number(b.wawuPick) - Number(a.wawuPick));

  const start = (page - 1) * perPage;
  const slice = matched.slice(start, start + perPage);
  return {
    products: slice,
    total: matched.length,
    currentPage: page,
    nextPage: start + perPage < matched.length ? page + 1 : null,
  };
}

// SEAM: replace with GET /api/hub/shop/:slug
export async function getMockProduct(slug: string): Promise<Product> {
  await delay(240);
  const found = MOCK_PRODUCTS.find((p) => p.slug === slug);
  if (!found) throw new Error("Product not found");
  return found;
}

// SEAM: replace with GET /api/hub/shop/categories/:category/subcategories
export async function getMockSubcategories(category: ProductCategory): Promise<string[]> {
  await delay(180);
  return [...new Set(MOCK_PRODUCTS.filter((p) => p.category === category).map((p) => p.subcategory))];
}

/* ---- cart ---- */

const CART = new Map<string, number>();

function buildCart(): Cart {
  const items: CartLine[] = [];
  for (const [productId, quantity] of CART) {
    const product = MOCK_PRODUCTS.find((p) => p.id === productId);
    if (!product) continue;
    items.push({
      id: `cl-${productId}`,
      quantity,
      product,
      lineTotalNaira: product.inStock ? product.priceNaira * quantity : 0,
    });
  }
  const subtotalNaira = items.reduce((n, i) => n + i.lineTotalNaira, 0);
  return {
    items,
    itemCount: items.reduce((n, i) => n + i.quantity, 0),
    subtotalNaira,
    // Delivery is arranged by hand, off-platform. Always zero.
    deliveryNaira: 0,
    totalNaira: subtotalNaira,
  };
}

// SEAM: replace with GET /api/hub/shop/cart
export async function getMockCart(): Promise<Cart> {
  await delay(200);
  return buildCart();
}

// SEAM: replace with POST /api/hub/shop/cart
export async function addToMockCart(productId: string, quantity: number): Promise<Cart> {
  await delay(260);
  const product = MOCK_PRODUCTS.find((p) => p.id === productId);
  if (!product) throw new Error("Product not found");
  if (!product.inStock) throw new Error("This item is out of stock.");
  const next = Math.min((CART.get(productId) ?? 0) + quantity, MAX_QUANTITY_PER_LINE);
  CART.set(productId, next);
  return buildCart();
}

// SEAM: replace with PATCH /api/hub/shop/cart/:productId
export async function setMockCartQuantity(productId: string, quantity: number): Promise<Cart> {
  await delay(200);
  if (quantity <= 0) CART.delete(productId);
  else CART.set(productId, Math.min(quantity, MAX_QUANTITY_PER_LINE));
  return buildCart();
}

// SEAM: replace with DELETE /api/hub/shop/cart/:productId
export async function removeFromMockCart(productId: string): Promise<Cart> {
  await delay(200);
  CART.delete(productId);
  return buildCart();
}

/* ---- orders ---- */

const ORDERS: ShopOrder[] = [];
let pendingDelivery: DeliveryDetails | null = null;

// SEAM: replace with POST /api/hub/shop/checkout
export async function checkoutMockCart(delivery: DeliveryDetails): Promise<ShopCheckout> {
  await delay(420);
  const cart = buildCart();
  if (cart.items.length === 0) throw new Error("Your cart is empty.");
  pendingDelivery = delivery;
  const orderId = `so-${Date.now()}`;
  return {
    orderId,
    flutterwaveConfig: {
      txRef: `mock-shop-${orderId}`,
      amount: cart.totalNaira,
      currency: "NGN",
      publicKey: "FLWPUBK_TEST-mock0000000000000000000000-X",
    },
  };
}

// SEAM: replace with POST /api/hub/shop/orders/:orderId/verify
export async function verifyMockShopOrder(orderId: string): Promise<ShopOrder> {
  await delay(600);
  const cart = buildCart();
  const delivery = pendingDelivery;
  const order: ShopOrder = {
    id: orderId,
    status: "paid",
    subtotalNaira: cart.subtotalNaira,
    deliveryNaira: 0,
    totalNaira: cart.totalNaira,
    deliveryName: delivery?.deliveryName ?? "",
    deliveryPhone: delivery?.deliveryPhone ?? "",
    deliveryAddress: delivery?.deliveryAddress ?? "",
    deliveryCity: delivery?.deliveryCity ?? "",
    deliveryState: delivery?.deliveryState ?? "",
    deliveryNote: delivery?.deliveryNote ?? null,
    fulfilment: "awaiting_dispatch",
    dispatchedAt: null,
    deliveredAt: null,
    trackingNote: null,
    items: cart.items.map((i) => ({
      id: `oi-${i.product.id}`,
      productId: i.product.id,
      // Snapshotted, exactly as the backend does it.
      name: i.product.name,
      priceNaira: i.product.priceNaira,
      quantity: i.quantity,
      imageUrl: i.product.images[0] ?? null,
    })),
    createdAt: new Date().toISOString(),
    paidAt: new Date().toISOString(),
  };
  ORDERS.unshift(order);
  CART.clear();
  pendingDelivery = null;
  return order;
}

// SEAM: replace with GET /api/hub/shop/orders
export async function getMockOrders(): Promise<ShopOrder[]> {
  await delay(280);
  if (ORDERS.length === 0) return [SEEDED_ORDER];
  return [...ORDERS, SEEDED_ORDER];
}

// SEAM: replace with GET /api/hub/shop/orders/:orderId
export async function getMockOrder(orderId: string): Promise<ShopOrder> {
  await delay(240);
  const found = [...ORDERS, SEEDED_ORDER].find((o) => o.id === orderId);
  if (!found) throw new Error("Order not found");
  return found;
}

/**
 * One order already on its way, so the order screen has something in a state
 * other than "just bought" without anybody having to wait for a WAWU operator
 * to press dispatch.
 */
const SEEDED_ORDER: ShopOrder = {
  id: "so-seeded-1",
  status: "paid",
  subtotalNaira: 263_000,
  deliveryNaira: 0,
  totalNaira: 263_000,
  deliveryName: "Adaeze Okonkwo",
  deliveryPhone: "+234 801 234 5678",
  deliveryAddress: "14 Water Corporation Road, Victoria Island",
  deliveryCity: "Lagos",
  deliveryState: "Lagos",
  deliveryNote: "Gate is behind the pharmacy.",
  fulfilment: "dispatched",
  dispatchedAt: new Date(Date.now() - 36 * 3600_000).toISOString(),
  deliveredAt: null,
  trackingNote: "Sent with GIG Logistics, waybill 88213445.",
  items: [
    {
      id: "oi-seed-1",
      productId: "pr-nt-usb",
      name: "Rode NT-USB Studio Microphone",
      priceNaira: 185_000,
      quantity: 1,
      imageUrl: swatch("#6d28d9", "#c026d3"),
    },
    {
      id: "oi-seed-2",
      productId: "pr-ring-18",
      name: "18-inch LED Ring Light with Stand",
      priceNaira: 78_000,
      quantity: 1,
      imageUrl: swatch("#b45309", "#f59e0b"),
    },
  ],
  createdAt: new Date(Date.now() - 48 * 3600_000).toISOString(),
  paidAt: new Date(Date.now() - 48 * 3600_000).toISOString(),
};
