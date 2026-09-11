"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getEvent, listEvents } from "@/lib/api/events";
import { useSession } from "@/lib/auth/session-provider";
import { eventDateParts, eventTimeLine, hasEnded, isThisWeek } from "@/lib/event-date";
import type { WawuEvent } from "@/types/events";
import { EVENT_CATEGORY_LABEL } from "@/types/events";
import { Avatar, Button, Callout, EmptyState, ErrorState, Icon, Skeleton, StatusPill, Toast } from "@/components/ui";
import { EventCard } from "./EventCard";
import {
  EventDateBlock,
  EventFormatPill,
  EventStatusPill,
  EventTypePill,
  GOING_EXPLAINER,
  ThisWeekPill,
} from "./EventPrimitives";
import { GoingButton } from "./GoingButton";
import { ShareEventButton } from "./ShareEventButton";
import { TicketPurchasePanel } from "./TicketPurchasePanel";

/**
 * One event, in full.
 *
 * Ported from the old app's /events/[id] screen (WAWUAfrica-new
 * src/app/(feed)/events/[id]/page.tsx). Two things from that screen are gone
 * on purpose:
 *
 *   - The "Verified by WAWUAfrica admin" banner. Every event on this calendar
 *     is admin-approved — that is what `published` means — so a badge saying so
 *     on all of them says nothing, and this app reserves verification language
 *     for the profile credibility ladder.
 *   - The `going3` avatar stack. There is no such field on the real contract
 *     and the old backend always sent an empty array for it, so it only ever
 *     rendered fabricated initials.
 *
 * TICKETS ARRIVED (29 Aug 2026). This comment used to say a price must never
 * appear here. That is now wrong, and the ticket panel below sells them —
 * but it renders NOTHING when the event has no tiers, which is still the
 * common case. `externalUrl` remains the route for an organiser running
 * registration on their own site.
 *
 * Going and buying are separate and both are shown. Clicking Going is an
 * interest signal and buys nothing; buying a ticket does not imply Going. An
 * organiser reads `goingCount` as a room-size guess and `ticketsSold` as
 * money, and merging them would corrupt both.
 */

/** Renders a link only for a URL we would actually be willing to open. */
function safeHttpUrl(raw: string | null): string | null {
  if (!raw) return null;
  try {
    const url = new URL(raw);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--text-muted)]">{children}</span>
  );
}

