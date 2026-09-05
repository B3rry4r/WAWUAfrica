"use client";

import { useIsDesktopAuth } from "./useIsDesktopAuth";

/**
 * THE VIDEO BEHIND THE AUTH SCREENS ON MOBILE.
 *
 * Desktop puts this footage in the brand panel beside the form, which is a
 * 9:16 column and fits it exactly. A phone has no room for a panel beside
 * anything, so here the video sits BEHIND the form, heavily blurred, with the
 * inputs and buttons riding on top of a scrim.
 *
 * ── WHY A SEPARATE, TINY FILE ──────────────────────────────────────────────
 * The desktop panel plays /landing-video.mp4, which is 18.6MB. Sending that to
 * a phone on Nigerian mobile data to sit behind a sign-in form would be
 * indefensible, and it is exactly why the panel was desktop-only in the first
 * place.
 *
 * This uses a ~1MB re-encode: 540x960, 24fps, no audio track at all. The blur
 * is deliberately light (7px) so the footage still reads as people rather than
 * as coloured fog, which is why the source is 540 wide and not smaller - at a
 * light blur the resolution shows, and a 360-wide source looked soft.
 *
 * ── READABILITY IS THE POINT, NOT THE VIDEO ───────────────────────────────
 * Three layers, in order: the blurred video, a scrim, then the form. The scrim
 * is opaque enough that a white label on a moving bright frame never drops
 * below readable, which is the failure mode that makes video backgrounds look
 * cheap. If a frame ever fights the text, the scrim wins.
 */
export function AuthMobileBackdrop() {
  const isDesktop = useIsDesktopAuth();
  // Nothing at all on desktop, and nothing until the width is known. This is
  // a mount check rather than a CSS one because display:none does not stop a
  // <video> downloading - see useIsDesktopAuth.
  if (isDesktop !== false) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden xl:hidden" aria-hidden="true">
      <video
        className="h-full w-full scale-[1.06] object-cover opacity-[0.9] blur-[7px]"
        src="/landing-video-mobile.mp4"
        poster="/landing-poster.jpg"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        tabIndex={-1}
      />
      {/*
        The overscale is not decoration either: blur samples beyond the
        element's edges, which leaves a soft transparent rim on all four sides.
        Overscaling pushes that rim off-screen. A lighter blur needs less of
        it, hence 1.06 rather than 1.1.
      */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(11,10,13,0.34)_0%,rgba(11,10,13,0.44)_45%,rgba(11,10,13,0.52)_100%)]" />
    </div>
  );
}
