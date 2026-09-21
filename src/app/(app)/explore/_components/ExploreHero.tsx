"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { listEvents } from "@/lib/api/events";
import { eventDateParts } from "@/lib/event-date";
import type { WawuEvent } from "@/types/events";
import { Icon, Skeleton } from "@/components/ui";

/**
 * The Explore hero (build brief C4, item 1).
 *
 * WHAT IS IN IT, AND WHY IT IS NOT A PROMO BANNER.
 *
 * The reference (refs/target-explore-desktop-tiles.jpg) shows a brand banner
 * with paging dots. There is no promo-slide resource on the contract and
 * nothing publishes one, so a carousel of hand-written promos would be a
 * screen full of copy no system owns, changed only by a deploy. B1 already
 * names the thing this slot is for -- PAID FEATURING -- and events carry a
 * real `featured` flag set by an admin, so the carousel shows featured
 * events. When somebody pays to be featured, this is where it lands, and the
 * mechanism behind it exists today.
 *
 * With no featured event it does not render an empty frame: it falls back to
 * one slide, WAWU's own pitch, with a route behind its button. That slide
 * carries no figure, no rate and no claim about what the platform will do.
 *
 * The rail is a real scroll container with snap points rather than a timed
 * auto-advance: a hero that moves on its own steals the page from somebody
 * reading it, and the dots have to be pressable either way.
 */

interface Slide {
  key: string;
  eyebrow: string;
  title: string;
  body: string;
  ctaLabel: string;
  href: string;
  bannerUrl: string | null;
}

/**
 * The one slide that is not data.
 *
 * It is the platform describing itself, which needs no publisher, and every
 * word of it is already on the landing page. No number, no promise.
 */
const HOUSE_SLIDE: Slide = {
  key: "house",
  eyebrow: "WAWU",
  title: "Create, connect, do more",
  bannerUrl: null,
  body: "Content, services and opportunities, in one place. Find who you need, or be found.",
  ctaLabel: "Browse creators",
  href: "/explore/creators",
};

function slideFromEvent(e: WawuEvent): Slide {
  const when = eventDateParts(e.startsAt);
  return {
    key: e.id,
    eyebrow: "Featured event",
    title: e.name,
    bannerUrl: e.bannerUrl,
    body: `${when.day} ${when.month} · ${e.location}`,
    ctaLabel: "See the event",
    href: `/events/${e.id}`,
  };
}

export function ExploreHero() {
  const [slides, setSlides] = useState<Slide[] | null>(null);
  const [active, setActive] = useState(0);
  const railRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    listEvents({ view: "upcoming", featured: true, perPage: 4 })
      .then((page) => {
        if (!alive) return;
        const featured = page.events.map(slideFromEvent);
        setSlides(featured.length > 0 ? featured : [HOUSE_SLIDE]);
      })
      .catch(() => {
        // A hero that cannot read its data shows the house slide, not an
        // error: nothing on this page depends on it and a broken banner at
        // the top of Explore reads as a broken app.
        if (alive) setSlides([HOUSE_SLIDE]);
      });
    return () => {
      alive = false;
    };
  }, []);

  const goTo = useCallback((i: number) => {
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollTo({ left: i * rail.clientWidth, behavior: "smooth" });
  }, []);

  const onScroll = useCallback(() => {
    const rail = railRef.current;
    if (!rail || rail.clientWidth === 0) return;
    setActive(Math.round(rail.scrollLeft / rail.clientWidth));
  }, []);

  if (!slides) return <Skeleton variant="card" />;

  return (
    <section className="flex flex-col gap-[10px]" aria-label="Featured">
      <div
        ref={railRef}
        onScroll={onScroll}
        className="wawu-no-scrollbar flex snap-x snap-mandatory overflow-x-auto rounded-[var(--radius-card)]"
      >
        {slides.map((s) => (
          <article
            key={s.key}
            className="relative flex w-full shrink-0 snap-start flex-col justify-end overflow-hidden rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[20px] min-h-[190px] dt:min-h-[260px] dt:p-[28px]"
          >
            {s.bannerUrl ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={s.bannerUrl}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                />
                {/* The scrim is what makes the copy legible on somebody
                    else's photograph, which can be any brightness. */}
                <span className="absolute inset-0 bg-[linear-gradient(0deg,rgba(11,10,13,0.92),rgba(11,10,13,0.35))]" />
              </>
            ) : (
              <span className="absolute inset-0 bg-[linear-gradient(140deg,var(--accent-deep),var(--surface-card))]" />
            )}

            <div className="relative flex flex-col items-start gap-[10px]">
              <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--accent-soft)]">
                {s.eyebrow}
              </span>
              <h2 className="m-0 max-w-[22ch] text-[22px] font-bold leading-[1.12] tracking-[-0.02em] text-white dt:text-[30px]">
                {s.title}
              </h2>
              <p className="m-0 max-w-[46ch] text-[13.5px] leading-[1.5] text-[rgba(255,255,255,0.78)]">
                {s.body}
              </p>
              <Link
                href={s.href}
                className="mt-[4px] inline-flex h-[38px] items-center gap-[7px] rounded-full bg-white px-[16px] text-[13.5px] font-semibold text-[var(--text-on-light)] no-underline transition-colors hover:bg-[rgba(255,255,255,0.86)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-page)]"
              >
                {s.ctaLabel}
                <Icon name="ArrowRight" size={15} strokeWidth={2.2} />
              </Link>
            </div>
          </article>
        ))}
      </div>

      {slides.length > 1 ? (
        <div className="flex items-center justify-center gap-[6px]">
          {slides.map((s, i) => (
            <button
              key={s.key}
              type="button"
              aria-label={`Show ${s.title}`}
              aria-current={i === active}
              onClick={() => goTo(i)}
              className={`h-[6px] rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-page)] ${
                i === active ? "w-[22px] bg-[var(--accent)]" : "w-[6px] bg-[var(--border-strong)]"
              }`}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
