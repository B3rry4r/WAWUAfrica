"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { cancelEvent, createReferral, ticketDashboard } from "@/lib/api/event-tickets";
import { getEvent } from "@/lib/api/events";
import { describeError } from "@/lib/api/errors";
import { formatNaira } from "@/lib/format";
import type { CancelEventResult, EventTicketDashboard } from "@/types/event-tickets";
import type { WawuEvent } from "@/types/events";
import { Button, Callout, ErrorState, Icon, Input, Sheet, Skeleton, StatusPill } from "@/components/ui";

/**
 * The organiser's numbers, and the two irreversible buttons.
 *
 * ── NET IS THE HEADLINE, GROSS IS THE FOOTNOTE ─────────────────────────────
 * `netNaira` is what actually reaches the organiser after WAWU's cut, and it
 * is the big number. Leading with gross is how an organiser plans around
 * money they will not receive and then feels short-changed at payout. The cut
 * is named in plain words underneath rather than left to be discovered.
 *
 * The rate is the PLATFORM'S existing 15% / 10%-on-a-paid-tier. Events do not
 * have a rate of their own, and this screen must never state one.
 *
 * ── CANCELLING IS NOT AN "ARE YOU SURE" ────────────────────────────────────
 * It voids every ticket and sends real money back to every buyer through
 * Flutterwave. So the sheet says how many people that is and how much, takes a
 * reason the buyers will be shown, and reports what came back —
 * INCLUDING the refunds Flutterwave would not accept. A non-zero
 * `refundsNeedingAttention` is somebody out of pocket until a human finishes
 * the job, and reporting a clean cancellation over it would bury that.
 *
 * ── NO WALLET ──────────────────────────────────────────────────────────────
 * There is no "withdraw" here and there must not be. Ticket revenue reaches
 * an organiser the way creator earnings do; a cashable balance is a CBN
 * licensing trigger in Nigeria.
 */
