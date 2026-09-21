"use client";

import { useEffect, useState } from "react";
import { listEvents } from "@/lib/api/events";
import { eventDateParts } from "@/lib/event-date";
import { EVENT_CATEGORY_LABEL, type WawuEvent } from "@/types/events";
import { Icon, MediaCard, Skeleton, EmptyState } from "@/components/ui";
import { Rail } from "./Rail";

/**
 * Upcoming Events, built to the reference
 * (refs/target-explore-desktop-structure.jpg).
 *
 * WHAT THE REFERENCE DRAWS. A slider of picture cards. The photograph is the
 * top of the card with a DATE BLOCK overlaid top-left (month over day) and a
 * save control top-right; the body underneath carries the title, the venue
 * with a pin, and two small tags. Not the three text rows in a bordered box
 * this used to be.
 *
 * WHY HERE. The bottom bar is locked at five slots for every account type and
 * the Create FAB is creator-only (CLAUDE.md, Navigation) - an event is
 * neither creator-gated nor a nav slot, so Explore is the honest home.
 *
 * Fetches on the client rather than in Explore's server component
 * deliberately: /api/hub/events is an authenticated read and the bearer token
 * lives in localStorage, so a server-side call would go out unauthenticated.
 *
 * Prices are NOT on these cards, and that is a limit of the call rather than
 * the old "events never have money" rule, which stopped being true on
 * 29 Aug 2026. The list endpoint returns `WawuEvent`; money lives on the
 * ticket TYPES hanging off an event, which this call does not fetch. The
 * event's own screen shows what a ticket costs, which is where somebody is
 * deciding to buy one. `goingCount` is an interest signal and never a count
 * of sales, so it is never presented as one.
 */
export function ExploreEvents() {
  const [events, setEvents] = useState<WawuEvent[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    listEvents({ view: "upcoming", perPage: 10 })
      .then((page) => {
        if (active) setEvents(page.events);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, []);

  if (events === null && !failed) {
    return (
      <Rail title="Upcoming events" caption="Find and attend events, concerts, workshops and more">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[248px] w-[236px] shrink-0 rounded-card" />
        ))}
      </Rail>
    );
  }

  if (failed || !events || events.length === 0) {
    return (
      <Rail
        title="Upcoming events"
        caption="Find and attend events, concerts, workshops and more"
        seeAllHref="/events"
      >
        <div className="w-full">
          {/*
            A FAILED FETCH IS NOT AN EMPTY CALENDAR.

            Both branches used to render the same sentence, so a reader whose
            request had just failed was told there were no events on. That is
            a statement about the product made from a network error, and it
            is the kind nobody reports: it looks like an answer.
          */}
          <EmptyState
            icon="CalendarDays"
            title={failed ? "We could not load the calendar" : "Nothing on the calendar yet"}
            caption={
              failed
                ? "Browse it directly and it will try again."
                : "Workshops, summits and meetups appear here once an admin approves them."
            }
            action={failed ? "Browse the calendar" : "Submit an event"}
            actionHref={failed ? "/events" : "/events/new"}
          />
        </div>
      </Rail>
    );
  }

  return (
    <Rail
      title="Upcoming events"
      caption="Find and attend events, concerts, workshops and more"
      seeAllHref="/events"
    >
      {events.map((e) => {
        const { month, day } = eventDateParts(e.startsAt);
        return (
          <MediaCard
            key={e.id}
            variant="stacked"
            href={`/events/${e.id}`}
            imageUrl={e.bannerUrl}
            aspect="aspect-[16/10]"
            className="w-[236px] bg-[var(--surface-card)]"
            fallback={<Icon name="CalendarDays" size={34} color="rgba(255,255,255,0.5)" />}
            badge={
              <span className="flex h-[46px] w-[42px] flex-col items-center justify-center rounded-[10px] bg-[var(--accent)] text-[var(--text-on-accent)]">
                <span className="text-[9px] font-bold uppercase tracking-[0.08em] opacity-85">{month}</span>
                <span className="text-[17px] font-bold leading-none">{day}</span>
              </span>
            }
            title={e.name}
            caption={e.location}
            tags={[EVENT_CATEGORY_LABEL[e.category], e.format === "online" ? "Online" : "In person"]}
          />
        );
      })}
    </Rail>
  );
}
