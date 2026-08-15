"use client";

import { ContentCard } from "@/components/content/ContentCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import type { ContentPiece } from "@/types/content";

/** Horizontally scrollable creator showcase. Data is fetched server-side and passed in. */
export function CreatorCarousel({ items }: { items: ContentPiece[] }) {
  return (
    <section className="pb-11 pt-2 xl:mx-auto xl:max-w-[1440px]">
      <div className="px-5 xl:px-14">
        <SectionHeader caption="Earning on WAWU now" title="Creators to watch" action="See all" />
      </div>
      <div className="wawu-no-scrollbar flex snap-x snap-mandatory gap-3.5 overflow-x-auto px-5 py-4 xl:px-14">
        {items.map((c) => (
          <div key={c.id} className="w-[306px] shrink-0 snap-center">
            <ContentCard content={c} state="free" ratio="4 / 5" />
          </div>
        ))}
      </div>
    </section>
  );
}