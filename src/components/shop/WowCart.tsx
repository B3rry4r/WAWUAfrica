"use client";

import { useState } from "react";
import Link from "next/link";
import { removeFromCart, setCartQuantity } from "@/lib/api/shop";
import { describeError } from "@/lib/api/errors";
import { formatNaira } from "@/lib/format";
import { MAX_QUANTITY_PER_LINE } from "@/types/shop";
import { Button, Callout, EmptyState, Icon, Skeleton } from "@/components/ui";
import { ShopHeader } from "./ShopHeader";
import { useWowCart } from "./WowCartProvider";

/**
 * The WOW — this shop's cart.
 *
 * ── AN UNAVAILABLE LINE IS SHOWN, NOT SILENTLY DROPPED ─────────────────────
 * A product that sold out or was pulled while the cart sat open still renders,
 * marked, and contributes zero to the total. Quietly removing it leaves
 * somebody staring at a total that changed for no visible reason; leaving it
 * priced would promise something that cannot be delivered. The backend takes
 * the same position — `lineTotalNaira` comes back as 0 for those lines — and
 * checkout refuses until they are cleared.
 *
 * ── THE TOTAL IS NEVER COMPUTED HERE ───────────────────────────────────────
 * Every quantity change round-trips and the reply replaces the whole cart.
 * A local sum can disagree with what gets charged, and the version somebody
 * remembers is the one on the screen.
 */
