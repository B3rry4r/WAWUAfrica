"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui";
import { SlashedPrice } from "./SlashedPrice";
import { WAS_PRICE } from "./join-content";

/**
 * The phone's pinned "Reserve" bar. It slides up once the person has scrolled
 * past the top of the page and slides away while the form itself is on screen,
 * so it never sits on top of the thing it points at. Phones only: the desktop
 * layout has the form beside the offer.
 */
export function StickyBar({ price, watch }: { price: string | null; watch: string }) {
  const [on, setOn] = useState(false);

  useEffect(() => {
    const target = document.getElementById(watch);
    if (!target || typeof IntersectionObserver === "undefined") return;
    let formInView = false;
    const update = () => setOn(!formInView && window.scrollY > 300);
    const io = new IntersectionObserver(
      ([entry]) => {
        formInView = entry.isIntersecting;
        update();
      },
      { threshold: 0.05 },
    );
    io.observe(target);
    window.addEventListener("scroll", update, { passive: true });
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", update);
    };
  }, [watch]);

  return (
    <div
      aria-hidden={!on}
      className={`fixed inset-x-0 bottom-0 z-20 flex items-center justify-between gap-3 border-t border-hairline bg-[var(--surface-chrome)] px-4 pb-[calc(10px+env(safe-area-inset-bottom,0px))] pt-2.5 backdrop-blur-chrome transition-transform duration-200 motion-reduce:transition-none dt:hidden ${
        on ? "visible translate-y-0" : "invisible translate-y-[120%]"
      }`}
    >
      <div className="flex flex-col text-[14px] font-bold leading-tight text-text-primary">
        {price ? (
          <span>
            Pre-register for <SlashedPrice price={price} />
          </span>
        ) : (
          <span>Pre-register</span>
        )}
        <small className="text-[12px] font-medium text-text-secondary">Slashed from {WAS_PRICE}</small>
      </div>
      <Button href={`#${watch}`} size="md" className="flex-none">
        Reserve
      </Button>
    </div>
  );
}
