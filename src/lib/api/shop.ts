import type {
  Cart,
  DeliveryDetails,
  ListProductsParams,
  Product,
  ProductCategory,
  ProductPage,
  ShopCheckout,
  ShopOrder,
} from "@/types/shop";
import { apiFetch, apiFetchPaginated, isMockModeError } from "./client";
import {
  addToMockCart,
  checkoutMockCart,
  getMockCart,
  getMockOrder,
  getMockOrders,
  getMockProduct,
  getMockProducts,
  getMockSubcategories,
  removeFromMockCart,
  setMockCartQuantity,
  verifyMockShopOrder,
} from "./mocks/shop";

/**
 * WAWU Commerce — `/api/hub/shop/*`.
 *
 * The backend is DONE (WAWU-Hub-API `src/shop/`), so these shapes are read off
 * the real controller rather than a target guess.
 *
 * ── WHAT THE CLIENT NEVER SENDS ────────────────────────────────────────────
 * An amount. Not at checkout, not anywhere. The total is recomputed
 * server-side from live product rows, and the DTO runs under
 * `forbidNonWhitelisted`, so a body carrying `totalNaira` is a 400 before the
 * service is reached.
 *
 * ── FAILURE DISCIPLINE ─────────────────────────────────────────────────────
 * Mock fallback is gated on `isMockModeError` everywhere, as in events.ts. A
 * real refusal — out of stock (409), price moved (409), payment not verified
 * (400) — is rethrown so the screen can say what actually happened. Swallowing
 * a sold-out into fixture data hands somebody a product that does not exist.
 */

function listQuery(params: ListProductsParams): string {
  const q = new URLSearchParams();
  if (params.category) q.set("category", params.category);
  if (params.subcategory) q.set("subcategory", params.subcategory);
  if (params.search) q.set("search", params.search);
  if (params.maxPriceNaira !== undefined) q.set("maxPriceNaira", String(params.maxPriceNaira));
  if (params.wawuPick !== undefined) q.set("wawuPick", String(params.wawuPick));
  if (params.page !== undefined) q.set("page", String(params.page));
  if (params.perPage !== undefined) q.set("perPage", String(params.perPage));
  return q.toString();
}

/** The storefront. Public — a shop a stranger cannot open sells nothing. */
// SEAM: replace with GET /api/hub/shop/products
export async function listProducts(params: ListProductsParams = {}): Promise<ProductPage> {
  try {
    const { data, pagination } = await apiFetchPaginated<Product>(
      `/api/hub/shop/products?${listQuery(params)}`,
      { authed: true },
    );
    return {
      products: data,
      total: pagination.total,
      currentPage: pagination.currentPage,
      nextPage: pagination.nextPage,
    };
  } catch (e) {
    if (!isMockModeError(e)) throw e;
    return getMockProducts(params);
  }
}

/** One product, by the slug in its URL. */
// SEAM: replace with GET /api/hub/shop/:slug
export async function getProduct(slug: string): Promise<Product> {
  try {
    return await apiFetch<Product>(`/api/hub/shop/${slug}`, { authed: true });
  } catch (e) {
    if (!isMockModeError(e)) throw e;
    return getMockProduct(slug);
  }
}

/**
 * The subcategories in an aisle that actually have stock.
 *
 * Derived from live stock rather than hardcoded from the brief: a filter chip
 * that offers "Teleprompters" and returns nothing is a dead end.
 */
// SEAM: replace with GET /api/hub/shop/categories/:category/subcategories
export async function listSubcategories(category: ProductCategory): Promise<string[]> {
  try {
    return await apiFetch<string[]>(
      `/api/hub/shop/categories/${category}/subcategories`,
      { authed: true },
    );
  } catch (e) {
    if (!isMockModeError(e)) throw e;
    return getMockSubcategories(category);
  }
}

/* ------------------------------------------------------------------ *
 * The cart — the brief calls it WOW
 * ------------------------------------------------------------------ */

