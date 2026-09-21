"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listEvents } from "@/lib/api/events";
import { getCreators } from "@/lib/api/explore";
import { listProfessionals } from "@/lib/api/professionals";
import { eventDateParts } from "@/lib/event-date";
import { orderedServices } from "@/lib/platform-services";
import { Avatar, MediaCard, Skeleton, VerificationBadge } from "@/components/ui";
import { Rail } from "./Rail";
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

  if (!cards)
    return (
      <Rail title="Featured this week" caption="Creators, professionals, events and services">
        {[0, 1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="aspect-[3/4] w-[168px] shrink-0 rounded-card dt:w-[188px]" />
        ))}
      </Rail>
    );
  // Nothing featured is not an error and not an empty box: the section simply
  // is not on the page that week.
  if (cards.length === 0) return null;

  return (
    <Rail title="Featured this week" caption="Creators, professionals, events and services">
      {cards.map((c) => (
        <div key={c.key} className="relative w-[168px] shrink-0 dt:w-[188px]">
          <MediaCard
            href={c.href}
            imageUrl={c.bannerUrl ?? c.avatarUrl}
            aspect="aspect-[3/4]"
            className="w-full"
            fallback={
              c.iconImageSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.iconImageSrc} alt="" className="h-[64px] w-[64px] object-contain" />
              ) : (
                <Avatar src={null} initial={c.title.replace("@", "").charAt(0)} size={60} />
              )
            }
            badge={
              <span className="inline-flex items-center rounded-full bg-[rgba(11,10,13,0.72)] px-[8px] py-[3px] text-[10px] font-bold uppercase tracking-[0.06em] text-white backdrop-blur-sm">
                {KIND_LABEL[c.kind]}
              </span>
            }
            title={c.title}
            titleBadge={c.verification ? <VerificationBadge tier={c.verification} size={14} /> : undefined}
            caption={c.caption}
            action={<span className="block h-[32px]" />}
          />
          {/*
            The action sits outside MediaCard's link for the same reason the
            creator card's Follow does: a button nested in an anchor navigates
            instead of acting. Here it is a second link rather than a button,
            so it stays a real, keyboard-reachable destination.
          */}
          <Link
            href={c.href}
            tabIndex={-1}
            aria-hidden
            className="absolute inset-x-[11px] bottom-[11px] inline-flex h-[32px] items-center justify-center rounded-full bg-[var(--accent)] px-[12px] text-[12.5px] font-semibold text-[var(--text-on-accent)] no-underline transition-colors hover:bg-[var(--accent-hover)]"
          >
            {c.cta}
          </Link>
        </div>
      ))}
    </Rail>
  );
}
