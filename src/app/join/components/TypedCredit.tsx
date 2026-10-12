"use client";

import { useEffect, useRef } from "react";
import { TYPED_NAMES } from "./join-content";

/**
 * "MADE BY AMAKA": a name is typed and deleted, ending on YOU. Decoration only
 * (hidden from screen readers; the heading says the point). The static HTML,
 * and anyone who asks for less motion, sees "YOU".
 */
export function TypedCredit() {
  const nameRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = nameRef.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let timer: ReturnType<typeof setTimeout>;
    let i = 0;
    let chars = 0;
    let deleting = false;
    const tick = () => {
      const name = TYPED_NAMES[i % TYPED_NAMES.length];
      el.textContent = name.slice(0, chars);
      let wait = deleting ? 55 : 110;
      if (!deleting && chars === name.length) {
        wait = name === "YOU" ? 2600 : 1100;
        deleting = true;
      } else if (deleting && chars === 0) {
        deleting = false;
        i += 1;
        wait = 250;
      } else {
        chars += deleting ? -1 : 1;
      }
      timer = setTimeout(tick, wait);
    };
    tick();
    return () => clearTimeout(timer);
  }, []);

  return (
    <p aria-hidden="true" className="m-0 min-h-[1.6em] text-[17px] font-bold tracking-[0.04em] text-accent-soft dt:text-[22px]">
      MADE BY{" "}
      <b ref={nameRef} className="font-bold text-text-primary">
        YOU
      </b>
      <i className="ml-[3px] inline-block h-[1em] w-[2px] translate-y-[0.12em] bg-accent-soft not-italic motion-safe:animate-[wawuBlink_1s_steps(1)_infinite]" />
    </p>
  );
}
