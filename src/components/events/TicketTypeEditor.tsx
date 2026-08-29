"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listTicketTypes, setTicketTypes } from "@/lib/api/event-tickets";
import { describeError } from "@/lib/api/errors";
import { formatNaira } from "@/lib/format";
import {
  STANDARD_COMMISSION_RATE,
  TICKET_TIERS,
  TICKET_TIER_LABEL,
  type EventTicketType,
  type EventTicketTypeDraft,
  type TicketTier,
} from "@/types/event-tickets";
import { Button, Callout, ErrorState, Icon, Input, Skeleton, StatusPill } from "@/components/ui";

/**
 * Setting what is on sale.
 *
 * ── A TIER THAT HAS SOLD IS FROZEN, AND THE SCREEN SAYS SO FIRST ───────────
 * The backend refuses to reprice or remove a tier with sales against it. A
 * form that let an organiser type a new price and then rejected the save would
 * be teaching them the rule through a failure, so a sold tier renders its
 * price and quantity as read-only text with the reason attached: the price is
 * snapshotted on every order, so editing it would not change what anybody
 * paid — it would change what the ticket in their hand claims to be.
 *
 * Quantity can still be RAISED on a sold tier, because releasing more seats is
 * a normal thing to do and takes nothing away from anyone. It cannot be
 * lowered below what has already sold, which would un-sell a seat somebody is
 * holding.
 *
 * ── THE NET FIGURE IS SHOWN WHILE THEY TYPE ────────────────────────────────
 * An organiser pricing a ticket is deciding what they will earn, so they see
 * what reaches them next to what the buyer pays. It is an ESTIMATE at the
 * standard rate and says so — the server decides the real rate from the
 * organiser's tier and snapshots it per order, and a paid tier keeps more.
 *
 * ── NO CHARGE IS A TIER, NOT A PRICE OF ZERO ───────────────────────────────
 * Choosing the `free` tier fixes the price at nothing and issues immediately
 * without a payment provider. A paid tier priced at nothing is REFUSED: it is
 * a mistake nobody notices until it has sold out.
 */

interface Row extends EventTicketTypeDraft {
  /** Sales already against this tier. Non-zero means it is partly frozen. */
  sold: number;
}

function toRow(t: EventTicketType): Row {
  return {
    tier: t.tier,
    name: t.name,
    priceNaira: t.priceNaira,
    quantity: t.quantity,
    sold: t.sold,
    ...(t.salesStartAt ? { salesStartAt: t.salesStartAt } : {}),
    ...(t.salesEndAt ? { salesEndAt: t.salesEndAt } : {}),
  };
}

function blankRow(): Row {
  return { tier: "regular", name: "Regular", priceNaira: 5000, quantity: 100, sold: 0 };
}

