import type { Metadata } from "next";
import { JoinFlow } from "./components/JoinFlow";

/**
 * wawuafrica.com/join: the event registration link.
 *
 * A waiting list, not an account: a person scans a QR code or taps a shared
 * link, reads the page, fills in a short form, pays the pre-registration fee
 * and is told they are registered. There is no free route. No sign-in, no
 * password, no code. The sign-up page is a different thing and is not touched
 * by any of this. The page is the owner's redesign of 12 Oct 2026 (no date
 * anywhere: "this October").
 *
 * The share card is written out in full, images included, because a page's
 * `openGraph` replaces the root layout's rather than merging with it. Without
 * the image line a link pasted into WhatsApp would show a title and no picture.
 */
const TITLE = "WHO MADE THIS? Pre-registration";
const DESCRIPTION =
  "Pre-register once for the PUT YOUR NAME ON IT conference in Lagos, Abuja, Port Harcourt and Enugu, and for WHO MADE THIS?, the creator and professional monetization platform launching this October.";
/** The Who Made This lockup on the site's dark background, 1200 x 630. Root of public/: production serves only root-level files. */
const SHARE_IMAGE = "/who-made-this-og.png";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "/join" },
  openGraph: {
    type: "website",
    siteName: "WHO MADE THIS?",
    title: TITLE,
    description: DESCRIPTION,
    url: "/join",
    locale: "en_NG",
    images: [{ url: SHARE_IMAGE, width: 1200, height: 630, alt: "WHO MADE THIS?" }],
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION, images: [SHARE_IMAGE] },
  // An event link, not a page to rank: it stops meaning anything when the offer closes.
  robots: { index: false, follow: false },
};

/**
 * No Suspense and no search-params hook here on purpose: either one makes
 * Next send an empty page and draw everything with JavaScript, which on a slow
 * venue connection is a blank screen. Rendered plainly, the static HTML already
 * holds the whole page and the form's skeleton.
 */
export default function JoinPage() {
  return <JoinFlow />;
}
