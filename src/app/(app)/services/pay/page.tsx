"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getBillCategories,
  getBillers,
  getBillItems,
  validateBillCustomer,
  initBillPayment,
  verifyBillPayment,
  getMyBills,
  type BillCategory,
  type Biller,
  type BillItem,
  type BillRecord,
} from "@/lib/api/lifestyle";
import { openFlutterwaveCheckout, isFlutterwaveCancelled, checkoutCustomerFromSession } from "@/lib/flutterwave";
import { useSession } from "@/lib/auth/session-provider";
import { ProfileBackButton } from "@/components/profile/ProfileBackButton";
import { ServiceComingSoon, ServiceGateLoading, useServiceLive } from "@/components/services/ServiceGate";
import { Button, ErrorState, Icon, Input, Skeleton, TileCard } from "@/components/ui";
import type { IconName } from "@/components/ui/Icon";
import { Callout } from "@/components/ui/Callout";
import { formatNaira } from "@/lib/format";

/**
 * Bills Payment.
 *
 * Four steps, each one gated on the last: category, biller, package, then the
 * customer's own number. The number is validated with the biller before any
 * money moves, because a typo in a meter number sends real naira to a stranger
 * and there is no getting it back.
 */
/**
 * A face for each category.
 *
 * The provider's category CODE, not its display name: the names are theirs to
 * change ("Cable Bill Payment" today, something else tomorrow) while the codes
 * are the contract. Anything unmapped still gets a card, with a neutral glyph.
 */
const CATEGORY_ICON: Record<string, IconName> = {
  AIRTIME: "Smartphone",
  MOBILEDATA: "Wifi",
  INTSERVICE: "Router",
  CABLEBILLS: "Tv",
  UTILITYBILLS: "Zap",
  POWER: "Zap",
};

function iconFor(category: BillCategory): IconName {
  const code = (category.code ?? category.name).toUpperCase().replace(/[^A-Z]/g, "");
  return CATEGORY_ICON[code] ?? "Receipt";
}

/** Plain words for a status the customer never chose and should not have to decode. */
function billStatusLabel(status: BillRecord["status"]): string {
  switch (status) {
    case "processing":
      return "Delivering";
    case "delivered":
      return "Delivered";
    case "failed":
      return "Refund owed";
    case "refunded":
      return "Refunded";
    case "paid":
      return "Processing";
    default:
      return status;
  }
}

