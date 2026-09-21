"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui";

/**
 * A titled horizontal slider, the shape every section of the Explore
 * reference uses (refs/target-explore-desktop-structure.jpg).
 *
 * The reference draws a chevron button on the right edge of each rail, so it
 * is here: on a desktop with no touch, a row that scrolls with no visible
 * control looks like a row that is simply cut off. The button appears only
 * when there is somewhere to go and hides itself at each end.
 *
 * One component, not one per section, so Featured Creators and Upcoming
 * Events cannot drift into different heading sizes and different gaps.
 */
export function Rail({
  title,
  caption,
  seeAllHref,
  children,
}: {
  title: string;
  caption?: string;
  seeAllHref?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(true);

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 2);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 2);
  }, []);

  useEffect(() => {
    measure();
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure, children]);

  const nudge = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.round(el.clientWidth * 0.8), behavior: "smooth" });
  };

  return (
    <section className="flex flex-col gap-[12px]">
      <div className="flex items-end justify-between gap-3 px-[2px]">
        <div className="flex flex-col gap-[2px]">
          <h2 className="m-0 text-[18px] font-bold tracking-[-0.02em] text-[var(--text-primary)] dt:text-[21px]">
            {title}
          </h2>
          {caption ? <p className="m-0 text-[12.5px] text-[var(--text-muted)]">{caption}</p> : null}
        </div>
        {seeAllHref ? (
          <Link
            href={seeAllHref}
            className="shrink-0 text-[12.5px] font-semibold text-[var(--accent)] no-underline hover:text-text-primary"
          >
            See all
          </Link>
        ) : null}
      </div>

      <div className="relative -mx-[16px] px-[16px] xl:mx-0 xl:px-0">
        <div
          ref={ref}
          onScroll={measure}
          className="wawu-no-scrollbar flex gap-[12px] overflow-x-auto scroll-smooth pb-[4px]"
        >
          {children}
        </div>

        {/* Hidden from assistive tech: the rail is already scrollable and
            keyboard-reachable through the cards themselves, so these would
            only add two unlabelled stops to the tab order. */}
        {!atStart ? (
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            onClick={() => nudge(-1)}
            className="absolute left-[18px] top-1/2 hidden h-[36px] w-[36px] -translate-y-1/2 place-items-center rounded-full border border-[var(--border-strong)] bg-[rgba(11,10,13,0.82)] backdrop-blur-sm transition-colors hover:bg-[var(--surface-elevated)] dt:grid"
          >
            <Icon name="ChevronLeft" size={18} color="var(--text-primary)" strokeWidth={2.2} />
          </button>
        ) : null}
        {!atEnd ? (
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            onClick={() => nudge(1)}
            className="absolute right-[18px] top-1/2 hidden h-[36px] w-[36px] -translate-y-1/2 place-items-center rounded-full border border-[var(--border-strong)] bg-[rgba(11,10,13,0.82)] backdrop-blur-sm transition-colors hover:bg-[var(--surface-elevated)] dt:grid"
          >
            <Icon name="ChevronRight" size={18} color="var(--text-primary)" strokeWidth={2.2} />
          </button>
        ) : null}
      </div>
    </section>
  );
}
