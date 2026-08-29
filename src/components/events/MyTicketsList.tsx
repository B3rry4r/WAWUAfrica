"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { myTickets } from "@/lib/api/event-tickets";
import { eventDateParts } from "@/lib/event-date";
import type { EventTicket } from "@/types/event-tickets";
import { Button, Callout, EmptyState, ErrorState, Icon, QrCode, Skeleton, StatusPill } from "@/components/ui";

/**
 * My tickets — the wallet.
 *
 * ── WHAT A TICKET IS ALLOWED TO CLAIM ──────────────────────────────────────
 * A QR is an instruction to walk up to a door, so it is shown ONLY for a
 * ticket that will actually open one. Three states do not get one:
 *
 *   checked_in — already through. Showing a scannable code invites somebody
 *                to queue again and be turned away in front of everyone.
 *   void       — the event was cancelled. The money is already back; the code
 *                would fail at the door with no explanation attached.
 *   cancelled  — same, from the event's side rather than the ticket's, and
 *     event      the reason is stated rather than left as a dead QR.
 *
 * ── THE CODE IS PRINTED IN TEXT, ALWAYS ────────────────────────────────────
 * Under every QR, in mono, large enough to read aloud. The server's alphabet
 * has the confusable characters removed for exactly this: a cracked screen, a
 * camera that will not focus, a scanner with a flat battery. The fallback at
 * the door is a person reading the code out, and that only works if the code
 * is on the screen.
 */
export function MyTicketsList() {
  const [tickets, setTickets] = useState<EventTicket[] | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setTickets(null);
    setError(null);
    myTickets()
      .then((rows) => active && setTickets(rows))
      .catch((e) => active && setError(e));
    return () => {
      active = false;
    };
  }, [reloadKey]);

  if (error) {
    return (
      <ErrorState
        title="Your tickets could not be loaded"
        error={error}
        onRetry={() => setReloadKey((k) => k + 1)}
      />
    );
  }

  if (tickets === null) {
    return (
      <div className="flex flex-col gap-[14px]">
        <Skeleton className="h-[260px] w-full" />
        <Skeleton className="h-[260px] w-full" />
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <EmptyState
        icon="Ticket"
        title="No tickets yet"
        caption="When you buy a ticket for an event it appears here, with a QR code to show at the door."
        action={<Button href="/events">Browse events</Button>}
      />
    );
  }

  // Live tickets first: at a door, the one you need is never the one you used
  // last month.
  const live = tickets.filter((t) => t.status === "valid" && !t.event.cancelledAt);
  const spent = tickets.filter((t) => t.status !== "valid" || t.event.cancelledAt);

  return (
    <div className="flex flex-col gap-[22px]">
      {live.length > 0 ? (
        <section className="flex flex-col gap-[14px]">
          <h2 className="m-0 text-[13px] font-bold uppercase tracking-[0.06em] text-[var(--text-muted)]">
            Ready to use
          </h2>
          <div className="grid gap-[14px] xl:grid-cols-2">
            {live.map((t) => (
              <TicketCard key={t.id} ticket={t} />
            ))}
          </div>
        </section>
      ) : null}

      {spent.length > 0 ? (
        <section className="flex flex-col gap-[14px]">
          <h2 className="m-0 text-[13px] font-bold uppercase tracking-[0.06em] text-[var(--text-muted)]">
            Used and cancelled
          </h2>
          <div className="grid gap-[14px] xl:grid-cols-2">
            {spent.map((t) => (
              <TicketCard key={t.id} ticket={t} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function TicketCard({ ticket }: { ticket: EventTicket }) {
  const cancelled = Boolean(ticket.event.cancelledAt) || ticket.status === "void";
  const used = ticket.status === "checked_in";
  const scannable = !cancelled && !used;
  const date = eventDateParts(ticket.event.startsAt);

  return (
    <article className="flex flex-col gap-[14px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[16px]">
      <div className="flex items-start justify-between gap-[12px]">
        <div className="flex min-w-0 flex-col gap-[4px]">
          <Link
            href={`/events/${ticket.event.id}`}
            className="truncate text-[15.5px] font-semibold text-[var(--text-primary)] no-underline hover:text-[var(--accent)]"
          >
            {ticket.event.name}
          </Link>
          <span className="flex items-center gap-[6px] text-[12.5px] text-[var(--text-secondary)]">
            <Icon name="Calendar" size={14} color="var(--text-muted)" />
            {date.weekday} {date.day} {date.month}
          </span>
          <span className="flex items-center gap-[6px] text-[12.5px] text-[var(--text-secondary)]">
            <Icon name="MapPin" size={14} color="var(--text-muted)" />
            {ticket.event.location}
          </span>
        </div>
        <StatusPill kind={cancelled ? "danger" : used ? "neutral" : "success"} size="sm">
          {cancelled ? "Cancelled" : used ? "Checked in" : ticket.ticketType.name}
        </StatusPill>
      </div>

      {scannable ? (
        <div className="flex flex-col items-center gap-[10px] rounded-[var(--radius-input)] bg-[var(--surface-page)] p-[16px]">
          <QrCode value={ticket.code} size={188} label={`Ticket ${ticket.code} for ${ticket.event.name}`} />
          {/*
            The code in text, every time. The door's fallback when a camera
            will not read a cracked screen is somebody reading this out, and
            the server's alphabet drops confusable characters for exactly that.
          */}
          <span className="select-all font-mono text-[14px] font-semibold tracking-[0.08em] text-[var(--text-primary)]">
            {ticket.code}
          </span>
          <span className="text-[11.5px] text-[var(--text-muted)]">{ticket.ticketType.name}</span>
        </div>
      ) : cancelled ? (
        <Callout tone="danger" title="This event was called off" full>
          Your money has been refunded. This ticket will not open the door.
        </Callout>
      ) : (
        <Callout tone="neutral" title="Already checked in" full>
          {ticket.checkedInAt
            ? `Scanned at ${new Date(ticket.checkedInAt).toLocaleString("en-NG", {
                day: "numeric",
                month: "short",
                hour: "numeric",
                minute: "2-digit",
              })}. `
            : ""}
          A ticket only goes through once.
        </Callout>
      )}
    </article>
  );
}
