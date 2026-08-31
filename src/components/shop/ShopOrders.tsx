"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getShopOrder, myShopOrders } from "@/lib/api/shop";
import { formatNaira } from "@/lib/format";
import { FULFILMENT_LABEL, type ShopOrder } from "@/types/shop";
import { Button, Callout, EmptyState, ErrorState, Icon, Skeleton, StatusPill } from "@/components/ui";
import { ShopHeader } from "./ShopHeader";

/**
 * Order history, and one order.
 *
 * ── WHAT "TRACKING" MEANS HERE ─────────────────────────────────────────────
 * Logistics is off-platform, so there is no live tracking and this screen does
 * not pretend otherwise. `fulfilment` is a state a WAWU operator set by hand,
 * and `trackingNote` is a sentence they typed. Rendering a progress bar with a
 * courier's name and a fake ETA would be inventing information nobody has.
 *
 * Unpaid orders never appear — the backend excludes them. An order that was
 * never paid for is not a purchase, and listing it reads as one.
 */

function fulfilmentTone(o: ShopOrder) {
  if (o.status === "refunded") return "danger" as const;
  if (o.fulfilment === "delivered") return "success" as const;
  if (o.fulfilment === "dispatched") return "info" as const;
  return "warning" as const;
}

export function ShopOrdersList() {
  const [orders, setOrders] = useState<ShopOrder[] | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setOrders(null);
    myShopOrders()
      .then((rows) => active && setOrders(rows))
      .catch((e) => active && setError(e));
    return () => {
      active = false;
    };
  }, [reloadKey]);

  return (
    <Shell>
      <ShopHeader title="My orders" />

      {error ? (
        <ErrorState
          title="Your orders could not be loaded"
          error={error}
          onRetry={() => setReloadKey((k) => k + 1)}
        />
      ) : orders === null ? (
        <div className="flex flex-col gap-[12px]">
          <Skeleton className="h-[120px] w-full" />
          <Skeleton className="h-[120px] w-full" />
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          icon="Package"
          title="No orders yet"
          caption="Anything you buy shows up here, with where it has got to."
          action={<Button href="/shop">Start shopping</Button>}
        />
      ) : (
        <div className="flex flex-col gap-[12px]">
          {orders.map((o) => (
            <Link
              key={o.id}
              href={`/shop/orders/${o.id}`}
              className="flex flex-col gap-[10px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[15px] no-underline transition-colors hover:border-[var(--accent)]"
            >
              <div className="flex flex-wrap items-center gap-[10px]">
                <StatusPill kind={fulfilmentTone(o)} size="sm">
                  {o.status === "refunded" ? "Refunded" : FULFILMENT_LABEL[o.fulfilment]}
                </StatusPill>
                <span className="text-[12.5px] text-[var(--text-muted)]">
                  {new Date(o.paidAt ?? o.createdAt).toLocaleDateString("en-NG", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
                <span className="flex-1" />
                <span className="text-[14.5px] font-bold text-[var(--text-primary)]">
                  {formatNaira(o.totalNaira)}
                </span>
              </div>

              <div className="flex items-center gap-[8px]">
                {o.items.slice(0, 4).map((i) => (
                  <span
                    key={i.id}
                    className="h-[44px] w-[44px] shrink-0 overflow-hidden rounded-[var(--radius-input)] bg-[var(--surface-page)]"
                  >
                    {i.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={i.imageUrl} alt="" className="h-full w-full object-cover" />
                    ) : null}
                  </span>
                ))}
                <span className="text-[12.5px] text-[var(--text-secondary)]">
                  {o.items.reduce((n, i) => n + i.quantity, 0)} item
                  {o.items.reduce((n, i) => n + i.quantity, 0) === 1 ? "" : "s"}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </Shell>
  );
}

export function ShopOrderDetail({ orderId }: { orderId: string }) {
  const justBought = useSearchParams().get("just") === "1";
  const [order, setOrder] = useState<ShopOrder | null>(null);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    let active = true;
    getShopOrder(orderId)
      .then((o) => active && setOrder(o))
      .catch((e) => active && setError(e));
    return () => {
      active = false;
    };
  }, [orderId]);

  if (error) {
    return (
      <Shell>
        <ErrorState title="This order could not be loaded" error={error} />
      </Shell>
    );
  }

  if (!order) {
    return (
      <Shell>
        <Skeleton className="h-[300px] w-full" />
      </Shell>
    );
  }

  return (
    <Shell>
      <ShopHeader title="My orders" />

      {justBought ? (
        <Callout tone="success" title="Order confirmed" full>
          We have your payment. Someone will call {order.deliveryPhone} to arrange delivery.
        </Callout>
      ) : null}

      <div className="flex flex-wrap items-center gap-[10px]">
        <h1 className="m-0 text-[22px] font-bold tracking-[-0.02em] text-[var(--text-primary)] xl:text-[28px]">
          Order
        </h1>
        <StatusPill kind={fulfilmentTone(order)} size="sm">
          {order.status === "refunded" ? "Refunded" : FULFILMENT_LABEL[order.fulfilment]}
        </StatusPill>
      </div>

      <div className="flex flex-col gap-[18px] xl:flex-row xl:items-start xl:gap-[28px]">
        <div className="flex min-w-0 flex-1 flex-col gap-[12px]">
          {order.items.map((i) => (
            <article
              key={i.id}
              className="flex gap-[12px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[13px]"
            >
              <span className="h-[70px] w-[70px] shrink-0 overflow-hidden rounded-[var(--radius-input)] bg-[var(--surface-page)]">
                {i.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={i.imageUrl} alt="" className="h-full w-full object-cover" />
                ) : null}
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-[4px]">
                {/*
                  The name and price AS BOUGHT. The product may since have been
                  renamed or repriced in the dashboard; this order says what
                  was actually purchased.
                */}
                <span className="text-[14px] font-semibold leading-[1.35] text-[var(--text-primary)]">
                  {i.name}
                </span>
                <span className="text-[12.5px] text-[var(--text-secondary)]">
                  {i.quantity} × {formatNaira(i.priceNaira)}
                </span>
              </div>
              <span className="shrink-0 text-[14px] font-bold text-[var(--text-primary)]">
                {formatNaira(i.priceNaira * i.quantity)}
              </span>
            </article>
          ))}

          <div className="flex flex-col gap-[10px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[15px]">
            <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--text-muted)]">
              Where it is going
            </span>
            <div className="flex flex-col gap-[3px] text-[13.5px] leading-[1.5] text-[var(--text-secondary)]">
              <span className="font-semibold text-[var(--text-primary)]">{order.deliveryName}</span>
              <span>{order.deliveryPhone}</span>
              <span>{order.deliveryAddress}</span>
              <span>
                {order.deliveryCity}, {order.deliveryState}
              </span>
              {order.deliveryNote ? (
                <span className="text-[var(--text-muted)]">{order.deliveryNote}</span>
              ) : null}
            </div>
          </div>
        </div>

        <aside className="flex w-full shrink-0 flex-col gap-[12px] xl:w-[320px]">
          <div className="flex flex-col gap-[10px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[15px]">
            <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--text-muted)]">
              Delivery
            </span>
            {/*
              A state somebody set by hand, and a sentence they typed. No
              progress bar and no ETA: there is no courier integration to
              derive either from, and inventing one is worse than saying less.
            */}
            <span className="text-[14px] font-semibold text-[var(--text-primary)]">
              {FULFILMENT_LABEL[order.fulfilment]}
            </span>
            {order.trackingNote ? (
              <span className="text-[12.5px] leading-[1.5] text-[var(--text-secondary)]">
                {order.trackingNote}
              </span>
            ) : (
              <span className="text-[12.5px] leading-[1.5] text-[var(--text-muted)]">
                We call you to arrange delivery. Nothing is charged for it.
              </span>
            )}
            {order.dispatchedAt ? (
              <span className="flex items-center gap-[6px] text-[12px] text-[var(--text-muted)]">
                <Icon name="Truck" size={14} color="currentColor" />
                Sent{" "}
                {new Date(order.dispatchedAt).toLocaleDateString("en-NG", {
                  day: "numeric",
                  month: "short",
                })}
              </span>
            ) : null}
          </div>

          <div className="flex flex-col gap-[8px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[15px]">
            <Row label="Items" value={formatNaira(order.subtotalNaira)} />
            <Row label="Delivery" value="Arranged with you" muted />
            <div className="flex items-center justify-between border-t border-[var(--border-hairline)] pt-[10px]">
              <span className="text-[13.5px] font-semibold text-[var(--text-secondary)]">Total</span>
              <span className="text-[18px] font-bold text-[var(--text-primary)]">
                {formatNaira(order.totalNaira)}
              </span>
            </div>
          </div>
        </aside>
      </div>
    </Shell>
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

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-[18px] p-[14px_16px_96px] xl:mx-auto xl:w-full xl:max-w-[1000px] xl:p-[26px_28px_64px]">
      {children}
    </div>
  );
}
