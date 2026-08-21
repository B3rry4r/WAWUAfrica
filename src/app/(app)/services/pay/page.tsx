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
import { Button, ErrorState, Icon, Input, Skeleton } from "@/components/ui";
import { formatNaira } from "@/lib/format";

/**
 * Bills Payment.
 *
 * Four steps, each one gated on the last: category, biller, package, then the
 * customer's own number. The number is validated with the biller before any
 * money moves, because a typo in a meter number sends real naira to a stranger
 * and there is no getting it back.
 */
export default function PayPage() {
  const { user } = useSession();

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
      setBillers(await getBillers(c.name));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load billers.");
    }
  }, []);

  const pickBiller = useCallback(async (b: Biller) => {
    setBiller(b); setItem(null); setValidated(null); setItems(null);
    try {
      setItems(await getBillItems(b.biller_code));
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

  if (receipt) {
    return (
      <div className="mx-auto flex w-full flex-col gap-[18px] p-[16px_16px_96px] xl:max-w-[900px] xl:gap-[22px] xl:p-[30px_28px_64px]">
        <ProfileBackButton />
        <div className="flex flex-col items-center gap-[10px] rounded-[var(--radius-card)] border border-[var(--border-accent)] bg-[var(--surface-card)] p-[26px] text-center">
          <span className="grid h-[54px] w-[54px] place-items-center rounded-full bg-[var(--accent-tint)]">
            <Icon name="Check" size={26} color="var(--accent)" strokeWidth={2.4} />
          </span>
          <span className="text-[19px] font-bold text-[var(--text-primary)]">Payment delivered</span>
          <span className="text-[14px] text-[var(--text-secondary)]">
            {formatNaira(receipt.amount)} to {receipt.billerName} for {receipt.customerRef}
          </span>
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
      <ProfileBackButton />
      <div className="flex flex-col gap-[6px]">
        <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--accent)]">Bills Payment</span>
        <h1 className="m-0 text-[24px] font-bold tracking-[-0.02em] text-[var(--text-primary)]">Pay a bill</h1>
        <p className="m-0 text-[14px] leading-[1.5] text-[var(--text-secondary)]">
          Airtime, data, electricity and cable. Paid straight from the app.
        </p>
      </div>

      {error ? <ErrorState title="Something went wrong" body={error} /> : null}

      {unavailable ? (
        <div className="flex items-start gap-[11px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[15px]">
          <Icon name="Info" size={18} color="var(--text-muted)" className="mt-[1px] shrink-0" />
          <span className="flex flex-col gap-[3px]">
            <span className="text-[14px] font-semibold text-[var(--text-primary)]">Bill payments are not switched on yet</span>
            <span className="text-[13px] leading-[1.5] text-[var(--text-secondary)]">
              Our payment provider has not enabled this account for bills. Nothing you do here would go through, so we
              have turned the form off until it is live.
            </span>
          </span>
        </div>
      ) : null}

      {unavailable ? null : !categories ? (
        <Skeleton variant="row" />
      ) : (
        <Section title="1. What are you paying for?">
          <Chips
            options={categories.map((c) => ({ key: String(c.id), label: c.name }))}
            selected={category ? String(category.id) : null}
            onSelect={(k) => {
              const found = categories.find((c) => String(c.id) === k);
              if (found) void pickCategory(found);
            }}
          />
        </Section>
      )}

      {category ? (
        <Section title="2. Who are you paying?">
          {!billers ? <Skeleton variant="row" /> : (
            <Chips
              options={billers.map((b) => ({ key: b.biller_code, label: b.name }))}
              selected={biller?.biller_code ?? null}
              onSelect={(k) => {
                const found = billers.find((b) => b.biller_code === k);
                if (found) void pickBiller(found);
              }}
            />
          )}
        </Section>
      ) : null}

      {biller ? (
        <Section title="3. Which package?">
          {!items ? <Skeleton variant="row" /> : (
            <Chips
              options={items.map((i) => ({
                key: i.item_code,
                label: i.amount > 0 ? `${i.name} · ${formatNaira(i.amount)}` : i.name,
              }))}
              selected={item?.item_code ?? null}
              onSelect={(k) => {
                const found = items.find((i) => i.item_code === k);
                if (found) pickItem(found);
              }}
            />
          )}
        </Section>
      ) : null}

      {item ? (
        <Section title={`4. ${item.label_name ?? "Your number"}`}>
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
                    {h.status}
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
              ? "border-transparent bg-[var(--accent)] font-semibold text-[var(--text-on-accent)]"
              : "border-[var(--border-hairline)] bg-[var(--surface-tag)] text-[var(--text-secondary)]"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
