"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { getEvent, listEvents } from "@/lib/api/events";
import { useSession } from "@/lib/auth/session-provider";
import { eventDateParts, eventTimeLine, hasEnded, isThisWeek } from "@/lib/event-date";
import type { WawuEvent } from "@/types/events";
import { Avatar, Button, EmptyState, ErrorState, Icon, Skeleton, Toast } from "@/components/ui";
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
 * What is NOT here, and must not arrive: a price, a ticket, an amount, a
 * checkout. The organiser's own page behind `externalUrl` is where any
 * registration lives, paid or otherwise.
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
                      <Avatar initial={s.initials || s.name.charAt(0)} size={40} />
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
          <aside className="flex w-full shrink-0 flex-col gap-[14px] xl:sticky xl:top-[24px] xl:w-[320px]">
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
