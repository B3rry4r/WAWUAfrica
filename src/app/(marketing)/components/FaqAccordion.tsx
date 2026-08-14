"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";

interface FaqItem {
  q: string;
  a: string;
}

export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState(0);

  return (
    <div className="overflow-hidden rounded-card border border-hairline bg-card">
      {items.map((item, i) => (
        <div key={item.q} className="border-b border-hairline last:border-b-0">
          <button
            type="button"
            onClick={() => setOpen(open === i ? -1 : i)}
            className="flex w-full items-center gap-3.5 px-[18px] py-[17px] text-left"
          >
            <span className="flex-1 text-[14.5px] font-semibold leading-normal text-text-primary">{item.q}</span>
            <Icon name={open === i ? "Minus" : "Plus"} size={17} color="var(--text-muted)" strokeWidth={2.2} />
          </button>
          {open === i ? (
            <p className="px-[18px] pb-[18px] text-[13.5px] leading-relaxed text-text-secondary">{item.a}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}