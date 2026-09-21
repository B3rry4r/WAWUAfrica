"use client";

import { useCallback, useEffect, useState } from "react";
import { getFeaturedEvent, listEvents } from "@/lib/api/events";
import { lowestTicketPrices } from "@/lib/api/event-tickets";
import {
  EVENT_CATEGORIES,
  EVENT_CATEGORY_LABEL,
  EVENT_FILTERS,
  type EventCategory,
  type EventView,
  type WawuEvent,
} from "@/types/events";
import {
  ChoiceChips,
  CtaBanner,
  EmptyState,
  ErrorState,
  Icon,
  SectionHeader,
  Sheet,
  Skeleton,
  Toast,
} from "@/components/ui";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { EventCard } from "./EventCard";

/**
 * The Events calendar, built to the approved mobile design
 * (refs/mobile/ref-events.png).
 *
 * WHAT THE REFERENCE DRAWS, top to bottom: a back/title bar with a calendar
 * control on the right; three tabs (Discover, My Events, Host Event) with the
 * first one filled; one full-bleed hero event card carrying a date chip, a
 * save control, the title, the venue and two tags; a "Trending Events" heading
 * with "See all" over a two-column grid of picture cards, each priced in
 * naira; and a purple "Host Your Event" banner.
 *
 * WHAT WAS HERE BEFORE: a text title with a paragraph under it, two rows of
 * filter chips, a row of ten category chips, and a single column of bordered
 * text cards. None of it was the design, and none of it showed a price on a
 * thing that sells tickets.
 *
 * WHAT MOVED RATHER THAN DISAPPEARED. The upcoming/past toggle and both chip
 * rows are the calendar's real filters and are still here: they are what the
 * calendar control in the header opens. That is also what gives that control
 * something to do, instead of drawing an icon that does nothing.
 *
 * HOSTING IS NOT HIDDEN. Build brief B3 makes hosting verified-only and says
 * the control must never disappear: the "Host Event" tab and the banner are
 * shown to every account, and HostEventGate at /events/new explains what an
 * ineligible visitor needs. The server refuses the write either way.
 *
 * PRICES. Events sell tickets (brief B2), so the tiles carry a price. It is
 * NOT on the event's wire shape: see lowestTicketPrices, which reads the
 * ticket tiers for the handful of cards that show one. An event with nothing
 * on sale shows no price line rather than ₦0.
 *
 * DESKTOP. Below xl this is the phone design. At xl the shell already takes
 * the sidebar, so the column is capped at a real measure and the trending
 * grid reflows to four across rather than stretching two cards over 1000px.
 */

/** How many picture tiles the Trending grid holds before the full list below it. */
const TRENDING_MAX = 4;