// SEAM: replace with GET /api/hub/shop/cart
export async function getCart(): Promise<Cart> {
  try {
    return await apiFetch<Cart>(`/api/hub/shop/cart`, { authed: true });
  } catch (e) {
    if (!isMockModeError(e)) throw e;
    return getMockCart();
  }
}

/** Adding the same product twice raises the quantity, server-side. */
// SEAM: replace with POST /api/hub/shop/cart
export async function addToCart(productId: string, quantity = 1): Promise<Cart> {
  try {
    return await apiFetch<Cart>(`/api/hub/shop/cart`, {
      method: "POST",
      authed: true,
      body: { productId, quantity },
    });
  } catch (e) {
    if (!isMockModeError(e)) throw e;
    return addToMockCart(productId, quantity);
  }
}

/** Zero removes the line. */
// SEAM: replace with PATCH /api/hub/shop/cart/:productId
export async function setCartQuantity(productId: string, quantity: number): Promise<Cart> {
  try {
    return await apiFetch<Cart>(`/api/hub/shop/cart/${productId}`, {
      method: "PATCH",
      authed: true,
      body: { quantity },
    });
  } catch (e) {
    if (!isMockModeError(e)) throw e;
    return setMockCartQuantity(productId, quantity);
  }
}

// SEAM: replace with DELETE /api/hub/shop/cart/:productId
export async function removeFromCart(productId: string): Promise<Cart> {
  try {
    return await apiFetch<Cart>(`/api/hub/shop/cart/${productId}`, {
      method: "DELETE",
      authed: true,
    });
  } catch (e) {
    if (!isMockModeError(e)) throw e;
    return removeFromMockCart(productId);
  }
}

/* ------------------------------------------------------------------ *
 * Checkout
 * ------------------------------------------------------------------ */

/**
 * Open an order and a charge.
 *
 * Nothing is charged here and NO STOCK MOVES — the order is pending until the
 * money is confirmed. The cart survives an abandoned checkout, so a declined
 * card does not also lose somebody's basket.
 */
// SEAM: replace with POST /api/hub/shop/checkout
export async function checkout(delivery: DeliveryDetails): Promise<ShopCheckout> {
  try {
    return await apiFetch<ShopCheckout>(`/api/hub/shop/checkout`, {
      method: "POST",
      authed: true,
      body: delivery,
    });
  } catch (e) {
    if (!isMockModeError(e)) throw e;
    return checkoutMockCart(delivery);
  }
}

/**
 * Confirm the money, claim the stock.
 *
 * Called only AFTER the charge completed on Flutterwave's own surface.
 * Idempotent server-side — the browser's verify and the webhook can settle the
 * same charge without deducting stock twice — so a screen may retry it safely.
 */
// SEAM: replace with POST /api/hub/shop/orders/:orderId/verify
export async function verifyShopOrder(
  orderId: string,
  charge: { transaction_id: string; tx_ref: string },
): Promise<ShopOrder> {
  try {
    return await apiFetch<ShopOrder>(`/api/hub/shop/orders/${orderId}/verify`, {
      method: "POST",
      authed: true,
      body: charge,
    });
  } catch (e) {
    if (!isMockModeError(e)) throw e;
    return verifyMockShopOrder(orderId);
  }
}

// SEAM: replace with GET /api/hub/shop/orders
export async function myShopOrders(): Promise<ShopOrder[]> {
  try {
    return await apiFetch<ShopOrder[]>(`/api/hub/shop/orders`, { authed: true });
  } catch (e) {
    if (!isMockModeError(e)) throw e;
    return getMockOrders();
  }
}

// SEAM: replace with GET /api/hub/shop/orders/:orderId
export async function getShopOrder(orderId: string): Promise<ShopOrder> {
  try {
    return await apiFetch<ShopOrder>(`/api/hub/shop/orders/${orderId}`, { authed: true });
  } catch (e) {
    if (!isMockModeError(e)) throw e;
    return getMockOrder(orderId);
  }
}
