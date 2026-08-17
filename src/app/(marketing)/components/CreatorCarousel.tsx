"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ContentCard } from "@/components/content/ContentCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import type { ContentPiece } from "@/types/content";

/**
 * Horizontally scrollable creator showcase. Data is fetched server-side and
 * passed in — always a real read of the feed (getFeaturedContent() throws
 * rather than substituting fixture creators on failure; see its doc comment
 * in src/lib/api/content.ts and LandingContent's handling of that error).
 */
export function CreatorCarousel({ items }: { items: ContentPiece[] }) {
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
          caption="Earning on WAWU now"
          title="Creators to watch"
          action="See all"
          onAction={() => router.push("/sign-up")}
        />
      </div>
      <div
        ref={railRef}
        onScroll={onScroll}
        className="wawu-no-scrollbar flex snap-x snap-mandatory gap-3.5 overflow-x-auto px-5 pb-2 pt-4 xl:px-14"
      >
        {items.map((c) => (
          <div key={c.id} className="w-[306px] shrink-0 snap-center">
            <ContentCard content={c} state="free" ratio="4 / 5" href="/sign-up" />
          </div>
        ))}
      </div>
      {items.length > 1 ? (
        <div className="mt-4 flex justify-center gap-[7px] xl:hidden">
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