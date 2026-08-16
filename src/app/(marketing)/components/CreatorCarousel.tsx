"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ContentCard } from "@/components/content/ContentCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import type { ContentPiece } from "@/types/content";

/**
 * Horizontally scrollable creator showcase. Data is fetched server-side and
 * passed in.
 *
 * `isLive` distinguishes a real read of the feed from the fixture set
 * getFeaturedContent() falls back to for every anonymous visitor (see its
 * doc comment in src/lib/api/content.ts) — an anonymous visitor has no
 * session token and there is no public/unauthenticated content scope on the
 * real API, so this is not a rare failure case, it is what every signed-out
 * visitor sees. When `isLive` is false this labels the section as example
 * content instead of presenting fixture names/stats as live creator
 * activity.
 */
export function CreatorCarousel({ items, isLive }: { items: ContentPiece[]; isLive: boolean }) {
  const router = useRouter();
  const railRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const onScroll = () => {
    const rail = railRef.current;
    if (!rail) return;
    const children = Array.from(rail.children) as HTMLElement[];
    if (children.length === 0) return;
    const center = rail.scrollLeft + rail.clientWidth / 2;
    let closest = 0;
    let closestDist = Infinity;
    children.forEach((child, i) => {
      const childCenter = child.offsetLeft + child.offsetWidth / 2;
      const dist = Math.abs(childCenter - center);
      if (dist < closestDist) {
        closestDist = dist;
        closest = i;
      }
    });
    setActive(closest);
  };

  return (
    <section className="pb-11 pt-2 xl:mx-auto xl:max-w-[1440px]">
      <div className="px-5 xl:px-14">
        <SectionHeader
          caption={isLive ? "Earning on WAWU now" : "Example content"}
          title="Creators to watch"
          action="See all"
          onAction={() => router.push("/explore/creators")}
        />
        {isLive ? null : (
          <p className="-mt-1.5 mb-[18px] text-[13px] leading-normal text-text-muted">
            Illustrative only — sign up to see who is actually live on WAWU right now.
          </p>
        )}
      </div>
      <div
        ref={railRef}
        onScroll={onScroll}
        className="wawu-no-scrollbar flex snap-x snap-mandatory gap-3.5 overflow-x-auto px-5 py-4 xl:px-14"
      >
        {items.map((c) => (
          <div key={c.id} className="w-[306px] shrink-0 snap-center">
            <ContentCard content={c} state="free" ratio="4 / 5" />
          </div>
        ))}
      </div>
      {items.length > 1 ? (
        <div className="flex justify-center gap-[7px] xl:hidden">
          {items.map((c, i) => (
            <span
              key={c.id}
              className={`h-[5px] rounded-full transition-all ${
                i === active ? "w-[22px] bg-[var(--accent)]" : "w-[5px] bg-[var(--surface-tag)]"
              }`}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}