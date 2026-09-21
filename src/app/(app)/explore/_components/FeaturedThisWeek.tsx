"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listEvents } from "@/lib/api/events";
import { getCreators } from "@/lib/api/explore";
import { listProfessionals } from "@/lib/api/professionals";
import { eventDateParts } from "@/lib/event-date";
import { orderedServices } from "@/lib/platform-services";
import { Avatar, Icon, Skeleton, VerificationBadge } from "@/components/ui";
import type { VerificationLevel } from "@/types/account";

/**
 * Featured This Week (build brief C4, item 5).
 *
 * "Creators, professionals, events and services in one carousel. This is the
 * paid featured placement from B1."
 *
 * Four kinds of thing in one rail, which is the point: a person paying to be
 * featured is buying a place HERE, next to whatever else is featured, not a
 * slot in a rail of their own kind. So the card is one component with a
 * `kind` rather than four cards that will drift apart.
 *
 * It replaces "People You May Like", which C4 removes as redundant against
 * this. Everything in it opens a real destination: C4's "tapping any person
 * anywhere opens their full profile" is not a separate rule to remember, it
 * is what this card does.
 *
 * WHAT IS NOT HERE YET: nothing on the contract marks a creator or a
 * professional as PAID-featured. Events carry a real `featured` flag an admin
 * sets; the other three do not. Rather than invent a ranking, the rail shows
 * featured events first and then the top of each directory, and the paid
 * placement lands here the day a `featured` field exists on those resources.
 * See DECISIONS.md D8.
 */

type FeaturedKind = "creator" | "professional" | "event" | "service";

interface FeaturedCard {
  key: string;
  kind: FeaturedKind;
  title: string;
  caption: string;
  href: string;
  avatarUrl?: string | null;
  bannerUrl?: string | null;
  iconImageSrc?: string;
  verification?: VerificationLevel;
  cta: string;
}

const KIND_LABEL: Record<FeaturedKind, string> = {
  creator: "Creator",
  professional: "Professional",
  event: "Event",
  service: "Service",
};

export function FeaturedThisWeek() {
  const [cards, setCards] = useState<FeaturedCard[] | null>(null);

  useEffect(() => {
    let alive = true;

    // Each read is settled on its own: one directory being down must not
    // empty a rail that three other sources could still fill.
    Promise.allSettled([
      listEvents({ view: "upcoming", featured: true, perPage: 3 }),
      getCreators(),
      listProfessionals(),
    ]).then(([eventsRes, creatorsRes, prosRes]) => {
      if (!alive) return;
      const out: FeaturedCard[] = [];

      if (eventsRes.status === "fulfilled") {
        for (const e of eventsRes.value.events.slice(0, 3)) {
          const when = eventDateParts(e.startsAt);
          out.push({
            key: `event-${e.id}`,
            kind: "event",
            title: e.name,
            caption: `${when.day} ${when.month} · ${e.location}`,
            href: `/events/${e.id}`,
            bannerUrl: e.bannerUrl,
            cta: "See the event",
          });
        }
      }

      if (creatorsRes.status === "fulfilled") {
        for (const c of creatorsRes.value.slice(0, 3)) {
          out.push({
            key: `creator-${c.wawuId}`,
            kind: "creator",
            title: c.handle ? `@${c.handle}` : c.name,
            caption: c.field,
            href: `/profile/${c.wawuId}`,
            avatarUrl: c.avatarUrl,
            verification: c.verification,
            cta: "View profile",
          });
        }
      }

      if (prosRes.status === "fulfilled") {
        for (const p of prosRes.value.slice(0, 3)) {
          out.push({
            key: `pro-${p.id}`,
            kind: "professional",
            title: p.handle ? `@${p.handle}` : p.name,
            caption: p.headline,
            href: `/professionals/${p.id}`,
            avatarUrl: p.avatarUrl,
            verification: p.verification,
            cta: "View profile",
          });
        }
      }

      for (const s of orderedServices().filter((s) => !s.soon && s.href).slice(0, 2)) {
        out.push({
          key: `service-${s.brand}`,
          kind: "service",
          title: s.brand,
          caption: s.label,
          href: s.href as string,
          iconImageSrc: s.iconImageSrc,
          cta: "Open",
        });
      }

      setCards(out);
    });

    return () => {
      alive = false;
    };
  }, []);

  if (!cards) return <Skeleton variant="row" />;
  // Nothing featured is not an error and not an empty box: the section simply
  // is not on the page that week.
  if (cards.length === 0) return null;

  return (
    <section className="flex flex-col gap-[12px]">
      <div className="flex items-end justify-between gap-3 px-[2px]">
        <div className="flex flex-col gap-[3px]">
          <h2 className="m-0 text-[17px] font-bold tracking-[-0.015em] text-[var(--text-primary)] dt:text-[20px]">
            Featured this week
          </h2>
          <p className="m-0 text-[12.5px] text-[var(--text-muted)]">
            Creators, professionals, events and services
          </p>
        </div>
      </div>

      <div className="-mx-[16px] px-[16px] xl:mx-0 xl:px-0">
        <div className="wawu-no-scrollbar flex gap-[12px] overflow-x-auto pb-[4px]">
          {cards.map((c) => (
            <Link
              key={c.key}
              href={c.href}
              className="flex w-[216px] shrink-0 flex-col gap-[10px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[14px] no-underline transition-colors hover:border-strong hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-page)]"
            >
              {c.bannerUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={c.bannerUrl}
                  alt=""
                  className="h-[92px] w-full rounded-[var(--radius-input)] object-cover"
                />
              ) : c.iconImageSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.iconImageSrc} alt="" className="h-[52px] w-[52px] object-contain" />
              ) : (
                <Avatar src={c.avatarUrl ?? null} initial={c.title.replace("@", "").charAt(0)} size={52} />
              )}

              <span className="flex flex-col gap-[3px]">
                <span className="text-[10.5px] font-bold uppercase tracking-[0.07em] text-[var(--text-muted)]">
                  {KIND_LABEL[c.kind]}
                </span>
                <span className="flex items-center gap-[6px]">
                  <span className="min-w-0 flex-1 truncate text-[14px] font-semibold text-[var(--text-primary)]">
                    {c.title}
                  </span>
                  {c.verification ? <VerificationBadge tier={c.verification} size={14} /> : null}
                </span>
                <span className="line-clamp-2 text-[12.5px] leading-[1.4] text-[var(--text-secondary)]">
                  {c.caption}
                </span>
              </span>

              <span className="mt-auto inline-flex items-center gap-[5px] text-[12.5px] font-semibold text-[var(--accent)]">
                {c.cta}
                <Icon name="ArrowRight" size={13} strokeWidth={2.2} />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
