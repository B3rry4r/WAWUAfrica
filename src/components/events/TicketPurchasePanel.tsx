"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { buyTickets, listTicketTypes, verifyOrder } from "@/lib/api/event-tickets";
import { describeError } from "@/lib/api/errors";
import {
  checkoutCustomerFromSession,
  isFlutterwaveCancelled,
  openFlutterwaveCheckout,
} from "@/lib/flutterwave";
import { sessionStorage } from "@/lib/auth/session-storage";
import { formatNaira } from "@/lib/format";
import { MAX_TICKETS_PER_ORDER, type EventTicketType } from "@/types/event-tickets";
import type { WawuEvent } from "@/types/events";
import { Button, Callout, Icon, Skeleton, StatusPill } from "@/components/ui";

/**
 * Buying a ticket, on the public event page.
 *
 * ── THE FOUR STATES AFTER "BUY", AND WHY THEY ARE NOT THREE ────────────────
 * idle       — nothing has happened.
 * charging   — the checkout is open. Nothing has been charged yet, so
 *              dismissing it returns to idle and NEVER says a payment failed.
 * confirming — the charge COMPLETED and the server is verifying it.
 * unconfirmed— the money moved and the confirmation call failed.
 *
 * That last state is the reason this is not a boolean. Past the point where
 * Flutterwave returns a transaction id, the buyer has paid; offering them a
 * "try again" button there invites a second charge for a ticket they already
 * own. So `unconfirmed` offers a RETRY OF THE VERIFY ONLY, which the server
 * makes safe — its verify is idempotent, and the browser's call and the
 * webhook can settle the same charge, with the second caller getting the
 * tickets that exist rather than a duplicate set.
 *
 * ── A FREE TIER NEVER OPENS A CHECKOUT ─────────────────────────────────────
 * `buyTickets` returns a discriminated union on `free`. A free tier issues
 * immediately; routing ₦0 through a payment provider is either rejected or,
 * worse, accepted as a zero charge that looks real in a reconciliation report.
 */

interface TicketPurchasePanelProps {
  event: WawuEvent;
  /** From `?ref=` on a shared link. Attributes the sale, and nothing more. */
  referralCode?: string;
}

type Phase = "idle" | "charging" | "confirming" | "unconfirmed";