export function EventOrganiserDashboard({ eventId }: { eventId: string }) {
  const [event, setEvent] = useState<WawuEvent | null>(null);
  const [data, setData] = useState<EventTicketDashboard | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [refLabel, setRefLabel] = useState("");
  const [refBusy, setRefBusy] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelBusy, setCancelBusy] = useState(false);
  const [cancelled, setCancelled] = useState<CancelEventResult | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    let active = true;
    setError(null);
    Promise.all([getEvent(eventId), ticketDashboard(eventId)])
      .then(([ev, dash]) => {
        if (!active) return;
        setEvent(ev);
        setData(dash);
      })
      .catch((e) => active && setError(e));
    return () => {
      active = false;
    };
  }, [eventId, reloadKey]);

  if (error) {
    return <ErrorState title="This dashboard could not be loaded" error={error} onRetry={reload} />;
  }

  if (!data) {
    return (
      <div className="flex flex-col gap-[14px]">
        <Skeleton className="h-[40px] w-[240px]" />
        <Skeleton className="h-[120px] w-full" />
        <Skeleton className="h-[200px] w-full" />
      </div>
    );
  }

  const isCancelled = Boolean(event?.cancelledAt) || cancelled !== null;
  const shareOrigin = typeof window === "undefined" ? "" : window.location.origin;

  async function addReferral() {
    if (!refLabel.trim() || refBusy) return;
    setRefBusy(true);
    try {
      await createReferral(eventId, refLabel.trim());
      setRefLabel("");
      reload();
    } finally {
      setRefBusy(false);
    }
  }

  async function doCancel() {
    if (cancelReason.trim().length < 10 || cancelBusy) return;
    setCancelBusy(true);
    setCancelError(null);
    try {
      const outcome = await cancelEvent(eventId, cancelReason.trim());
      setCancelled(outcome);
      setCancelOpen(false);
      reload();
    } catch (e) {
      setCancelError(describeError(e).body);
    } finally {
      setCancelBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-[20px]">
      <div className="flex flex-col gap-[6px]">
        <Link
          href={`/events/${eventId}`}
          className="inline-flex w-fit items-center gap-[8px] text-[13.5px] font-semibold text-[var(--text-secondary)] no-underline hover:text-text-primary"
        >
          <Icon name="ArrowLeft" size={17} color="currentColor" />
          {data.eventName}
        </Link>
        <div className="flex flex-wrap items-center gap-[10px]">
          <h1 className="m-0 text-[20px] font-semibold tracking-[-0.02em] text-[var(--text-primary)] xl:text-[26px]">
            Ticket sales
          </h1>
          {isCancelled ? <StatusPill kind="danger" size="sm">Cancelled</StatusPill> : null}
        </div>
      </div>

      {cancelled ? (
        <Callout
          tone={cancelled.refundsNeedingAttention > 0 ? "warning" : "success"}
          title={
            cancelled.refundsNeedingAttention > 0
              ? "Cancelled, but some refunds need a person"
              : "Cancelled, and everybody has been refunded"
          }
          full
        >
          {cancelled.ordersRefunded} order{cancelled.ordersRefunded === 1 ? "" : "s"} refunded.{" "}
          {cancelled.refundsNeedingAttention > 0
            ? `${cancelled.refundsNeedingAttention} could not be sent automatically — WAWU support has been notified and will finish them by hand. Those buyers are still owed their money.`
            : "Every ticket is void."}
        </Callout>
      ) : null}

      <section className="grid grid-cols-2 gap-[12px] xl:grid-cols-4">
        <Stat label="Tickets sold" value={String(data.ticketsSold)} />
        <Stat label="Checked in" value={String(data.checkedIn)} />
        <Stat label="Still available" value={String(data.remaining)} />
        <Stat
          label="Yours after WAWU's cut"
          value={data.netNaira === 0 ? "Nothing yet" : formatNaira(data.netNaira)}
          emphasis
          footnote={
            data.grossNaira === 0
              ? undefined
              : `${formatNaira(data.grossNaira)} taken in. WAWU keeps the same cut as everything else you sell here.`
          }
        />
      </section>

      {/*
        The door and the shared links are hidden once the event is cancelled.
        Both are dead there — nobody can be checked in to an event that is not
        happening, and a link that sells a voided ticket is worse than no link.
        Leaving them on screen was the state this shipped in first, and it read
        as though the event were still running.
      */}
      {!isCancelled ? (
        <section className="flex flex-col gap-[12px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[16px]">
          <div className="flex flex-wrap items-center justify-between gap-[10px]">
            <h2 className="m-0 text-[15.5px] font-semibold text-[var(--text-primary)]">At the door</h2>
            <Button href={`/events/${eventId}/scan`} size="sm" icon="ScanLine">
              Open the scanner
            </Button>
          </div>
          <p className="m-0 text-[12.5px] leading-[1.55] text-[var(--text-secondary)]">
            Scan a ticket&apos;s QR, or type its code. A ticket only goes through once — two people scanning the same
            code at the same moment get one CHECKED IN and one ALREADY USED.
          </p>
        </section>
      ) : null}

      {!isCancelled ? (
      <section className="flex flex-col gap-[12px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[16px]">
        <h2 className="m-0 text-[15.5px] font-semibold text-[var(--text-primary)]">Shared links</h2>
        <p className="m-0 text-[12.5px] leading-[1.55] text-[var(--text-secondary)]">
          Give each place you post the event its own link, and you will see which one actually sold tickets.
        </p>

        {data.referrals.length > 0 ? (
          <ul className="m-0 flex list-none flex-col gap-[8px] p-0">
            {data.referrals.map((r) => {
              const url = `${shareOrigin}/events/${eventId}?ref=${r.code}`;
              return (
                <li
                  key={r.code}
                  className="flex flex-wrap items-center justify-between gap-[10px] rounded-[var(--radius-input)] border border-[var(--border-hairline)] bg-[var(--surface-input)] p-[12px_13px]"
                >
                  <span className="flex min-w-0 flex-col gap-[2px]">
                    <span className="truncate text-[13.5px] font-semibold text-[var(--text-primary)]">{r.label}</span>
                    <span className="truncate font-mono text-[11.5px] text-[var(--text-muted)]">{url}</span>
                  </span>
                  <span className="flex items-center gap-[10px]">
                    <span className="text-[13.5px] font-semibold tabular-nums text-[var(--text-primary)]">
                      {r.revenueNaira === 0 ? "Nothing yet" : formatNaira(r.revenueNaira)}
                    </span>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        void navigator.clipboard?.writeText(url);
                        setCopied(r.code);
                      }}
                    >
                      {copied === r.code ? "Copied" : "Copy"}
                    </Button>
                  </span>
                </li>
              );
            })}
          </ul>
        ) : null}

        <div className="flex flex-wrap gap-[10px]">
          <Input
            value={refLabel}
            onChange={(e) => setRefLabel(e.target.value.slice(0, 60))}
            placeholder="Where you are posting it, e.g. Instagram bio"
            className="min-w-[200px] flex-1"
          />
          <Button variant="secondary" loading={refBusy} disabled={!refLabel.trim()} onClick={() => void addReferral()}>
            Make a link
          </Button>
        </div>
      </section>
      ) : null}

      {!isCancelled ? (
        <section className="flex flex-col gap-[12px] rounded-[var(--radius-card)] border border-[var(--border-danger,var(--border-hairline))] bg-[var(--surface-card)] p-[16px]">
          <h2 className="m-0 text-[15.5px] font-semibold text-[var(--text-primary)]">Call the event off</h2>
          <p className="m-0 text-[12.5px] leading-[1.55] text-[var(--text-secondary)]">
            Every ticket is voided and every buyer is refunded. This cannot be undone.
          </p>
          <div>
            <Button variant="danger" onClick={() => setCancelOpen(true)} icon="TriangleAlert">
              Cancel this event
            </Button>
          </div>
        </section>
      ) : null}

      <Sheet open={cancelOpen} onClose={() => setCancelOpen(false)} title="Cancel this event">
        <div className="flex flex-col gap-[14px]">
          <Callout tone="danger" title="This refunds real money" full>
            {data.ticketsSold === 0
              ? "Nobody has bought a ticket yet, so there is nothing to refund."
              : `${data.ticketsSold} ticket${data.ticketsSold === 1 ? " has" : "s have"} been sold. Every buyer gets ${
                  data.grossNaira === 0 ? "their money" : formatNaira(data.grossNaira)
                } back and their tickets stop working.`}
          </Callout>

          <label className="flex flex-col gap-[8px]">
            <span className="text-[13px] font-semibold text-[var(--text-secondary)]">
              Why. Everyone who bought a ticket is shown this.
            </span>
            <Input
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value.slice(0, 500))}
              placeholder="The venue withdrew and we could not find another in time."
            />
            <span className="text-[12px] text-[var(--text-muted)]">
              {cancelReason.trim().length < 10
                ? `${10 - cancelReason.trim().length} more characters — they have to be able to understand it.`
                : "They see this exactly as written."}
            </span>
          </label>

          {cancelError ? (
            <Callout tone="danger" title="The event was not cancelled" full>
              {cancelError}
            </Callout>
          ) : null}

          <div className="flex flex-wrap gap-[10px]">
            <Button variant="ghost" onClick={() => setCancelOpen(false)} disabled={cancelBusy}>
              Keep it running
            </Button>
            <Button
              variant="danger"
              loading={cancelBusy}
              disabled={cancelBusy || cancelReason.trim().length < 10}
              onClick={() => void doCancel()}
            >
              Cancel and refund everyone
            </Button>
          </div>
        </div>
      </Sheet>
    </div>
  );
}

function Stat({
  label,
  value,
  emphasis,
  footnote,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
  footnote?: string;
}) {
  return (
    <div
      className={[
        "flex flex-col gap-[4px] rounded-[var(--radius-card)] border p-[14px]",
        emphasis
          ? "border-[var(--accent)] bg-[var(--accent-tint)]"
          : "border-[var(--border-hairline)] bg-[var(--surface-card)]",
      ].join(" ")}
    >
      <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--text-muted)]">{label}</span>
      <span className="text-[21px] font-bold tabular-nums tracking-[-0.02em] text-[var(--text-primary)]">{value}</span>
      {footnote ? <span className="text-[11.5px] leading-[1.45] text-[var(--text-muted)]">{footnote}</span> : null}
    </div>
  );
}
