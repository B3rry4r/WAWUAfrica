"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { checkout, verifyShopOrder } from "@/lib/api/shop";
import { describeError } from "@/lib/api/errors";
import {
  checkoutCustomerFromSession,
  isFlutterwaveCancelled,
  openFlutterwaveCheckout,
} from "@/lib/flutterwave";
import { sessionStorage } from "@/lib/auth/session-storage";
import { formatNaira } from "@/lib/format";
import type { DeliveryDetails } from "@/types/shop";
import { subdivisionsFor } from "@/lib/geo";
import { Button, Callout, Icon, Input, Skeleton } from "@/components/ui";
import { ShopHeader } from "./ShopHeader";
import { useWowCart } from "./WowCartProvider";

/**
 * Checkout.
 *
 * ── THE ADDRESS IS THE PRODUCT HERE ────────────────────────────────────────
 * Logistics is arranged by hand: a person reads these fields and physically
 * takes a package somewhere. So every one of them except the note is required,
 * and the phone number especially — an order with no way to reach the buyer is
 * a package that cannot be delivered. The backend refuses an incomplete
 * address too; this form exists so nobody discovers that as a 400.
 *
 * ── FOUR STATES AFTER "PAY", NOT A BOOLEAN ─────────────────────────────────
 * idle        — nothing has happened
 * charging    — the checkout is open. NOTHING is charged yet, so dismissing it
 *               returns to idle and never claims a payment failed
 * confirming  — the charge completed and the server is verifying it
 * unconfirmed — the money moved and the confirmation call failed
 *
 * That last state is why this is not a boolean. Past the point Flutterwave
 * returns a transaction id the buyer HAS paid, so offering "try again" there
 * invites a second charge for goods they already own. `unconfirmed` retries
 * the VERIFY only, which the server makes safe: verification is idempotent and
 * does not deduct stock twice.
 */

type Phase = "idle" | "charging" | "confirming" | "unconfirmed";

const EMPTY: DeliveryDetails = {
  deliveryName: "",
  deliveryPhone: "",
  deliveryAddress: "",
  deliveryCity: "",
  deliveryState: "Lagos",
  deliveryNote: "",
};

