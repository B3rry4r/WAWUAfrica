"use client";

import { useEffect, useState } from "react";

/**
 * Whether the auth screens are at their desktop breakpoint (xl, 1280px).
 *
 * This exists because CSS CANNOT prevent a download. `hidden xl:flex` sets
 * display:none, and a display:none <video> still fetches its source, so the
 * desktop panel's 18.6MB file was being pulled down by every phone that opened
 * the sign-in screen. Measured, not assumed: 19.7MB of media on a 390px
 * viewport, on a screen whose whole job is two inputs and a button.
 *
 * Deciding in JS lets the tree MOUNT only the video the viewport will use.
 *
 * Returns null until mounted, deliberately. The server cannot know the
 * viewport, so rendering either video during SSR would both mis-guess and
 * cause a hydration mismatch; null means "not yet known" and both callers
 * render nothing, which costs one frame and no bytes.
 */
export function useIsDesktopAuth(): boolean | null {
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1280px)");
    const apply = () => setIsDesktop(mq.matches);
    apply();
    // Rotating a tablet, or dragging a desktop window narrow, should swap
    // which file is in use rather than leaving the wrong one playing.
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  return isDesktop;
}