export function WowCart() {
  const { cart, loading, replace, refresh } = useWowCart();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function change(productId: string, quantity: number) {
    setBusyId(productId);
    setError(null);
    try {
      replace(await setCartQuantity(productId, quantity));
    } catch (e) {
      setError(describeError(e).body);
      void refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function remove(productId: string) {
    setBusyId(productId);
    setError(null);
    try {
      replace(await removeFromCart(productId));
    } catch (e) {
      setError(describeError(e).body);
    } finally {
      setBusyId(null);
    }
  }

  const unavailable = cart?.items.filter((i) => !i.product.inStock) ?? [];
  const canCheckout = Boolean(cart && cart.items.length > 0 && unavailable.length === 0);

  return (
    <div className="flex flex-col gap-[18px] p-[14px_16px_96px] xl:mx-auto xl:w-full xl:max-w-[1000px] xl:p-[26px_28px_64px]">
      <ShopHeader title="Your WOW" />

      {loading ? (
        <div className="flex flex-col gap-[12px]">
          <Skeleton className="h-[110px] w-full" />
          <Skeleton className="h-[110px] w-full" />
        </div>
      ) : !cart || cart.items.length === 0 ? (
        <EmptyState
          icon="ShoppingCart"
          title="Your WOW is empty"
          caption="Everything you add to build your setup lands here."
          action={<Button href="/shop">Start shopping</Button>}
        />
      ) : (
        <div className="flex flex-col gap-[20px] xl:flex-row xl:items-start xl:gap-[28px]">
          <div className="flex min-w-0 flex-1 flex-col gap-[12px]">
            {error ? (
              <Callout tone="danger" title="That did not save" full>
                {error}
              </Callout>
            ) : null}

            {unavailable.length > 0 ? (
              <Callout tone="warning" title="Some of this is no longer available" full>
                {unavailable.map((i) => i.product.name).join(", ")} sold out while it sat in your
                WOW. Remove {unavailable.length === 1 ? "it" : "them"} to carry on.
              </Callout>
            ) : null}

            {cart.items.map((line) => (
              <article
                key={line.id}
                className={`flex gap-[12px] rounded-[var(--radius-card)] border p-[13px] ${
                  line.product.inStock
                    ? "border-[var(--border-hairline)] bg-[var(--surface-card)]"
                    : "border-[var(--warning)] bg-[var(--warning-tint)]"
                }`}
              >
                <Link
                  href={`/shop/product/${line.product.slug}`}
                  className="h-[84px] w-[84px] shrink-0 overflow-hidden rounded-[var(--radius-input)] bg-[var(--surface-page)]"
                >
                  {line.product.images[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={line.product.images[0]} alt="" className="h-full w-full object-cover" />
                  ) : null}
                </Link>

                <div className="flex min-w-0 flex-1 flex-col gap-[7px]">
                  <Link
                    href={`/shop/product/${line.product.slug}`}
                    className="line-clamp-2 text-[14px] font-semibold leading-[1.35] text-[var(--text-primary)] no-underline hover:text-[var(--accent)]"
                  >
                    {line.product.name}
                  </Link>

                  {line.product.inStock ? (
                    <span className="text-[13px] font-semibold text-[var(--text-primary)]">
                      {formatNaira(line.lineTotalNaira)}
                    </span>
                  ) : (
                    <span className="text-[12.5px] font-semibold text-[var(--warning)]">
                      Sold out. Not included in your total
                    </span>
                  )}

                  <div className="flex flex-wrap items-center gap-[10px]">
                    {line.product.inStock ? (
                      <div className="flex items-center gap-[8px]">
                        <button
                          type="button"
                          aria-label="One fewer"
                          disabled={busyId === line.product.id}
                          onClick={() => void change(line.product.id, line.quantity - 1)}
                          className="flex h-[30px] w-[30px] items-center justify-center rounded-full border border-[var(--border-hairline)] bg-[var(--surface-input)] text-[var(--text-primary)] disabled:opacity-40"
                        >
                          <Icon name="Minus" size={14} color="currentColor" />
                        </button>
                        <span className="min-w-[20px] text-center text-[14px] font-semibold text-[var(--text-primary)]">
                          {line.quantity}
                        </span>
                        <button
                          type="button"
                          aria-label="One more"
                          disabled={
                            busyId === line.product.id || line.quantity >= MAX_QUANTITY_PER_LINE
                          }
                          onClick={() => void change(line.product.id, line.quantity + 1)}
                          className="flex h-[30px] w-[30px] items-center justify-center rounded-full border border-[var(--border-hairline)] bg-[var(--surface-input)] text-[var(--text-primary)] disabled:opacity-40"
                        >
                          <Icon name="Plus" size={14} color="currentColor" />
                        </button>
                      </div>
                    ) : null}

                    <button
                      type="button"
                      disabled={busyId === line.product.id}
                      onClick={() => void remove(line.product.id)}
                      className="text-[12.5px] font-semibold text-[var(--text-muted)] hover:text-[var(--danger)] disabled:opacity-40"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* ---- the total ---- */}
          <aside className="flex w-full shrink-0 flex-col gap-[12px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[16px] xl:sticky xl:top-[24px] xl:w-[320px]">
            <h2 className="m-0 text-[15.5px] font-semibold text-[var(--text-primary)]">Summary</h2>

            <Row label={`Items (${cart.itemCount})`} value={formatNaira(cart.subtotalNaira)} />
            {/*
              Stated, not hidden. Somebody spending millions on a camera needs
              to know delivery is a conversation rather than a line item they
              missed.
            */}
            <Row label="Delivery" value="Arranged with you" muted />

            <div className="mt-[4px] flex items-center justify-between border-t border-[var(--border-hairline)] pt-[12px]">
              <span className="text-[13.5px] font-semibold text-[var(--text-secondary)]">Total</span>
              <span className="text-[19px] font-bold tracking-[-0.02em] text-[var(--text-primary)]">
                {formatNaira(cart.totalNaira)}
              </span>
            </div>

            {/*
              A link cannot be disabled — the Button type refuses the
              combination, correctly. So the blocked state is a real disabled
              button rather than a link styled to look inert, which would
              still navigate on a middle-click or an Enter key.
            */}
            {canCheckout ? (
              <Button href="/shop/checkout" full size="lg">
                Checkout
              </Button>
            ) : (
              <Button full size="lg" disabled>
                Checkout
              </Button>
            )}
            {!canCheckout && unavailable.length > 0 ? (
              <p className="m-0 text-[11.5px] text-[var(--text-muted)]">
                Remove the sold-out items to carry on.
              </p>
            ) : null}
          </aside>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-[10px]">
      <span className="text-[13px] text-[var(--text-secondary)]">{label}</span>
      <span
        className={`text-[13.5px] font-semibold ${
          muted ? "text-[var(--text-muted)]" : "text-[var(--text-primary)]"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