export function ShopCheckout() {
  const router = useRouter();
  const { cart, loading, refresh } = useWowCart();

  const [form, setForm] = useState<DeliveryDetails>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof DeliveryDetails, string>>>({});
  const [phase, setPhase] = useState<Phase>("idle");
  const [failure, setFailure] = useState<string | null>(null);
  const [pending, setPending] = useState<{
    orderId: string;
    charge: { transaction_id: string; tx_ref: string };
  } | null>(null);

  useEffect(() => {
    // Prefill the name from the account. The address deliberately is not
    // remembered anywhere yet — guessing where somebody wants a ₦3m camera
    // sent is worse than asking.
    const user = sessionStorage.getUser();
    if (user?.fullName) setForm((f) => ({ ...f, deliveryName: user.fullName ?? "" }));
  }, []);

  function set<K extends keyof DeliveryDetails>(key: K, value: DeliveryDetails[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validate(): boolean {
    const found: Partial<Record<keyof DeliveryDetails, string>> = {};
    if (form.deliveryName.trim().length < 2) found.deliveryName = "Who is receiving this?";
    if (form.deliveryPhone.trim().length < 7) {
      found.deliveryPhone = "We call this number to arrange delivery.";
    }
    if (form.deliveryAddress.trim().length < 6) {
      found.deliveryAddress = "Street and number, so somebody can find it.";
    }
    if (form.deliveryCity.trim().length < 2) found.deliveryCity = "Which town or city?";
    if (!form.deliveryState.trim()) found.deliveryState = "Pick a state.";
    setErrors(found);
    return Object.keys(found).length === 0;
  }

  const confirm = useCallback(
    async (orderId: string, charge: { transaction_id: string; tx_ref: string }) => {
      setPhase("confirming");
      try {
        await verifyShopOrder(orderId, charge);
        await refresh();
        router.push(`/shop/orders/${orderId}?just=1`);
      } catch (e) {
        // The money HAS moved. Never offer a retry of the PAYMENT here.
        setFailure(describeError(e).body);
        setPhase("unconfirmed");
      }
    },
    [refresh, router],
  );

  async function pay() {
    if (!validate()) return;
    setFailure(null);

    let opened;
    try {
      opened = await checkout({
        ...form,
        deliveryNote: form.deliveryNote?.trim() || undefined,
      });
    } catch (e) {
      // Nothing charged: empty cart, something sold out, or a price moved.
      setFailure(describeError(e).body);
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
        title: "WAWU Shop",
        description: `${cart?.itemCount ?? 0} item${cart?.itemCount === 1 ? "" : "s"}`,
      });
    } catch (e) {
      // Closing the modal charges nothing. Do not accuse their bank.
      setPhase("idle");
      if (!isFlutterwaveCancelled(e)) setFailure(describeError(e).body);
      return;
    }

    setPending({ orderId: opened.orderId, charge });
    await confirm(opened.orderId, charge);
  }

  if (loading) {
    return (
      <Shell>
        <Skeleton className="h-[420px] w-full" />
      </Shell>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <Shell>
        <Callout tone="neutral" title="There is nothing to check out">
          Your WOW is empty. Add something first.
        </Callout>
        <div>
          <Button href="/shop">Back to the shop</Button>
        </div>
      </Shell>
    );
  }

  if (phase === "unconfirmed") {
    return (
      <Shell>
        <Callout tone="warning" title="Your payment went through — we are still confirming it">
          <p className="m-0">
            The money has left your account and your order is being finalised. This is safe to check
            again; it will not charge you twice.
          </p>
          {failure ? <p className="m-0 mt-[8px] text-[var(--text-muted)]">{failure}</p> : null}
          <div className="mt-[12px]">
            <Button
              size="sm"
              onClick={() => pending && void confirm(pending.orderId, pending.charge)}
            >
              Check again
            </Button>
          </div>
        </Callout>
      </Shell>
    );
  }

  const busy = phase === "charging" || phase === "confirming";

  return (
    <Shell>
      <ShopHeader title="Back to your WOW" />
      <h1 className="m-0 text-[22px] font-bold tracking-[-0.02em] text-[var(--text-primary)] xl:text-[30px]">
        Checkout
      </h1>

      <div className="flex flex-col gap-[22px] xl:flex-row xl:items-start xl:gap-[28px]">
        <div className="flex min-w-0 flex-1 flex-col gap-[16px]">
          <div className="flex gap-[10px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[14px]">
            <Icon name="Truck" size={19} color="var(--accent)" />
            <div className="flex min-w-0 flex-col gap-[2px]">
              <span className="text-[13.5px] font-semibold text-[var(--text-primary)]">
                We arrange delivery with you directly
              </span>
              <span className="text-[12.5px] leading-[1.5] text-[var(--text-secondary)]">
                Nothing extra is charged here. Somebody calls the number below to agree how and when
                it reaches you, so please make sure it is right.
              </span>
            </div>
          </div>

          <Field label="Who is receiving this" error={errors.deliveryName}>
            <Input
              value={form.deliveryName}
              onChange={(e) => set("deliveryName", e.target.value.slice(0, 120))}
              placeholder="Full name"
            />
          </Field>

          <Field label="Phone number" error={errors.deliveryPhone} hint="We call this to arrange delivery.">
            <Input
              value={form.deliveryPhone}
              onChange={(e) => set("deliveryPhone", e.target.value.slice(0, 30))}
              placeholder="+234 801 234 5678"
              inputMode="tel"
            />
          </Field>

          <Field label="Address" error={errors.deliveryAddress}>
            <Input
              value={form.deliveryAddress}
              onChange={(e) => set("deliveryAddress", e.target.value.slice(0, 300))}
              placeholder="Street, number, estate"
            />
          </Field>

          <div className="flex flex-col gap-[16px] xl:flex-row xl:gap-[14px]">
            <div className="flex-1">
              <Field label="Town or city" error={errors.deliveryCity}>
                <Input
                  value={form.deliveryCity}
                  onChange={(e) => set("deliveryCity", e.target.value.slice(0, 80))}
                  placeholder="Ikeja"
                />
              </Field>
            </div>
            <div className="flex-1">
              <Field label="State" error={errors.deliveryState}>
                <div className="relative">
                  <select
                    value={form.deliveryState}
                    onChange={(e) => set("deliveryState", e.target.value)}
                    className="flex h-[52px] w-full cursor-pointer appearance-none items-center rounded-[var(--radius-input)] border border-[var(--border-hairline)] bg-[var(--surface-input)] px-[16px] text-[15px] text-[var(--text-primary)]"
                  >
                    {subdivisionsFor("Nigeria").map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <Icon
                    name="ChevronDown"
                    size={16}
                    strokeWidth={2.2}
                    color="var(--text-muted)"
                    className="pointer-events-none absolute right-[16px] top-1/2 -translate-y-1/2"
                  />
                </div>
              </Field>
            </div>
          </div>

          <Field
            label="Anything that helps us find you"
            hint="Optional, and often the difference."
          >
            <Input
              value={form.deliveryNote ?? ""}
              onChange={(e) => set("deliveryNote", e.target.value.slice(0, 300))}
              placeholder="Gate is behind the pharmacy."
            />
          </Field>
        </div>

        <aside className="flex w-full shrink-0 flex-col gap-[12px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[16px] xl:sticky xl:top-[24px] xl:w-[330px]">
          <h2 className="m-0 text-[15.5px] font-semibold text-[var(--text-primary)]">Your order</h2>

          <ul className="m-0 flex list-none flex-col gap-[9px] p-0">
            {cart.items.map((line) => (
              <li key={line.id} className="flex items-start justify-between gap-[10px]">
                <span className="min-w-0 text-[12.5px] leading-[1.4] text-[var(--text-secondary)]">
                  {line.quantity} × {line.product.name}
                </span>
                <span className="shrink-0 text-[12.5px] font-semibold text-[var(--text-primary)]">
                  {formatNaira(line.lineTotalNaira)}
                </span>
              </li>
            ))}
          </ul>

          <div className="flex items-center justify-between border-t border-[var(--border-hairline)] pt-[12px]">
            <span className="text-[13.5px] font-semibold text-[var(--text-secondary)]">Total</span>
            <span className="text-[19px] font-bold tracking-[-0.02em] text-[var(--text-primary)]">
              {formatNaira(cart.totalNaira)}
            </span>
          </div>

          {failure ? (
            <Callout tone="danger" title="That did not go through" full>
              {failure}
            </Callout>
          ) : null}

          <Button full size="lg" loading={busy} disabled={busy} onClick={() => void pay()}>
            {phase === "confirming" ? "Confirming…" : `Pay ${formatNaira(cart.totalNaira)}`}
          </Button>

          <p className="m-0 text-[11.5px] leading-[1.5] text-[var(--text-muted)]">
            {phase === "confirming"
              ? "Confirming your payment. Do not close this page."
              : "You pay by card. Delivery is arranged with you afterwards."}
          </p>
        </aside>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-[18px] p-[14px_16px_96px] xl:mx-auto xl:w-full xl:max-w-[1000px] xl:p-[26px_28px_64px]">
      {children}
    </div>
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-[8px]">
      <span className="text-[13px] font-semibold text-[var(--text-secondary)]">{label}</span>
      {children}
      {error ? (
        <span className="text-[12.5px] text-[var(--danger)]">{error}</span>
      ) : hint ? (
        <span className="text-[12px] leading-[1.45] text-[var(--text-muted)]">{hint}</span>
      ) : null}
    </div>
  );
}
