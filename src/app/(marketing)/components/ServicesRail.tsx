"use client";

import { useRef, useState } from "react";
import type { ReactNode } from "react";

/**
 * The services rail: auto-scrolls, and can also be scrolled by hand.
 *
 * It used to be `overflow-hidden` with a CSS marquee, so the only way to see
 * a card was to wait for it to come round. Asked for directly: "can we be able
 * to scroll this too asides the slider".
 *
 * ── WHY IT STOPS INSTEAD OF RESUMING ──────────────────────────────────────
 * The marquee moves the CONTENT with a transform while scrolling moves the
 * VIEWPORT. Run both and they compound: the user drags right, the animation
 * keeps pulling left, and the cards fight the finger. So the first real
 * interaction hands control over for good. It demonstrates itself once, then
 * gets out of the way.
 *
 * ── AND WHY THE DUPLICATE HALF GOES WITH IT ───────────────────────────────
 * The list is doubled so a -50% translate loops seamlessly, and the copy is
 * inert: aria-hidden, pointer-events-none, so a screen reader does not read
 * every service twice. That copy is fine while it is scrolling past on its
 * own, and wrong the moment somebody can scroll to it by hand, because they
 * would reach a run of cards that cannot be clicked. Taking over drops it.
 */
export function ServicesRail({
  children,
  duplicate,
}: {
  children: ReactNode;
  /** The inert second copy, rendered only while the marquee is running. */
  duplicate: ReactNode;
}) {
  const [taken, setTaken] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  // A wheel, a drag or a touch is somebody choosing to look. A scroll event
  // alone is not enough: the animation itself does not fire one, but smooth
  // scrolling and anchor jumps can.
  const takeOver = () => setTaken((t) => t || true);

  return (
    <div
      ref={ref}
      onPointerDown={takeOver}
      onTouchStart={takeOver}
      onWheel={takeOver}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft" || e.key === "ArrowRight") takeOver();
      }}
      className={[
        "flex",
        // Scrollable in both states, so a trackpad swipe works even before the
        // pointer lands. wawu-no-scrollbar keeps the bar off the art.
        "wawu-no-scrollbar overflow-x-auto overscroll-x-contain",
        taken ? "snap-x snap-mandatory" : "",
        "[mask-image:linear-gradient(90deg,transparent,black_5%,black_95%,transparent)]",
      ].join(" ")}
      // Native horizontal panning, rather than the browser treating a
      // sideways drag as a page gesture.
      style={{ touchAction: "pan-x pan-y" }}
    >
      <div
        className={[
          "flex w-max gap-4 pr-4",
          taken
            ? ""
            : "animate-[wawuMarquee_46s_linear_infinite] hover:[animation-play-state:paused]",
        ].join(" ")}
      >
        {children}
        {taken ? null : duplicate}
      </div>
    </div>
  );
}