export function EventDetailView({ id }: { id: string }) {
  const { user } = useSession();
  const viewerWawuId = user?.wawuId ?? "";
  // From a shared link. It attributes the sale to whoever posted it and does
  // nothing else — it is not a discount and must never read as one.
  const referralCode = useSearchParams().get("ref") ?? undefined;

  const [event, setEvent] = useState<WawuEvent | null>(null);
  const [missing, setMissing] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [related, setRelated] = useState<WawuEvent[]>([]);
  const [goingError, setGoingError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setEvent(null);
    setMissing(false);
    setError(null);
    getEvent(id, viewerWawuId)
      .then((found) => {
        if (!active) return;
        if (!found) setMissing(true);
        else setEvent(found);
      })
      .catch((e) => {
        if (active) setError(e);
      });
    return () => {
      active = false;
    };
  }, [id, viewerWawuId, reloadKey]);

  useEffect(() => {
    let active = true;
    listEvents({ view: "upcoming", perPage: 8 })
      .then((page) => {
        if (active) setRelated(page.events.filter((e) => e.id !== id).slice(0, 4));
      })
      .catch(() => {
        // A related strip that fails to load is a missing strip, not a broken
        // page — the event itself is already on screen.
      });
    return () => {
      active = false;
    };
  }, [id]);

  const applyGoing = useCallback((next: { userGoing: boolean; goingCount: number }) => {
    setEvent((prev) => (prev ? { ...prev, ...next } : prev));
  }, []);

  if (error) {
    return (
      <Shell>
        <ErrorState error={error} onRetry={() => setReloadKey((k) => k + 1)} />
      </Shell>
    );
  }

  if (missing) {
    return (
      <Shell>
        <EmptyState
          icon="CalendarX"
          title="We couldn't find that event"
          caption="It may have been taken down, or it is still waiting on review."
          action="Back to Events"
          actionHref="/events"
        />
      </Shell>
    );
  }

  if (!event) {
    return (
      <Shell>
        <Skeleton className="h-[120px] rounded-card" />
        <Skeleton className="h-[220px] rounded-card" />
        <Skeleton className="h-[160px] rounded-card" />
      </Shell>
    );
  }

  const { weekday, full } = eventDateParts(event.startsAt);
  const past = hasEnded(event);
  const isHost = Boolean(viewerWawuId) && event.hostWawuId === viewerWawuId;
  const externalUrl = safeHttpUrl(event.externalUrl);
  const recapUrl = safeHttpUrl(event.recapUrl);

  const goingBlock = (
    <div className="flex flex-col gap-[10px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[16px]">
      <span className="text-[13.5px] text-[var(--text-secondary)]">
        <strong className="font-semibold text-[var(--text-primary)]">{event.goingCount}</strong>
        {event.goingCount === 1 ? " person has" : " people have"} marked themselves going.
      </span>
      {past ? (
        <span className="text-[12.5px] text-[var(--text-muted)]">This event has ended.</span>
      ) : (
        <>
          <GoingButton
            eventId={event.id}
            going={event.userGoing}
            count={event.goingCount}
            variant="full"
            onChange={applyGoing}
            onError={() => setGoingError("We couldn't save that. Try again in a moment.")}
          />
          <ShareEventButton eventId={event.id} eventName={event.name} referralCode={referralCode} size="md" />
          <p className="m-0 text-[12px] leading-[1.5] text-[var(--text-muted)]">{GOING_EXPLAINER}</p>
        </>
      )}
      {externalUrl ? (
        <a
          href={externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-[48px] w-full items-center justify-center gap-[8px] rounded-button border border-strong bg-[var(--surface-elevated)] text-[14px] font-semibold text-[var(--text-primary)] no-underline hover:bg-surface-hover active:bg-surface-press"
        >
          Open the organiser&apos;s page
          <Icon name="ArrowUpRight" size={16} strokeWidth={2.2} color="currentColor" />
        </a>
      ) : null}
    </div>
  );

  const organiserBlock = (
    <div className="flex flex-col gap-[10px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[16px]">
      <SectionLabel>Organiser</SectionLabel>
      <div className="flex items-center gap-[10px]">
        <Avatar initial={event.hostOrg.charAt(0)} size={36} />
        <span className="min-w-0 flex-1 truncate text-[15px] font-semibold text-[var(--text-primary)]">
          {event.hostOrg}
        </span>
      </div>
      {event.hostOrgBio ? (
        <p className="m-0 text-[13px] leading-[1.55] text-[var(--text-secondary)]">{event.hostOrgBio}</p>
      ) : null}
    </div>
  );

  return (
    <>
      {goingError ? (
        <Toast kind="error" title="That didn't go through" body={goingError} onDismiss={() => setGoingError(null)} />
      ) : null}

      <div className="flex flex-col gap-[18px] p-[14px_16px_96px] xl:mx-auto xl:w-full xl:max-w-[1120px] xl:p-[30px_28px_64px]">
        <Link
          href="/events"
          className="inline-flex w-fit items-center gap-[8px] text-[13.5px] font-semibold text-[var(--text-secondary)] no-underline hover:text-text-primary"
        >
          <Icon name="ArrowLeft" size={17} color="currentColor" />
          Events
        </Link>

        {/* Host-only strip. A submitter has to be able to see where their own
            event stands and, when it was turned down, read why — a rejection
            nobody can read is a dead end. */}
        {isHost ? (
          <div className="flex flex-col gap-[10px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-tag)] p-[14px]">
            <div className="flex flex-wrap items-center gap-[10px]">
              <EventStatusPill status={event.status} />
              <span className="min-w-0 flex-1 text-[12.5px] text-[var(--text-secondary)]">
                {event.status === "published"
                  ? "This is live on the calendar."
                  : event.status === "pending"
                    ? "An admin is reviewing this. Nobody else can see it yet."
                    : event.status === "rejected"
                      ? "This was not approved. Fix it and save to send it back for review."
                      : "This was taken down and is no longer on the calendar."}
              </span>
              <Button href={`/events/${event.id}/edit`} variant="secondary" size="sm" icon="Pencil">
                Edit
              </Button>
            </div>
            {/*
              The organiser's two ticketing entry points. Shown at every status
              so an event can have its tiers ready before an admin approves it
              — the alternative is setting prices in a rush the moment it goes
              live.
            */}
            <div className="flex flex-wrap items-center gap-[10px]">
              <Button href={`/events/${event.id}/tickets`} variant="secondary" size="sm" icon="Ticket">
                Set up tickets
              </Button>
              <Button href={`/events/${event.id}/manage`} variant="secondary" size="sm" icon="ChartNoAxesColumn">
                Sales
              </Button>
              <Button href={`/events/${event.id}/scan`} variant="secondary" size="sm" icon="ScanLine">
                Check people in
              </Button>
            </div>
            {event.lastDecisionReason ? (
              <p className="m-0 rounded-input border border-danger bg-[var(--danger-tint)] px-[12px] py-[10px] text-[12.5px] leading-[1.55] text-[var(--text-primary)]">
                <span className="font-semibold">Reviewer&apos;s note: </span>
                {event.lastDecisionReason}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="flex flex-col gap-[24px] xl:flex-row xl:items-start xl:gap-[32px]">
          {/* Main column. Capped by the aside beside it at xl, so the
              description never runs the full 1036px the shell leaves. */}
          <div className="flex min-w-0 flex-1 flex-col gap-[20px]">
            {/*
              The banner, when the organiser gave one. A plain <img> rather
              than next/image: the URL is organiser-supplied and arbitrary, and
              next/image would need every possible host allow-listed in the
              config to render it at all.
            */}
            {event.bannerUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={event.bannerUrl}
                alt=""
                className="aspect-[16/7] w-full rounded-[var(--radius-card)] border border-[var(--border-hairline)] object-cover"
              />
            ) : null}

            {event.cancelledAt ? (
              <Callout tone="danger" title="This event was called off" full>
                {event.cancelReason ?? "The organiser cancelled it."} Every ticket has been voided and every buyer
                refunded.
              </Callout>
            ) : null}

            <div className="flex items-center gap-[16px]">
              <EventDateBlock startsAt={event.startsAt} size="lg" dim={past} />
              <div className="flex min-w-0 flex-col gap-[3px]">
                <span className="text-[15px] font-semibold text-[var(--text-primary)]">{weekday}</span>
                <span className="text-[13.5px] text-[var(--text-secondary)]">
                  {full} · {eventTimeLine(event)}
                </span>
                <div className="mt-[6px] flex flex-wrap items-center gap-[6px]">
                  <EventFormatPill format={event.format} />
                  <EventTypePill type={event.type} />
                  {event.category !== "other" ? (
                    <StatusPill kind="neutral" size="sm">
                      {EVENT_CATEGORY_LABEL[event.category]}
                    </StatusPill>
                  ) : null}
                  {!past && isThisWeek(event) ? <ThisWeekPill /> : null}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-[6px]">
              <h1 className="text-[23px] font-bold leading-[1.22] tracking-[-0.02em] text-[var(--text-primary)] xl:text-[30px]">
                {event.name}
              </h1>
              <span className="text-[14px] text-[var(--text-secondary)]">{event.hostOrg}</span>
            </div>

            <div className="flex flex-col gap-[8px]">
              <SectionLabel>{event.format === "online" ? "Where it runs" : "Location"}</SectionLabel>
              <div className="flex gap-[12px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[14px]">
                <span className="mt-[1px] shrink-0">
                  <Icon name={event.format === "online" ? "Video" : "MapPin"} size={20} color="var(--accent)" />
                </span>
                <div className="min-w-0">
                  <div className="text-[14.5px] font-semibold text-[var(--text-primary)]">{event.location}</div>
                  {event.address ? (
                    <div className="mt-[2px] text-[13px] leading-[1.45] text-[var(--text-secondary)]">
                      {event.address}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            {event.contactEmail || event.contactPhone ? (
              <div className="flex flex-col gap-[8px]">
                <SectionLabel>Ask the organiser</SectionLabel>
                <div className="flex flex-col gap-[8px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[14px]">
                  {event.contactEmail ? (
                    <a
                      href={`mailto:${event.contactEmail}`}
                      className="inline-flex items-center gap-[8px] text-[13.5px] font-semibold text-[var(--accent)] no-underline hover:text-text-primary"
                    >
                      <Icon name="Mail" size={16} color="currentColor" />
                      {event.contactEmail}
                    </a>
                  ) : null}
                  {event.contactPhone ? (
                    <a
                      href={`tel:${event.contactPhone}`}
                      className="inline-flex items-center gap-[8px] text-[13.5px] font-semibold text-[var(--accent)] no-underline hover:text-text-primary"
                    >
                      <Icon name="Phone" size={16} color="currentColor" />
                      {event.contactPhone}
                    </a>
                  ) : null}
                </div>
              </div>
            ) : null}

            <div className="flex flex-col gap-[8px]">
              <SectionLabel>About this event</SectionLabel>
              <p className="m-0 whitespace-pre-line text-[14.5px] leading-[1.6] text-[var(--text-secondary)]">
                {event.description}
              </p>
            </div>

            {event.speakers.length > 0 ? (
              <div className="flex flex-col gap-[10px]">
                <SectionLabel>Speakers</SectionLabel>
                <div className="flex flex-col gap-[12px] xl:grid xl:grid-cols-2 xl:gap-[14px]">
                  {event.speakers.map((s) => (
                    <div key={`${s.order}-${s.name}`} className="flex items-center gap-[12px]">
                      <Avatar src={s.photoUrl} initial={s.initials || s.name.charAt(0)} size={40} />
                      <div className="min-w-0">
                        <div className="truncate text-[14.5px] font-semibold text-[var(--text-primary)]">{s.name}</div>
                        {s.title ? (
                          <div className="truncate text-[12.5px] text-[var(--text-muted)]">{s.title}</div>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {event.hasRecap && (event.recapText || recapUrl) ? (
              <div className="flex flex-col gap-[8px]">
                <SectionLabel>Recap</SectionLabel>
                <div className="flex flex-col gap-[10px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[14px]">
                  {event.recapText ? (
                    <p className="m-0 whitespace-pre-line text-[14px] leading-[1.6] text-[var(--text-secondary)]">
                      {event.recapText}
                    </p>
                  ) : null}
                  {recapUrl ? (
                    <a
                      href={recapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex w-fit items-center gap-[6px] text-[13.5px] font-semibold text-[var(--accent)] no-underline hover:text-text-primary"
                    >
                      Read the full write-up
                      <Icon name="ArrowUpRight" size={15} color="currentColor" />
                    </a>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>

          {/* Desktop aside. On a phone these two blocks simply follow the
              content; at xl they sit beside it and stay put while the
              description scrolls. */}
          {/*
            Tickets sit ABOVE Going in the rail. Somebody who has decided to
            come needs the thing that costs money and secures a seat; Going is
            the lighter signal and reads fine underneath it.
          */}
          <aside className="flex w-full shrink-0 flex-col gap-[14px] xl:sticky xl:top-[24px] xl:w-[320px]">
            <TicketPurchasePanel event={event} referralCode={referralCode} />
            {goingBlock}
            {organiserBlock}
          </aside>
        </div>

        {related.length > 0 ? (
          <div className="flex flex-col gap-[10px]">
            <div className="flex items-center gap-[10px]">
              <SectionLabel>More on the calendar</SectionLabel>
              <span className="flex-1" />
              <Link href="/events" className="text-[12.5px] font-semibold text-[var(--accent)] no-underline hover:text-text-primary">
                See all
              </Link>
            </div>
            <div className="-mx-[16px] overflow-x-auto px-[16px] xl:mx-0 xl:overflow-visible xl:px-0">
              <div className="flex w-max gap-[12px] xl:w-full">
                {related.map((e) => (
                  <EventCard key={e.id} event={e} variant="compact" />
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-[18px] p-[14px_16px_96px] xl:mx-auto xl:w-full xl:max-w-[1120px] xl:p-[30px_28px_64px]">
      {children}
    </div>
  );
}
