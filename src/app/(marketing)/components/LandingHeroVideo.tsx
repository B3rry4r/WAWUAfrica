"use client";

import { useEffect, useState } from "react";

/**
 * The portrait film under the mascot, ON PHONES ONLY.
 *
 * Mounted rather than hidden. `dt:hidden` would still download the file on
 * every desktop visit, because CSS cannot stop a <video> fetching its source -
 * the same trap the auth brand panel was in, where a 390px viewport was
 * measured pulling 19.7MB it never displayed.
 *
 * It plays a 2.8MB re-encode rather than the 18.6MB master. The element is
 * 340 CSS px wide, so 720x1280 covers a 2x screen properly; sending eighteen
 * megabytes to a phone to paint a third of its width is indefensible on the
 * mobile data this is mostly viewed over.
 *
 * Returns null until the width is known: the server cannot know the viewport,
 * so guessing during SSR would both mis-render and cause a hydration
 * mismatch. One frame costs nothing; a wrong guess costs the whole file.
 */
export function LandingHeroVideo() {
  const [isPhone, setIsPhone] = useState<boolean | null>(null);

  useEffect(() => {
    // Matches the `dt:` breakpoint the rest of this page lays out against.
    const mq = window.matchMedia("(max-width: 1023px)");
    const apply = () => setIsPhone(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  if (isPhone !== true) return null;

  return (
    <video
      className="h-auto w-full max-w-[340px] rounded-card border border-hairline object-cover"
      src="/landing-video-hero.mp4"
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      aria-label="What WAWUAfrica does"
    />
  );
}
