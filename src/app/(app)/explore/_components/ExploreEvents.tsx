"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listEvents } from "@/lib/api/events";
import { eventDateParts, eventTimeLine } from "@/lib/event-date";
import type { WawuEvent } from "@/types/events";
import { Icon, Skeleton } from "@/components/ui";

/**
 * Events, on Explore.
 *
 * WHY HERE. The bottom bar is locked at five slots for every account type and
 * the Create FAB is creator-only (CLAUDE.md § Navigation) — an event is
 * neither creator-gated nor a nav slot, so Explore is the honest home: it is
 * the "everything else WAWU can do" surface, it is a slot on both the mobile
 * bar and the desktop rail, and Services already reaches its own sub-tree from
 * exactly here.
 *
 * This fetches on the client rather than in Explore's server component
 * deliberately: /api/hub/events is an authenticated read and the bearer token
 * lives in localStorage, so a server-side call would go out unauthenticated.
 *
 * No price, no ticket, no amount appears on these rows. There is no such thing
 * on an event here.
 */
export function ExploreEvents() {
  const [events, setEvents] = useState<WawuEvent[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    listEvents({ view: "upcoming", perPage: 3 })
      .then((page) => {
        if (active) setEvents(page.events);
      })
      .catch(() => {
        // The section falls back to its two links. A failed preview is not
        // worth taking the route to Events off the screen.
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="flex flex-col gap-[11px]">
      <div className="flex items-center gap-[10px] px-[2px]">
        <span className="flex-1 text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--text-muted)]">
          Events
        </span>
        <Link
          href="/events"
          className="text-[12.5px] font-semibold text-[var(--accent)] no-underline hover:text-text-primary"
        >
          See all
        </Link>
      </div>

      <div className="flex flex-col gap-[10px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[12px] xl:p-[16px]">
        {events === null && !failed ? (
          <div className="flex flex-col gap-[8px]">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-[52px] rounded-input" />
            ))}
          </div>
        ) : events && events.length > 0 ? (
          <div className="flex flex-col gap-[4px] xl:grid xl:grid-cols-3 xl:gap-[12px]">
            {events.map((event) => (
              <EventRow key={event.id} event={event} />
            ))}
          </div>
        ) : failed ? (
          /*
            A FAILED FETCH IS NOT AN EMPTY CALENDAR.

            Both branches used to render the same sentence, so a reader whose
            request had just failed was told there were no events on. That is a
            statement about the product made from a network error, and it is
            the kind nobody reports: it looks like an answer.
          */
          <p className="m-0 px-[6px] py-[8px] text-[13px] leading-[1.5] text-[var(--text-secondary)]">
            We could not load the calendar just now. Browse it below and it will try again.
          </p>
        ) : (
          <p className="m-0 px-[6px] py-[8px] text-[13px] leading-[1.5] text-[var(--text-secondary)]">
            Nothing on the calendar right now. Workshops, summits and meetups show up here once an admin approves
            them.
          </p>
        )}

        <div className="flex flex-wrap items-center gap-[8px] border-t border-[var(--border-hairline)] pt-[10px]">
          <Link
            href="/events"
            className="inline-flex items-center gap-[6px] text-[13px] font-semibold text-[var(--text-secondary)] no-underline hover:text-text-primary"
          >
            <Icon name="CalendarDays" size={15} color="currentColor" />
            Browse the calendar
          </Link>
          <span className="flex-1" />
          <Link
            href="/events/new"
            className="inline-flex items-center gap-[6px] text-[13px] font-semibold text-[var(--accent)] no-underline hover:text-text-primary"
          >
            <Icon name="Plus" size={15} strokeWidth={2.2} color="currentColor" />
            Submit an event
          </Link>
        </div>
      </div>
    </section>
  );
}

function EventRow({ event }: { event: WawuEvent }) {
  const { month, day } = eventDateParts(event.startsAt);
  return (
    <Link
      href={`/events/${event.id}`}
      className="flex items-center gap-[12px] rounded-input px-[6px] py-[8px] no-underline hover:bg-surface-hover active:bg-surface-press xl:items-start xl:px-[8px]"
    >
      <span className="flex h-[42px] w-[42px] shrink-0 flex-col items-center justify-center rounded-[var(--radius-input)] bg-[var(--accent)] text-[var(--text-on-accent)]">
        <span className="text-[9px] font-semibold uppercase tracking-[0.08em] opacity-80">{month}</span>
        <span className="text-[16px] font-bold leading-none">{day}</span>
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-[2px]">
        <span className="line-clamp-1 text-[14px] font-semibold text-[var(--text-primary)] xl:line-clamp-2">
          {event.name}
        </span>
        <span className="truncate text-[12px] text-[var(--text-muted)]">
          {event.location} · {eventTimeLine(event)}
        </span>
      </span>
      <span className="shrink-0 xl:hidden">
        <Icon name="ChevronRight" size={16} color="var(--text-muted)" />
      </span>
    </Link>
  );
}