export default function PayPage() {
  const { user } = useSession();
  // Catalogue status. This tool lives at a static route, which Next resolves
  // ahead of /services/[id], so a service the catalogue has closed would still
  // open and take payment here unless the page refuses on its own.
  const live = useServiceLive("pay");

  const [categories, setCategories] = useState<BillCategory[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  /** The biller catalogue could not be reached at all, so nothing here can work. */
  const [unavailable, setUnavailable] = useState(false);

  const [category, setCategory] = useState<BillCategory | null>(null);
  const [billers, setBillers] = useState<Biller[] | null>(null);
  const [biller, setBiller] = useState<Biller | null>(null);
  const [items, setItems] = useState<BillItem[] | null>(null);
  const [item, setItem] = useState<BillItem | null>(null);

  const [customerRef, setCustomerRef] = useState("");
  const [validated, setValidated] = useState<{ name: string | null } | null>(null);
  const [validating, setValidating] = useState(false);
  const [amount, setAmount] = useState("");

  const [paying, setPaying] = useState(false);
  const [receipt, setReceipt] = useState<BillRecord | null>(null);
  const [history, setHistory] = useState<BillRecord[]>([]);

  useEffect(() => {
    getBillCategories()
      .then((rows) => setCategories(Array.isArray(rows) ? rows : []))
      .catch(() => setUnavailable(true));
    getMyBills()
      // Defensive: a shape change here must degrade to "no history", never
      // take the page down.
      .then((rows) => setHistory(Array.isArray(rows) ? rows : []))
      .catch(() => setHistory([]));
  }, []);

  const pickCategory = useCallback(async (c: BillCategory) => {
    setCategory(c); setBiller(null); setItems(null); setItem(null);
    setValidated(null); setCustomerRef(""); setAmount("");
    setBillers(null);
    try {
      // The CODE, never the display name — the provider matches on the code.
      setBillers(await getBillers(c.code ?? c.name));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load billers.");
    }
  }, []);

  const pickBiller = useCallback(async (b: Biller) => {
    setBiller(b); setItem(null); setValidated(null); setItems(null);
    try {
      const list = await getBillItems(b.biller_code);
      setItems(list);
      /*
        A STEP THAT OFFERS NO CHOICE IS NOT A STEP.

        Airtime is the case that made this obvious, and the reason is in the
        data rather than the layout. Flutterwave returns four billers for
        AIRTIME - MTN, Airtel, Glo, 9mobile - and then, under EVERY one of
        them, four "packages" named after all four networks:

            AT099  MTN VTU
            AT099  GLO Nigeria
            AT099  9Mobile
            AT099  Airtel Nigeria

        Identical item codes. So picking MTN and then being offered Glo is not
        just confusing, it is a choice with no consequence: all four send
        AT099, and the network is decided by the BILLER. Whichever was tapped,
        the same thing happened, which is exactly how it felt to use.

        So the test is not "how many packages" but "how many DISTINCT ones".
        One real option, whatever the list length, selects itself and the flow
        moves on. A genuine choice - a DSTV bouquet, a data bundle - has
        different codes and is still asked.
      */
      const distinct = new Set(list.map((i) => i.item_code));
      if (distinct.size === 1 && list.length > 0) {
        const only = list[0];
        setItem(only);
        setAmount(only.amount > 0 ? String(only.amount) : "");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load packages.");
    }
  }, []);

  const pickItem = useCallback((i: BillItem) => {
    setItem(i);
    setValidated(null);
    // A fixed-price package (a DSTV bouquet) sets its own amount; an open one
    // (airtime) lets the payer choose.
    setAmount(i.amount > 0 ? String(i.amount) : "");
  }, []);

  async function onValidate() {
    if (!item || !customerRef.trim()) return;
    setValidating(true); setError(null);
    try {
      const result = await validateBillCustomer(item.item_code, customerRef.trim());
      setValidated({ name: result.name });
    } catch (e) {
      setValidated(null);
      setError(e instanceof Error ? e.message : "We could not confirm that number.");
    } finally {
      setValidating(false);
    }
  }

  async function onPay() {
    if (!category || !biller || !item) return;
    const naira = Number(amount);
    if (!Number.isFinite(naira) || naira < 50) {
      setError("Enter an amount of ₦50 or more.");
      return;
    }
    const customer = checkoutCustomerFromSession(user);
    if (!customer) {
      setError("We need an email on your account before you can pay.");
      return;
    }

    setPaying(true); setError(null);
    try {
      const { billPaymentId, flutterwaveConfig } = await initBillPayment({
        category: category.name,
        billerCode: biller.biller_code,
        itemCode: item.item_code,
        billerName: biller.name,
        customerRef: customerRef.trim(),
        amount: naira,
      });

      const result = await openFlutterwaveCheckout(flutterwaveConfig, customer, {
        title: biller.name,
        description: `${item.name} for ${customerRef.trim()}`,
      }, {
        verifyPath: `/api/hub/bills/${billPaymentId}/verify`,
        verifyShape: "camel_id_only",
        successPath: "/services/pay",
        label: "Your bill",
      });

      const record = await verifyBillPayment(billPaymentId, result.transaction_id);
      setReceipt(record);
      setHistory((h) => [record, ...h]);
    } catch (e) {
      if (isFlutterwaveCancelled(e)) {
        setError(null);
      } else {
        setError(e instanceof Error ? e.message : "That payment did not complete.");
      }
    } finally {
      setPaying(false);
    }
  }

  // Bills Payment was switched off here (product owner, 5 Sep 2026) pending
  // the backend fix for the delivery-confirmation bug it was paused for. That
  // fix has since shipped (bill-payment.service.ts now waits for Flutterwave
  // to actually confirm a top-up instead of assuming it), so the catalogue's
  // own `live` check is back to being the only gate on this route.
  if (live === false) {
    return (
      <ServiceComingSoon
        name="Bills Payment"
        icon="Zap"
        note="We are finishing the partner rollout. It opens here first, and nothing is charged until it does."
      />
    );
  }

  if (live === null) {
    return <ServiceGateLoading />;
  }

  if (receipt) {
    // Flutterwave confirms the top-up asynchronously, so a successful checkout
    // usually comes back "processing", not "delivered" yet. Saying "delivered"
    // here regardless of that would tell the customer a top-up landed before
    // it actually has, the same gap the backend fix on this flow closed.
    const isDelivered = receipt.status === "delivered";
    return (
      <div className="mx-auto flex w-full flex-col gap-[18px] p-[16px_16px_96px] xl:max-w-[900px] xl:gap-[22px] xl:p-[30px_28px_64px]">
        <ProfileBackButton />
        <div className="flex flex-col items-center gap-[10px] rounded-[var(--radius-card)] border border-[var(--border-decor)] bg-[var(--surface-card)] p-[26px] text-center">
          <span className="grid h-[54px] w-[54px] place-items-center rounded-full bg-[var(--decor-tint)]">
            <Icon name={isDelivered ? "Check" : "Clock"} size={26} color="var(--accent)" strokeWidth={2.4} />
          </span>
          <span className="text-[19px] font-bold text-[var(--text-primary)]">
            {isDelivered ? "Payment delivered" : "Payment received, delivering now"}
          </span>
          <span className="text-[14px] text-[var(--text-secondary)]">
            {formatNaira(receipt.amount)} to {receipt.billerName} for {receipt.customerRef}
          </span>
          {!isDelivered ? (
            <span className="text-[12.5px] text-[var(--text-muted)]">
              Your payment went through and this usually lands within a few minutes. You do not need to pay again.
            </span>
          ) : null}
          {receipt.providerReference ? (
            <span className="text-[12.5px] text-[var(--text-muted)]">Reference {receipt.providerReference}</span>
          ) : null}
          <Button className="mt-2" onClick={() => { setReceipt(null); setCategory(null); setBillers(null); }}>
            Pay another bill
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full flex-col gap-[18px] p-[16px_16px_96px] xl:max-w-[900px] xl:gap-[22px] xl:p-[30px_28px_64px]">
      {/* Compact, in the row: the floating variant covers the eyebrow. */}
      <div className="flex flex-col gap-[6px]">
        <div className="flex items-center gap-[10px]">
          <ProfileBackButton compact />
          <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--accent)]">Bills Payment</span>
        </div>
        <h1 className="m-0 text-[24px] font-bold tracking-[-0.02em] text-[var(--text-primary)]">Pay a bill</h1>
        <p className="m-0 text-[14px] leading-[1.5] text-[var(--text-secondary)]">
          Airtime, data, electricity and cable. Paid straight from the app.
        </p>
      </div>

      {error ? <ErrorState title="Something went wrong" body={error} /> : null}

      {/*
        WHAT YOU HAVE CHOSEN, AND HOW TO UNDO IT.

        Showing one step at a time is only an improvement if the earlier
        answers stay visible and changeable. Without this the flow would be a
        wizard you can enter but not correct, which is worse than the stacked
        pills it replaces.

        Each crumb clears itself and everything after it, so going back to the
        category cannot leave a biller from a different category selected.
      */}
      {category ? (
        <div className="flex flex-wrap items-center gap-[8px]">
          <Crumb
            label={category.name}
            onClear={() => {
              setCategory(null); setBillers(null); setBiller(null);
              setItems(null); setItem(null); setValidated(null); setAmount("");
            }}
          />
          {biller ? (
            <Crumb
              label={biller.name}
              onClear={() => {
                setBiller(null); setItems(null); setItem(null);
                setValidated(null); setAmount("");
              }}
            />
          ) : null}
          {item && new Set((items ?? []).map((i) => i.item_code)).size > 1 ? (
            <Crumb
              label={item.name}
              onClear={() => { setItem(null); setValidated(null); setAmount(""); }}
            />
          ) : null}
        </div>
      ) : null}

      {unavailable ? (
        <Callout title="Bill payments are not switched on yet">
          Our payment provider has not enabled this account for bills. Nothing you do here would go through, so we
          have turned the form off until it is live.
        </Callout>
      ) : null}

      {/*
        ONE QUESTION AT A TIME, ON CARDS.

        This used to be four rows of identical pills stacked down one screen,
        all visible at once, so "what am I paying" and "which package" looked
        like the same kind of choice and the page grew as you went. It reads as
        the services and legal screens do now: a grid of real cards, one
        decision on screen, and a line at the top saying what you have already
        chosen with a way back to change it.
      */}
      {unavailable ? null : !category ? (
        !categories ? (
          <Skeleton variant="row" />
        ) : (
          <Section title="What are you paying for?">
            <div className="grid grid-cols-2 gap-[10px]">
              {categories.map((c, i) => (
                <TileCard
                  key={c.id}
                  size="md"
                  title={c.name}
                  icon={iconFor(c)}
                  index={i}
                  onClick={() => void pickCategory(c)}
                />
              ))}
            </div>
          </Section>
        )
      ) : null}

      {category && !biller ? (
        <Section title={`Who are you paying for ${category.name.toLowerCase()}?`}>
          {!billers ? (
            <Skeleton variant="row" />
          ) : (
            <div className="grid grid-cols-2 gap-[10px]">
              {billers.map((b, i) => (
                <TileCard
                  key={b.biller_code}
                  size="md"
                  title={b.name}
                  index={i + 3}
                  onClick={() => void pickBiller(b)}
                />
              ))}
            </div>
          )}
        </Section>
      ) : null}

      {biller && !item ? (
        <Section title="Which package?">
          {!items ? (
            <Skeleton variant="row" />
          ) : (
            <div className="flex flex-col gap-[8px]">
              {items.map((i, n) => (
                <button
                  key={`${i.item_code}:${n}`}
                  type="button"
                  onClick={() => pickItem(i)}
                  className="flex items-center justify-between gap-[12px] rounded-[var(--radius-input)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[14px_15px] text-left transition-colors hover:border-[var(--accent)]"
                >
                  <span className="text-[14.5px] font-semibold text-[var(--text-primary)]">{i.name}</span>
                  {i.amount > 0 ? (
                    <span className="shrink-0 text-[14.5px] font-semibold text-[var(--text-secondary)] [font-feature-settings:var(--font-feature-tabular)]">
                      {formatNaira(i.amount)}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          )}
        </Section>
      ) : null}

      {/*
        No step NUMBER in this title. Steps here collapse: airtime has no real
        package choice, so numbering the last one "4" was wrong on the most
        common bill in the product, and would go wrong again the next time a
        step is skipped. The title says what the step holds instead - and not
        the field's own name, which would read "Which mobile number?" directly
        above a box labelled "Mobile Number".
      */}
      {item ? (
        <Section title="Number and amount">
          <div className="flex flex-col gap-[12px]">
            <Input
              label={item.label_name ?? "Number"}
              value={customerRef}
              onChange={(e) => { setCustomerRef(e.target.value); setValidated(null); }}
              placeholder={item.label_name?.toLowerCase().includes("meter") ? "e.g. 04123456789" : "e.g. 08031234567"}
            />
            {validated ? (
              <span className="flex items-center gap-2 text-[13.5px] text-[var(--text-secondary)]">
                <Icon name="Check" size={15} color="var(--accent)" strokeWidth={2.4} />
                {validated.name ?? "Confirmed"}
              </span>
            ) : (
              <Button variant="secondary" size="sm" onClick={onValidate} disabled={validating || !customerRef.trim()}>
                {validating ? "Checking…" : "Confirm this number"}
              </Button>
            )}

            <Input
              label="Amount (₦)"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
              inputMode="numeric"
              disabled={item.amount > 0}
            />

            {/* Paying before the number is confirmed is how money goes to a
                stranger's meter, so the button stays shut until it is. */}
            <Button full onClick={onPay} disabled={paying || !validated || !amount}>
              {paying ? "Opening checkout…" : `Pay ${amount ? formatNaira(Number(amount)) : ""}`}
            </Button>
          </div>
        </Section>
      ) : null}

      {history.length ? (
        <Section title="Recent">
          <div className="flex flex-col gap-[8px] xl:grid xl:grid-cols-[repeat(auto-fill,minmax(280px,1fr))] xl:gap-[10px]">
            {history.slice(0, 8).map((h) => (
              <div key={h.id} className="flex items-center justify-between rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[14px]">
                <span className="flex flex-col">
                  <span className="text-[14px] font-semibold text-[var(--text-primary)]">{h.billerName}</span>
                  <span className="text-[12.5px] text-[var(--text-muted)]">{h.customerRef}</span>
                </span>
                <span className="flex flex-col items-end">
                  <span className="text-[14px] font-semibold text-[var(--text-primary)]">{formatNaira(h.amount)}</span>
                  <span className={`text-[12px] ${h.status === "delivered" ? "text-[var(--accent)]" : "text-[var(--text-muted)]"}`}>
                    {billStatusLabel(h.status)}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </Section>
      ) : null}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-[10px]">
      <span className="text-[13px] font-semibold text-[var(--text-secondary)]">{title}</span>
      {children}
    </div>
  );
}

function Chips({
  options,
  selected,
  onSelect,
}: {
  options: { key: string; label: string }[];
  selected: string | null;
  onSelect: (key: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          onClick={() => onSelect(o.key)}
          className={`rounded-[var(--radius-chip)] border px-[14px] py-2 text-[13px] ${
            selected === o.key
              ? "border-transparent bg-[var(--accent)] font-semibold text-[var(--text-on-accent)] hover:bg-[var(--accent-hover)] active:bg-[var(--accent-press)]"
              : "border-[var(--border-hairline)] bg-[var(--surface-tag)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] active:bg-[var(--surface-press)]"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/**
 * One answer already given, with a way to take it back.
 *
 * The X is the whole point: a step you cannot revisit turns a mistyped tap
 * into a reload.
 */
/*
  THE WHOLE CRUMB IS THE BUTTON, not the little x on the end of it.

  It was built with only the x clickable, which fails twice: the x is an 18px
  target on a phone, and the thing people actually aim at is the word. Tapping
  "Cable TV" did nothing at all, so the way back looked broken even though it
  was there.
*/
function Crumb({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <button
      type="button"
      onClick={onClear}
      aria-label={`Change ${label}`}
      className="inline-flex items-center gap-[7px] rounded-full border border-[var(--border-selected)] bg-[var(--accent-tint)] py-[6px] pl-[12px] pr-[10px] text-[13px] font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-card)]"
    >
      {label}
      <Icon name="X" size={12} strokeWidth={2.6} color="var(--text-muted)" />
    </button>
  );
}
