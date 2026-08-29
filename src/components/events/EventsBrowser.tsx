"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { getFeaturedEvent, listEvents } from "@/lib/api/events";
import {
  EVENT_CATEGORIES,
  EVENT_CATEGORY_LABEL,
  EVENT_FILTERS,
  type EventCategory,
  type EventView,
  type WawuEvent,
} from "@/types/events";
import { Button, EmptyState, ErrorState, Icon, Skeleton, Toast } from "@/components/ui";
import { EventCard } from "./EventCard";
import { EventFilterChips } from "./EventFilterChips";

/**
 * The Events calendar.
 *
 * Ported from the old app's /events screen (WAWUAfrica-new
 * src/app/(feed)/events/page.tsx): the same upcoming/past toggle, the same
 * eight filter chips, the same admin-pinned featured card above the list.
 *
 * DESKTOP. Below xl this is the mobile stack the old screen had. At xl the
 * shell already takes 244px for the sidebar, which leaves ~1036px at 1280 —
 * a single stacked column of cards across that is the "stretched mobile view"
 * this project keeps getting complained about. So the column is capped at a
 * real measure and the cards reflow into two, with the header becoming a
 * proper title row that carries the two host actions instead of hiding them
 * behind a round icon button.
 *
 * Nothing on this screen mentions a price, a ticket or a payment, because
 * there is no such thing on an event here. The only action is Going.
 */
