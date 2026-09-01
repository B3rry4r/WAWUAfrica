"use client";

import Link from "next/link";
import { eventTimeLine, hasEnded, isThisWeek } from "@/lib/event-date";
import type { WawuEvent } from "@/types/events";
import { Icon } from "@/components/ui";
import { EventDateBlock, EventFormatPill, EventTypePill, ThisWeekPill } from "./EventPrimitives";
import { GoingButton } from "./GoingButton";

interface EventCardProps {
  event: WawuEvent;
  /**
   * "row" is the standard calendar card. "featured" is the admin-pinned card
   * at the top of the list. "compact" is the narrow one used in a related-
   * events strip. One component, three props — never a fork.
   */
  variant?: "row" | "featured" | "compact";
  onGoingChange?: (next: { userGoing: boolean; goingCount: number }) => void;
  onGoingError?: (error: unknown) => void;
}

/**
 * One event on the calendar. Ported from the old app's EventCard /
 * FeaturedEventCard pair (WAWUAfrica-new src/components/events/EventsUI.tsx),
 * which were two near-identical copies of the same card; here they are one
 * component with a `variant`.
 *
 * There is no price line and no ticket affordance on this card, and there was
 * none on the old one either. The only action is Going.
 *
 * The whole card is a link, but Going is a BUTTON and a button may not live
 * inside an anchor — nesting interactive content is invalid HTML and leaves
 * screen readers with one control that does two things. So the link is an
 * absolutely-positioned overlay and Going sits above it on its own layer,
 * which keeps "click anywhere to open" without the nesting.
 */
export function EventCard({ event, variant = "row", onGoingChange, onGoingError }: EventCardProps) {
  const past = hasEnded(event);
  const href = `/events/${event.id}`;

  if (variant === "compact") {
    return (
      <Link
        href={href}
        className="flex w-[240px] shrink-0 gap-[12px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[14px] no-underline hover:border-strong hover:bg-surface-hover active:bg-surface-press"
      >
        <EventDateBlock startsAt={event.startsAt} size="sm" dim={past} />
        <span className="flex min-w-0 flex-col gap-[3px]">
          <span className="line-clamp-2 text-[13.5px] font-semibold leading-[1.3] text-[var(--text-primary)]">
            {event.name}
          </span>
          <span className="truncate text-[12px] text-[var(--text-muted)]">{event.location}</span>
        </span>
      </Link>
    );
  }

  const featured = variant === "featured";

  return (
    <div
      className={`relative flex flex-col gap-[12px] rounded-[var(--radius-card)] border bg-[var(--surface-card)] transition-colors hover:bg-surface-hover ${
        featured
          ? "border-accent p-[16px] xl:p-[22px]"
          : "border-[var(--border-hairline)] p-[14px] hover:border-strong xl:p-[18px]"
      } ${past ? "opacity-70" : ""}`}
    >
      <Link href={href} className="absolute inset-0 rounded-[inherit]" aria-label={`${event.name} - ${event.hostOrg}`} />

      <div className={`flex gap-[14px] ${featured ? "xl:gap-[18px]" : ""}`}>
        <EventDateBlock startsAt={event.startsAt} size={featured ? "lg" : "md"} dim={past} />
        <div className="flex min-w-0 flex-1 flex-col gap-[4px]">
          {featured || (!past && isThisWeek(event)) ? (
            <div className="flex flex-wrap items-center gap-[6px]">
              {featured ? (
                <span className="inline-flex h-[22px] items-center gap-[5px] rounded-full bg-[var(--accent)] px-[9px] text-[10.5px] font-bold uppercase tracking-[0.04em] text-[var(--text-on-accent)]">
                  <Icon name="Star" size={11} color="currentColor" />
                  Featured
                </span>
              ) : null}
              {!past && isThisWeek(event) ? <ThisWeekPill /> : null}
            </div>
          ) : null}
          <h3
            className={`line-clamp-2 font-semibold leading-[1.28] tracking-[-0.01em] text-[var(--text-primary)] ${
              featured ? "text-[18px] xl:text-[20px]" : "text-[15.5px]"
            }`}
          >
            {event.name}
          </h3>
          <span className="truncate text-[13px] text-[var(--text-secondary)]">{event.hostOrg}</span>
          <div className="mt-[2px] flex flex-wrap items-center gap-x-[14px] gap-y-[4px]">
            <span className="inline-flex items-center gap-[5px] text-[12.5px] text-[var(--text-secondary)]">
              <Icon name={event.format === "online" ? "Video" : "MapPin"} size={14} color="var(--text-muted)" />
              {event.location}
            </span>
            <span className="inline-flex items-center gap-[5px] text-[12.5px] text-[var(--text-secondary)]">
              <Icon name="Clock" size={14} color="var(--text-muted)" />
              {eventTimeLine(event)}
            </span>
          </div>
        </div>
      </div>

      <div className="h-px bg-[var(--border-hairline)]" />

      <div className="flex items-center gap-[8px]">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-[6px]">
          <EventFormatPill format={event.format} />
          <EventTypePill type={event.type} />
        </div>
        {past ? (
          event.hasRecap ? (
            <span className="inline-flex shrink-0 items-center gap-[5px] text-[13px] font-semibold text-[var(--accent)]">
              Read the recap
              <Icon name="ArrowRight" size={14} color="currentColor" />
            </span>
          ) : (
            <span className="shrink-0 text-[12.5px] text-[var(--text-disabled)]">Ended</span>
          )
        ) : (
          <div className="relative z-10 flex shrink-0 items-center gap-[8px]">
            <span className="text-[12.5px] text-[var(--text-muted)]">{event.goingCount} going</span>
            <GoingButton
              eventId={event.id}
              going={event.userGoing}
              count={event.goingCount}
              onChange={onGoingChange}
              onError={onGoingError}
            />
          </div>
        )}
      </div>
    </div>
  );
}