export function TicketTypeEditor({ eventId, eventName }: { eventId: string; eventName: string }) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [loadError, setLoadError] = useState<unknown>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    listTicketTypes(eventId)
      .then((types) => active && setRows(types.map(toRow)))
      .catch((e) => active && setLoadError(e));
    return () => {
      active = false;
    };
  }, [eventId]);

  function update(index: number, patch: Partial<Row>) {
    setSaved(false);
    setRows((prev) => prev?.map((r, i) => (i === index ? { ...r, ...patch } : r)) ?? prev);
  }

  async function save() {
    if (!rows) return;
    setFailure(null);

    const bad = rows.find((r) => !r.name.trim() || r.quantity < 1 || (r.tier !== "free" && r.priceNaira < 1));
    if (bad) {
      setFailure(
        bad.tier !== "free" && bad.priceNaira < 1
          ? "A paid tier needs a price. Pick the No charge tier if entry costs nothing."
          : "Every tier needs a name and at least one ticket.",
      );
      return;
    }
    const shrunk = rows.find((r) => r.quantity < r.sold);
    if (shrunk) {
      setFailure(
        `${shrunk.name} has already sold ${shrunk.sold}. You can release more, but you cannot go below what people are already holding.`,
      );
      return;
    }

    setSaving(true);
    try {
      const result = await setTicketTypes(
        eventId,
        rows.map(({ sold: _sold, ...draft }) => ({
          ...draft,
          priceNaira: draft.tier === "free" ? 0 : draft.priceNaira,
        })),
      );
      setRows(result.map(toRow));
      setSaved(true);
    } catch (e) {
      setFailure(describeError(e).body);
    } finally {
      setSaving(false);
    }
  }

  if (loadError) return <ErrorState title="Tickets could not be loaded" error={loadError} />;

  if (rows === null) {
    return (
      <div className="flex flex-col gap-[12px]">
        <Skeleton className="h-[40px] w-[220px]" />
        <Skeleton className="h-[180px] w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[18px]">
      <div className="flex flex-col gap-[6px]">
        <Link
          href={`/events/${eventId}`}
          className="inline-flex w-fit items-center gap-[8px] text-[13.5px] font-semibold text-[var(--text-secondary)] no-underline hover:text-text-primary"
        >
          <Icon name="ArrowLeft" size={17} color="currentColor" />
          {eventName}
        </Link>
        <h1 className="m-0 text-[20px] font-semibold tracking-[-0.02em] text-[var(--text-primary)] xl:text-[26px]">
          Set up tickets
        </h1>
        <p className="m-0 max-w-[62ch] text-[13.5px] leading-[1.55] text-[var(--text-secondary)]">
          Add a tier for each kind of ticket you are selling. People can buy as soon as the event is on the calendar.
        </p>
      </div>

      <div className="flex flex-col gap-[14px]">
        {rows.map((row, i) => {
          const frozen = row.sold > 0;
          return (
            <div
              key={i}
              className="flex flex-col gap-[14px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[16px]"
            >
              <div className="flex flex-wrap items-center justify-between gap-[10px]">
                <div className="flex items-center gap-[10px]">
                  <span className="text-[13px] font-bold uppercase tracking-[0.05em] text-[var(--text-muted)]">
                    Tier {i + 1}
                  </span>
                  {frozen ? (
                    <StatusPill kind="info" size="sm">
                      {row.sold} sold
                    </StatusPill>
                  ) : null}
                </div>
                {frozen ? null : (
                  <button
                    type="button"
                    aria-label={`Remove tier ${i + 1}`}
                    onClick={() => setRows((prev) => prev?.filter((_, j) => j !== i) ?? prev)}
                    className="flex h-[30px] w-[30px] items-center justify-center rounded-full border border-[var(--border-hairline)] text-[var(--text-muted)] hover:text-[var(--danger)]"
                  >
                    <Icon name="X" size={15} color="currentColor" />
                  </button>
                )}
              </div>

              {frozen ? (
                <Callout tone="info" full>
                  {row.sold} {row.sold === 1 ? "person is" : "people are"} holding this ticket, so its name and price
                  are fixed. You can still release more seats.
                </Callout>
              ) : null}

              <div className="grid gap-[14px] xl:grid-cols-2">
                <label className="flex flex-col gap-[8px]">
                  <span className="text-[13px] font-semibold text-[var(--text-secondary)]">Kind</span>
                  <div className="relative">
                    <select
                      value={row.tier}
                      disabled={frozen}
                      onChange={(e) => {
                        const tier = e.target.value as TicketTier;
                        update(i, {
                          tier,
                          name: TICKET_TIER_LABEL[tier],
                          priceNaira: tier === "free" ? 0 : row.priceNaira || 5000,
                        });
                      }}
                      className="flex h-[52px] w-full cursor-pointer appearance-none items-center rounded-[var(--radius-input)] border border-[var(--border-hairline)] bg-[var(--surface-input)] px-[16px] text-[15px] text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {TICKET_TIERS.map((t) => (
                        <option key={t} value={t}>
                          {TICKET_TIER_LABEL[t]}
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
                </label>

                <label className="flex flex-col gap-[8px]">
                  <span className="text-[13px] font-semibold text-[var(--text-secondary)]">What buyers see</span>
                  <Input
                    value={row.name}
                    disabled={frozen}
                    onChange={(e) => update(i, { name: e.target.value.slice(0, 80) })}
                    placeholder="Regular"
                  />
                </label>

                <label className="flex flex-col gap-[8px]">
                  <span className="text-[13px] font-semibold text-[var(--text-secondary)]">Price</span>
                  {row.tier === "free" ? (
                    <span className="flex h-[52px] items-center rounded-[var(--radius-input)] border border-[var(--border-hairline)] bg-[var(--surface-page)] px-[16px] text-[15px] text-[var(--text-secondary)]">
                      No charge
                    </span>
                  ) : (
                    <>
                      <Input
                        value={row.priceNaira === 0 ? "" : String(row.priceNaira)}
                        disabled={frozen}
                        inputMode="numeric"
                        onChange={(e) =>
                          update(i, { priceNaira: Math.max(0, Number(e.target.value.replace(/\D/g, "")) || 0) })
                        }
                        placeholder="5000"
                      />
                      <span className="text-[11.5px] leading-[1.45] text-[var(--text-muted)]">
                        {row.priceNaira > 0
                          ? `Buyer pays ${formatNaira(row.priceNaira)} · about ${formatNaira(
                              Math.round(row.priceNaira * (1 - STANDARD_COMMISSION_RATE)),
                            )} reaches you. An estimate at the standard rate — a paid plan keeps more.`
                          : "In naira."}
                      </span>
                    </>
                  )}
                </label>

                <label className="flex flex-col gap-[8px]">
                  <span className="text-[13px] font-semibold text-[var(--text-secondary)]">How many</span>
                  <Input
                    value={row.quantity === 0 ? "" : String(row.quantity)}
                    inputMode="numeric"
                    onChange={(e) => update(i, { quantity: Math.max(0, Number(e.target.value.replace(/\D/g, "")) || 0) })}
                    placeholder="100"
                  />
                  {frozen ? (
                    <span className="text-[11.5px] text-[var(--text-muted)]">
                      At least {row.sold} — that is how many are already sold.
                    </span>
                  ) : null}
                </label>
              </div>
            </div>
          );
        })}
      </div>

      <div>
        <Button variant="secondary" icon="Plus" onClick={() => setRows((prev) => [...(prev ?? []), blankRow()])}>
          Add another tier
        </Button>
      </div>

      {failure ? (
        <Callout tone="danger" title="Not saved">
          {failure}
        </Callout>
      ) : null}

      {saved ? (
        <Callout tone="success" title="Saved">
          These tickets are on sale now.
        </Callout>
      ) : null}

      <div className="flex flex-wrap gap-[10px]">
        <Button loading={saving} disabled={saving || rows.length === 0} onClick={() => void save()}>
          Save tickets
        </Button>
        <Button variant="ghost" href={`/events/${eventId}/manage`}>
          See sales
        </Button>
      </div>
    </div>
  );
}