export function EventsBrowser() {
  const [view, setView] = useState<EventView>("upcoming");
  const [filterId, setFilterId] = useState<string>("all");
  // Category is a SEPARATE axis from the format/type chips above it: "Music"
  // and "Webinar" are both true of the same event, and folding them into one
  // row would make choosing either silently cancel the other.
  const [category, setCategory] = useState<EventCategory | "">("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [featured, setFeatured] = useState<WawuEvent | null>(null);
  const [events, setEvents] = useState<WawuEvent[] | null>(null);
  const [prices, setPrices] = useState<Record<string, number | null>>({});
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

  // Trending is the busiest of what is on the calendar, by the interest signal
  // the backend already keeps. Not a "trending" flag it does not have.
  const trending = (events ?? []).slice().sort((a, b) => b.goingCount - a.goingCount).slice(0, TRENDING_MAX);
  const trendingKey = trending.map((e) => e.id).join(",");

  useEffect(() => {
    if (!trendingKey) {
      setPrices({});
      return;
    }
    let active = true;
    lowestTicketPrices(trendingKey.split(",")).then((found) => {
      if (active) setPrices(found);
    });
    return () => {
      active = false;
    };
  }, [trendingKey]);

  /** The server's own count after a Going write — never a locally guessed number. */
  const applyGoing = useCallback((id: string, next: { userGoing: boolean; goingCount: number }) => {
    const patch = (e: WawuEvent) => (e.id === id ? { ...e, ...next } : e);
    setEvents((prev) => (prev ? prev.map(patch) : prev));
    setFeatured((prev) => (prev ? patch(prev) : prev));
  }, []);

  const onGoingError = useCallback(() => {
    setGoingError("We couldn't save that. Try again in a moment.");
  }, []);

  const filtered = filterId !== "all" || category !== "" || view !== "upcoming";

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
    <>
      {featured ? (
        <EventCard
          event={featured}
          variant="hero"
          onGoingChange={(next) => applyGoing(featured.id, next)}
          onGoingError={onGoingError}
        />
      ) : null}

      {trending.length > 0 ? (
        <section className="flex flex-col gap-[12px]">
          {/* "See all" is a real jump to the full calendar further down this
              screen, not a label: there is no separate all-events route to
              send it to. */}
          <SectionHeader title={view === "past" ? "Recent events" : "Trending Events"} actionHref="#all-events" />
          <div className="grid grid-cols-2 gap-[12px] xl:grid-cols-4 xl:gap-[18px]">
            {trending.map((e) => (
              <EventCard
                key={e.id}
                event={e}
                variant="tile"
                priceFromNaira={prices[e.id]}
                onGoingChange={(next) => applyGoing(e.id, next)}
                onGoingError={onGoingError}
              />
            ))}
          </div>
        </section>
      ) : null}

      {/*
        Shown to every account on purpose: brief B3 forbids hiding the host
        control, and /events/new is where an ineligible visitor is told which
        tick they need and what it costs (HostEventGate).
      */}
      <CtaBanner
        icon="CalendarPlus"
        title="Host Your Event"
        body="Reach more people. Sell tickets. Grow."
        href="/events/new"
      />

      {events.length > 0 ? (
        <section id="all-events" className="flex scroll-mt-[72px] flex-col gap-[12px]">
          <SectionHeader title={view === "past" ? "The archive" : "All events"} />
          <div className="flex flex-col gap-[12px] xl:grid xl:grid-cols-2 xl:items-start xl:gap-[18px]">
            {events.map((e) => (
              <EventCard
                key={e.id}
                event={e}
                onGoingChange={(next) => applyGoing(e.id, next)}
                onGoingError={onGoingError}
              />
            ))}
          </div>
        </section>
      ) : null}
    </>
  );

  return (
    <>
      {goingError ? (
        <Toast kind="error" title="That didn't go through" body={goingError} onDismiss={() => setGoingError(null)} />
      ) : null}

      <ScreenHeader
        title="Events"
        right={
          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            aria-label="Browse the calendar by date, kind and category"
            aria-expanded={filtersOpen}
            className={`grid h-[34px] w-[34px] shrink-0 place-items-center rounded-full border transition-colors ${
              filtered
                ? "border-[var(--accent)] bg-[var(--accent-tint)] text-[var(--accent)]"
                : "border-hairline bg-tag text-text-primary hover:border-strong hover:bg-surface-hover active:bg-surface-press"
            }`}
          >
            <Icon name="CalendarDays" size={18} strokeWidth={1.9} color="currentColor" />
          </button>
        }
      />

      <div className="flex flex-col gap-[18px] p-[14px_16px_96px] xl:mx-auto xl:w-full xl:max-w-[1120px] xl:gap-[24px] xl:p-[24px_28px_64px]">
        {/*
          Three tabs, all three shown to everybody. "Host Event" is NOT hidden
          from an unverified account: brief B3 says the control stays and the
          explanation happens when it is followed (HostEventGate).
        */}
        <ChoiceChips
          ariaLabel="Events sections"
          value="discover"
          fill
          stretch
          options={[
            { value: "discover", label: "Discover", href: "/events" },
            { value: "mine", label: "My Events", href: "/events/mine" },
            { value: "host", label: "Host Event", href: "/events/new" },
          ]}
        />

        {filtered ? (
          <div className="flex items-center gap-[10px] text-[13px] text-[var(--text-secondary)]">
            <span className="min-w-0 flex-1 truncate">
              Showing {view === "past" ? "past events" : "upcoming events"}
              {filterId !== "all" ? `, ${chip.label}` : ""}
              {category ? `, ${EVENT_CATEGORY_LABEL[category]}` : ""}
            </span>
            <button
              type="button"
              onClick={() => {
                setView("upcoming");
                setFilterId("all");
                setCategory("");
              }}
              className="shrink-0 font-semibold text-[var(--accent)] hover:text-text-primary"
            >
              Clear
            </button>
          </div>
        ) : null}

        {body}
      </div>

      <Sheet
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Browse the calendar"
        caption="Pick what you are looking for. The calendar updates behind this."
        desktop="modal"
      >
        <div className="flex flex-col gap-[18px]">
          <FilterGroup label="When">
            <ChoiceChips
              ariaLabel="When"
              value={view}
              onSelect={(v) => setView(v)}
              fill
              options={[
                { value: "upcoming" as EventView, label: "Upcoming" },
                { value: "past" as EventView, label: "Past" },
              ]}
            />
          </FilterGroup>

          {/* Format and kind, as one row of chips that scrolls rather than
              wrapping into a wall (build brief C5). */}
          <FilterGroup label="Kind">
            <ChoiceChips
              ariaLabel="Kind of event"
              value={filterId}
              onSelect={setFilterId}
              scroll
              fill
              options={EVENT_FILTERS.map((f) => ({ value: f.id, label: f.label }))}
            />
          </FilterGroup>

          <FilterGroup label="Category">
            <ChoiceChips
              ariaLabel="Category"
              value={category}
              onSelect={(c) => setCategory(c)}
              scroll
              fill
              options={[{ value: "" as EventCategory | "", label: "Every category" }].concat(
                EVENT_CATEGORIES.map((c) => ({ value: c as EventCategory | "", label: EVENT_CATEGORY_LABEL[c] })),
              )}
            />
          </FilterGroup>

          <button
            type="button"
            onClick={() => setFiltersOpen(false)}
            className="h-[48px] w-full rounded-button bg-[var(--accent)] text-[15px] font-semibold text-[var(--text-on-accent)] transition-colors hover:bg-accent-hover active:bg-accent-press"
          >
            Show these events
          </button>
        </div>
      </Sheet>
    </>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-[8px]">
      <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--text-muted)]">{label}</span>
      {children}
    </div>
  );
}

function EventsSkeleton() {
  // Mirrors the loaded layout: the hero, then the trending grid. A single
  // full-bleed bar here is what makes a first paint look like a stretched
  // phone at desktop width.
  return (
    <div className="flex flex-col gap-[18px]">
      <Skeleton className="aspect-[10/7] w-full rounded-card xl:aspect-[21/8]" />
      <div className="grid grid-cols-2 gap-[12px] xl:grid-cols-4 xl:gap-[18px]">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[196px] rounded-card" />
        ))}
      </div>
    </div>
  );
}