export function TicketPurchasePanel({ event, referralCode }: TicketPurchasePanelProps) {
  const router = useRouter();
  const [types, setTypes] = useState<EventTicketType[] | null>(null);
  const [loadError, setLoadError] = useState<unknown>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [phase, setPhase] = useState<Phase>("idle");
  const [failure, setFailure] = useState<string | null>(null);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [pendingCharge, setPendingCharge] = useState<{ transaction_id: string; tx_ref: string } | null>(null);

  useEffect(() => {
    let active = true;
    listTicketTypes(event.id)
      .then((rows) => {
        if (!active) return;
        setTypes(rows);
        // Preselect the cheapest tier that can actually be bought, so the
        // common case is one tap. A sold-out tier is never preselected.
        setSelected(rows.find((r) => !r.soldOut)?.id ?? null);
      })
      .catch((e) => active && setLoadError(e));
    return () => {
      active = false;
    };
  }, [event.id]);

  const tier = types?.find((t) => t.id === selected) ?? null;
  const cancelled = event.cancelledAt !== null;

  const confirm = useCallback(
    async (orderId: string, charge: { transaction_id: string; tx_ref: string }) => {
      setPhase("confirming");
      try {
        await verifyOrder(orderId, charge);
        router.push("/tickets?just=1");
      } catch {
        // The money HAS moved. Do not offer a retry of the payment.
        setPhase("unconfirmed");
      }
    },
    [router],
  );

  async function buy() {
    if (!tier) return;
    setFailure(null);

    let opened: Awaited<ReturnType<typeof buyTickets>>;
    try {
      opened = await buyTickets(event.id, {
        ticketTypeId: tier.id,
        quantity,
        ...(referralCode ? { referralCode } : {}),
      });
    } catch (e) {
      // Nothing charged: sold out, sales closed, or the event was called off.
      setFailure(describeError(e).body);
      return;
    }

    if (opened.free) {
      router.push("/tickets?just=1");
      return;
    }

    const customer = checkoutCustomerFromSession(sessionStorage.getUser());
    if (!customer) {
      setFailure("We could not read your account details. Sign in again and try once more.");
      return;
    }

    setPhase("charging");
    let charge;
    try {
      charge = await openFlutterwaveCheckout(opened.flutterwaveConfig, customer, {
        title: event.name,
        description: `${tier.name} · ${quantity} ticket${quantity === 1 ? "" : "s"}`,
      });
    } catch (e) {
      // Closing the checkout charges nothing. Returning to idle rather than
      // accusing their bank of declining.
      setPhase("idle");
      if (!isFlutterwaveCancelled(e)) setFailure(describeError(e).body);
      return;
    }

    setPendingOrderId(opened.orderId);
    setPendingCharge(charge);
    await confirm(opened.orderId, charge);
  }

  if (cancelled) {
    return (
      <Callout tone="danger" title="This event was called off">
        Every ticket has been voided and every buyer refunded. Nothing is on sale.
      </Callout>
    );
  }

  if (loadError) {
    return (
      <Callout tone="warning" title="Tickets could not be loaded">
        {describeError(loadError).body}
      </Callout>
    );
  }

  if (types === null) {
    return (
      <div className="flex flex-col gap-[10px]">
        <Skeleton className="h-[64px] w-full" />
        <Skeleton className="h-[64px] w-full" />
      </div>
    );
  }

  // An event with no tiers is the ordinary case, not an error. Say nothing
  // rather than showing an empty ticket box on a free meetup.
  if (types.length === 0) return null;

  if (phase === "unconfirmed") {
    return (
      <Callout tone="warning" title="Your payment went through — we are still confirming it">
        <p className="m-0">
          The money has left your account and your tickets are being issued. This is safe to check again; it will
          not charge you twice.
        </p>
        <div className="mt-[12px]">
          <Button
            onClick={() => pendingOrderId && pendingCharge && void confirm(pendingOrderId, pendingCharge)}
            size="sm"
          >
            Check again
          </Button>
        </div>
      </Callout>
    );
  }

  const busy = phase === "charging" || phase === "confirming";

  return (
    <div className="flex flex-col gap-[14px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[16px]">
      <div className="flex items-center justify-between gap-[10px]">
        <h2 className="m-0 text-[15.5px] font-semibold text-[var(--text-primary)]">Tickets</h2>
        {referralCode ? <StatusPill kind="info" size="sm">Shared link</StatusPill> : null}
      </div>

      <div className="flex flex-col gap-[8px]">
        {types.map((t) => {
          const isSelected = t.id === selected;
          return (
            <button
              key={t.id}
              type="button"
              disabled={t.soldOut || busy}
              onClick={() => {
                setSelected(t.id);
                setQuantity(1);
              }}
              aria-pressed={isSelected}
              className={[
                "flex w-full items-center justify-between gap-[12px] rounded-[var(--radius-input)] border p-[13px_14px] text-left transition-colors",
                t.soldOut
                  ? "cursor-not-allowed border-[var(--border-hairline)] bg-[var(--surface-page)] opacity-60"
                  : isSelected
                    ? "border-[var(--accent)] bg-[var(--accent-tint)]"
                    : "cursor-pointer border-[var(--border-hairline)] bg-[var(--surface-input)] hover:border-[var(--accent)]",
              ].join(" ")}
            >
              <span className="flex min-w-0 flex-col gap-[3px]">
                <span className="truncate text-[14px] font-semibold text-[var(--text-primary)]">{t.name}</span>
                <span className="text-[12px] text-[var(--text-muted)]">
                  {t.soldOut
                    ? "Sold out"
                    : t.remaining <= 10
                      ? `Only ${t.remaining} left`
                      : `${t.remaining} left`}
                </span>
              </span>
              <span className="shrink-0 text-[14.5px] font-semibold text-[var(--text-primary)]">
                {/*
                  A tier that costs nothing says so in words, never ₦0 — a
                  price of zero reads as a broken price rather than as an
                  event that does not charge. "No charge" rather than the
                  other word, per scripts/check-copy.mjs.
                */}
                {t.priceNaira === 0 ? "No charge" : formatNaira(t.priceNaira)}
              </span>
            </button>
          );
        })}
      </div>

      {tier ? (
        <>
          <div className="flex items-center justify-between gap-[12px]">
            <span className="text-[13px] font-semibold text-[var(--text-secondary)]">How many</span>
            <div className="flex items-center gap-[10px]">
              <button
                type="button"
                aria-label="One fewer"
                disabled={quantity <= 1 || busy}
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="flex h-[34px] w-[34px] items-center justify-center rounded-full border border-[var(--border-hairline)] bg-[var(--surface-input)] text-[var(--text-primary)] disabled:opacity-40"
              >
                <Icon name="Minus" size={15} color="currentColor" />
              </button>
              <span className="min-w-[24px] text-center text-[15px] font-semibold text-[var(--text-primary)]">
                {quantity}
              </span>
              <button
                type="button"
                aria-label="One more"
                disabled={busy || quantity >= Math.min(tier.remaining, MAX_TICKETS_PER_ORDER)}
                onClick={() =>
                  setQuantity((q) => Math.min(Math.min(tier.remaining, MAX_TICKETS_PER_ORDER), q + 1))
                }
                className="flex h-[34px] w-[34px] items-center justify-center rounded-full border border-[var(--border-hairline)] bg-[var(--surface-input)] text-[var(--text-primary)] disabled:opacity-40"
              >
                <Icon name="Plus" size={15} color="currentColor" />
              </button>
            </div>
          </div>

          {failure ? (
            <Callout tone="danger" title="That did not go through">
              {failure}
            </Callout>
          ) : null}

          <Button full loading={busy} disabled={busy} onClick={() => void buy()}>
            {tier.priceNaira === 0
              ? `Get ${quantity === 1 ? "a ticket" : `${quantity} tickets`}`
              : `Pay ${formatNaira(tier.priceNaira * quantity)}`}
          </Button>

          <p className="m-0 text-[11.5px] leading-[1.5] text-[var(--text-muted)]">
            {phase === "confirming"
              ? "Confirming your payment. Do not close this page."
              : "Your ticket appears in My tickets with a QR code to show at the door."}
          </p>
        </>
      ) : (
        <p className="m-0 text-[13px] text-[var(--text-muted)]">Every ticket for this event has sold.</p>
      )}
    </div>
  );
}
