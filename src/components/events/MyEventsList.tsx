"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listMyEvents } from "@/lib/api/events";
import { useSession } from "@/lib/auth/session-provider";
import { eventDateParts, eventTimeLine } from "@/lib/event-date";
import type { WawuEvent } from "@/types/events";
import { Button, EmptyState, ErrorState, Icon, Skeleton } from "@/components/ui";
import { EventDateBlock, EventFormatPill, EventStatusPill, EventTypePill } from "./EventPrimitives";

/**
 * The host's own submissions, at every status.
 *
 * This screen exists because of one specific dead end: an event sits in the
 * moderation queue, or gets turned down, and the person who submitted it has
 * no way to see either fact. The backend sends `lastDecisionReason` to the host
 * and to nobody else precisely so it can be shown here, verbatim — a rejection
 * nobody can read leaves resubmitting the same thing as the only move.
 *
 * Not creator-gated. Any signed-in account can submit an event, so any signed-
 * in account can have submissions to look at.
 */

const STATUS_LINE: Record<WawuEvent["status"], string> = {
  pending: "Waiting on an admin. Nobody else can see it yet.",
  published: "Live on the calendar.",
  rejected: "Not approved. Fix what the reviewer flagged and save to send it back.",
  removed: "Taken down by an admin and no longer on the calendar.",
  cancelled: "You called this off. Every ticket is void and every buyer has been refunded.",
};

export function MyEventsList() {
  const { user, hydrated } = useSession();
  const wawuId = user?.wawuId ?? "";
  const [events, setEvents] = useState<WawuEvent[] | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!hydrated) return;
    let active = true;
    setEvents(null);
    setError(null);
    listMyEvents(wawuId, { perPage: 50 })
      .then((page) => {
        if (active) setEvents(page.events);
      })
      .catch((e) => {
        if (active) setError(e);
      });
    return () => {
      active = false;
    };
  }, [wawuId, hydrated, reloadKey]);

  return (
    <div className="flex flex-col gap-[16px] p-[14px_16px_96px] xl:mx-auto xl:w-full xl:max-w-[860px] xl:gap-[22px] xl:p-[30px_28px_64px]">
      <Link
        href="/events"
        className="inline-flex w-fit items-center gap-[8px] text-[13.5px] font-semibold text-[var(--text-secondary)] no-underline hover:text-text-primary"
      >
        <Icon name="ArrowLeft" size={17} color="currentColor" />
        Events
      </Link>

      <div className="flex flex-wrap items-end gap-[12px]">
        <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
          <h1 className="text-[20px] font-semibold tracking-[-0.02em] text-[var(--text-primary)] xl:text-[26px]">
            My submissions
          </h1>
          <p className="m-0 max-w-[62ch] text-[13px] leading-[1.5] text-[var(--text-secondary)] xl:text-[14px]">
            Everything you have sent in, at every stage. An admin reads each one before it reaches the calendar.
          </p>
        </div>
        <Button href="/events/new" icon="Plus" size="sm">
          Submit an event
        </Button>
      </div>

      {error ? (
        <ErrorState error={error} onRetry={() => setReloadKey((k) => k + 1)} />
      ) : events === null ? (
        <div className="flex flex-col gap-[12px]">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-[132px] rounded-card" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <EmptyState
          icon="CalendarPlus"
          title="You haven't submitted an event yet"
          caption="Anyone with a WAWU account can put one on the calendar. It goes for review first."
          action="Submit an event"
          actionHref="/events/new"
        />
      ) : (
        <div className="flex flex-col gap-[12px]">
          {events.map((event) => (
            <MyEventRow key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}

function MyEventRow({ event }: { event: WawuEvent }) {
  const { full } = eventDateParts(event.startsAt);
  return (
    <div className="flex flex-col gap-[12px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[14px] xl:p-[18px]">
      <div className="flex gap-[14px]">
        <EventDateBlock startsAt={event.startsAt} dim={event.status !== "published"} />
        <div className="flex min-w-0 flex-1 flex-col gap-[4px]">
          <div className="flex flex-wrap items-center gap-[8px]">
            <EventStatusPill status={event.status} />
          </div>
          <Link
            href={`/events/${event.id}`}
            className="line-clamp-2 text-[15.5px] font-semibold leading-[1.28] text-[var(--text-primary)] no-underline hover:text-accent"
          >
            {event.name}
          </Link>
          <span className="text-[12.5px] text-[var(--text-secondary)]">
            {full} · {eventTimeLine(event)} · {event.location}
          </span>
          <span className="text-[12.5px] leading-[1.5] text-[var(--text-muted)]">{STATUS_LINE[event.status]}</span>
        </div>
      </div>

      {/* Verbatim, and never summarised. It is the only thing that tells a host
          what to change. */}
      {event.lastDecisionReason ? (
        <p className="m-0 rounded-input border border-danger bg-[var(--danger-tint)] px-[12px] py-[10px] text-[12.5px] leading-[1.55] text-[var(--text-primary)]">
          <span className="font-semibold">Reviewer&apos;s note: </span>
          {event.lastDecisionReason}
        </p>
      ) : null}

      <div className="flex items-center gap-[8px]">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-[6px]">
          <EventFormatPill format={event.format} />
          <EventTypePill type={event.type} />
          {event.status === "published" ? (
            <span className="text-[12px] text-[var(--text-muted)]">{event.goingCount} going</span>
          ) : null}
        </div>
        <Button href={`/events/${event.id}/edit`} variant="secondary" size="sm" icon="Pencil">
          Edit
        </Button>
      </div>
    </div>
  );
}
