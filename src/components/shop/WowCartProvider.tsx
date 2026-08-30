"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { addToCart as apiAdd, getCart } from "@/lib/api/shop";
import { describeError } from "@/lib/api/errors";
import { useSession } from "@/lib/auth/session-provider";
import type { Cart, Product } from "@/types/shop";

/**
 * The WOW cart, shared across the storefront.
 *
 * ── WHY A PROVIDER AND NOT A FETCH PER SCREEN ──────────────────────────────
 * The badge in the shop header and the cart page have to agree. Adding
 * something on a category grid and then seeing "0" in the header is the kind
 * of thing that makes people stop trusting a checkout, and two independent
 * fetches drift the moment one of them is stale.
 *
 * ── THE SERVER OWNS THE CART, NOT THIS ─────────────────────────────────────
 * Every mutation returns the WHOLE cart from the backend and that reply
 * replaces local state. Nothing is incremented optimistically: quantities are
 * capped server-side against real stock, so a local +1 can easily be a lie —
 * you ask for three of something with two left and the truthful answer is two.
 * Waiting for the round trip is the price of the number being right.
 *
 * A SIGNED-OUT VISITOR HAS NO CART, and that is not an error. Browsing is
 * public and only the cart needs a token, so the provider holds null and the
 * add button sends people to sign in rather than failing silently.
 */

interface WowCartValue {
  cart: Cart | null;
  /** True while the first load is in flight — distinct from "empty". */
  loading: boolean;
  /** The id of the product currently being added, for a per-card spinner. */
  addingId: string | null;
  error: string | null;
  add: (product: Product, quantity?: number) => Promise<void>;
  /** Replaces local state after a mutation made elsewhere (the cart page). */
  replace: (cart: Cart) => void;
  refresh: () => Promise<void>;
}

const WowCartContext = createContext<WowCartValue | null>(null);

export function WowCartProvider({ children }: { children: React.ReactNode }) {
  const { user, hydrated } = useSession();
  const signedIn = Boolean(user?.wawuId);

  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!signedIn) {
      setCart(null);
      setLoading(false);
      return;
    }
    try {
      setCart(await getCart());
    } catch (e) {
      setError(describeError(e).body);
    } finally {
      setLoading(false);
    }
  }, [signedIn]);

  useEffect(() => {
    if (!hydrated) return;
    void refresh();
  }, [hydrated, refresh]);

  const add = useCallback(
    async (product: Product, quantity = 1) => {
      if (!signedIn) return;
      setAddingId(product.id);
      setError(null);
      try {
        // The reply is the whole cart, and it is authoritative — the server
        // may have given fewer than were asked for.
        setCart(await apiAdd(product.id, quantity));
      } catch (e) {
        setError(describeError(e).body);
      } finally {
        setAddingId(null);
      }
    },
    [signedIn],
  );

  const value = useMemo<WowCartValue>(
    () => ({ cart, loading, addingId, error, add, replace: setCart, refresh }),
    [cart, loading, addingId, error, add, refresh],
  );

  return <WowCartContext.Provider value={value}>{children}</WowCartContext.Provider>;
}

export function useWowCart(): WowCartValue {
  const ctx = useContext(WowCartContext);
  if (!ctx) throw new Error("useWowCart must be used inside a WowCartProvider");
  return ctx;
}