export function EventsBrowser() {
  const [view, setView] = useState<EventView>("upcoming");
  const [filterId, setFilterId] = useState<string>("all");
  // Category is a SEPARATE axis from the format/type chips above it: "Music"
  // and "Webinar" are both true of the same event, and folding them into one
  // row would make choosing either silently cancel the other.
  const [category, setCategory] = useState<EventCategory | "">("");
  const [featured, setFeatured] = useState<WawuEvent | null>(null);
  const [events, setEvents] = useState<WawuEvent[] | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [goingError, setGoingError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const chip = EVENT_FILTERS.find((f) => f.id === filterId) ?? EVENT_FILTERS[0];

  useEffect(() => {
    let active = true;
    setEvents(null);
    setFeatured(null);
    setError(null);
    const params = { view, format: chip.format, type: chip.type, ...(category ? { category } : {}) };
    Promise.all([
      listEvents({ ...params, perPage: 50 }),
      // A pinned event only makes sense at the top of the upcoming calendar;
      // pinning something that already happened is not a thing an admin does.
      view === "upcoming" ? getFeaturedEvent(params) : Promise.resolve(null),
    ])
      .then(([page, pinned]) => {
        if (!active) return;
        setFeatured(pinned);
        setEvents(page.events.filter((e) => e.id !== pinned?.id));
      })
      .catch((e) => {
        if (active) setError(e);
      });
    return () => {
      active = false;
    };
  }, [view, chip.format, chip.type, category, reloadKey]);

  /** The server's own count after a Going write — never a locally guessed number. */
  const applyGoing = useCallback((id: string, next: { userGoing: boolean; goingCount: number }) => {
    const patch = (e: WawuEvent) => (e.id === id ? { ...e, ...next } : e);
    setEvents((prev) => (prev ? prev.map(patch) : prev));
    setFeatured((prev) => (prev ? patch(prev) : prev));
  }, []);

  const onGoingError = useCallback(() => {
    setGoingError("We couldn't save that. Try again in a moment.");
  }, []);

  const body = error ? (
    <ErrorState error={error} onRetry={() => setReloadKey((k) => k + 1)} />
  ) : events === null ? (
    <EventsSkeleton />
  ) : !featured && events.length === 0 ? (
    <EmptyState
      icon="CalendarDays"
      title={view === "past" ? "No past events yet" : "Nothing on the calendar for this filter"}
      caption={
        view === "past"
          ? "Recaps show up here once events wrap."
          : "Try another filter, or submit the event you are running."
      }
      action="Submit an event"
      actionHref="/events/new"
    />
  ) : (
    <div className="flex flex-col gap-[14px]">
      {featured ? (
        <EventCard
          event={featured}
          variant="featured"
          onGoingChange={(next) => applyGoing(featured.id, next)}
          onGoingError={onGoingError}
        />
      ) : null}
      <div className="flex flex-col gap-[14px] xl:grid xl:grid-cols-2 xl:items-start xl:gap-[18px]">
        {events.map((e) => (
          <EventCard
            key={e.id}
            event={e}
            onGoingChange={(next) => applyGoing(e.id, next)}
            onGoingError={onGoingError}
          />
        ))}
      </div>
    </div>
  );

  return (
    <>
      {goingError ? (
        <Toast kind="error" title="That didn't go through" body={goingError} onDismiss={() => setGoingError(null)} />
      ) : null}

      <div className="flex flex-col gap-[14px] p-[14px_16px_96px] xl:mx-auto xl:w-full xl:max-w-[1120px] xl:gap-[22px] xl:p-[30px_28px_64px]">
        {/* Title row. On a phone the host actions are a single icon button and
            a text link; at desktop there is room to name both. */}
        <div className="flex items-start gap-[10px] xl:items-end">
          <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
            <h1 className="text-[20px] font-semibold tracking-[-0.02em] text-[var(--text-primary)] xl:text-[26px]">
              Events
            </h1>
            <p className="m-0 max-w-[62ch] text-[13px] leading-[1.5] text-[var(--text-secondary)] xl:text-[14px]">
              Workshops, summits and meetups across Nigeria, submitted by the people running them and checked before
              they go on the calendar.
            </p>
          </div>
          <Link
            href="/tickets"
            className="hidden shrink-0 items-center gap-[7px] text-[13.5px] font-semibold text-[var(--text-secondary)] no-underline hover:text-text-primary xl:inline-flex"
          >
            <Icon name="Ticket" size={16} color="currentColor" />
            My tickets
          </Link>
          <Link
            href="/events/mine"
            className="hidden shrink-0 items-center gap-[7px] text-[13.5px] font-semibold text-[var(--text-secondary)] no-underline hover:text-text-primary xl:inline-flex"
          >
            <Icon name="ClipboardList" size={16} color="currentColor" />
            My submissions
          </Link>
          <span className="hidden shrink-0 xl:block">
            <Button href="/events/new" icon="Plus" size="sm">
              Submit an event
            </Button>
          </span>
          <Link
            href="/events/new"
            aria-label="Submit an event"
            className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-full bg-[var(--accent)] text-[var(--text-on-accent)] no-underline hover:bg-accent-hover active:bg-accent-press xl:hidden"
          >
            <Icon name="Plus" size={18} strokeWidth={2.2} color="currentColor" />
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-[16px] xl:hidden">
          <Link
            href="/tickets"
            className="inline-flex items-center gap-[7px] text-[13px] font-semibold text-[var(--accent)] no-underline hover:text-text-primary"
          >
            <Icon name="Ticket" size={15} color="currentColor" />
            My tickets
          </Link>
          <Link
            href="/events/mine"
            className="inline-flex items-center gap-[7px] text-[13px] font-semibold text-[var(--accent)] no-underline hover:text-text-primary"
          >
            <Icon name="ClipboardList" size={15} color="currentColor" />
            My submissions
          </Link>
        </div>

        <div className="flex flex-col gap-[12px]">
          <div className="inline-flex self-start gap-[4px] rounded-full border border-[var(--border-hairline)] bg-[var(--surface-tag)] p-[4px]">
            {(["upcoming", "past"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                aria-pressed={view === v}
                className={`h-[34px] rounded-full px-[18px] text-[13px] font-semibold capitalize transition-colors ${
                  view === v
                    ? "bg-[var(--accent)] text-[var(--text-on-accent)]"
                    : "text-[var(--text-secondary)] hover:bg-surface-hover active:bg-surface-press"
                }`}
              >
                {v}
              </button>
            ))}
          </div>

          {/* Chips filter the upcoming calendar, exactly as they did before.
              A past-events archive is browsed by date, not by shape. */}
          {view === "upcoming" ? <EventFilterChips selected={filterId} onSelect={setFilterId} /> : null}

          {/* Browse by category. Scrolls on a phone rather than wrapping to
              three rows and pushing the calendar off the first screen. */}
          {view === "upcoming" ? (
            <div className="-mx-[16px] overflow-x-auto px-[16px] xl:mx-0 xl:overflow-visible xl:px-0">
              <div className="flex w-max gap-[7px] xl:w-full xl:flex-wrap">
                {([""] as Array<EventCategory | "">).concat(EVENT_CATEGORIES).map((c) => (
                  <button
                    key={c || "all"}
                    type="button"
                    onClick={() => setCategory(c)}
                    aria-pressed={category === c}
                    className={`h-[32px] shrink-0 rounded-full border px-[13px] text-[12.5px] font-semibold transition-colors ${
                      category === c
                        ? "border-[var(--accent)] bg-[var(--accent-tint)] text-[var(--accent)]"
                        : "border-[var(--border-hairline)] bg-[var(--surface-card)] text-[var(--text-secondary)] hover:border-[var(--accent)]"
                    }`}
                  >
                    {c === "" ? "Every category" : EVENT_CATEGORY_LABEL[c]}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {body}
      </div>
    </>
  );
}

function EventsSkeleton() {
  // Mirrors the loaded layout at both widths — a stack on a phone, the same
  // two-column grid at desktop. A single full-bleed bar here is what makes a
  // desktop first paint look like a stretched phone.
  return (
    <div className="flex flex-col gap-[14px] xl:grid xl:grid-cols-2 xl:gap-[18px]">
      {[0, 1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-[168px] rounded-card" />
      ))}
    </div>
  );
}
