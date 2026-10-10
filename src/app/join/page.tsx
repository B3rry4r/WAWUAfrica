import type { Metadata } from "next";
import { JoinFlow } from "./components/JoinFlow";

/**
 * wawuafrica.com/join: the event registration link.
 *
 * A waiting list, not an account: a person scans a QR code or taps a shared
 * link, fills in a short form, pays the event fee and is told they are
 * registered. No sign-in, no password, no code. The sign-up page is a
 * different thing and is not touched by any of this.
 *
 * The share card is written out in full, images included, because a page's
 * `openGraph` replaces the root layout's rather than merging with it. Without
 * the image line a link pasted into WhatsApp would show a title and no picture.
 */
const TITLE = "Join WAWU";
const DESCRIPTION = "Register for WAWU at the event. Pay once, then sign up in the WAWU app and your plan will be waiting.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "/join" },
  openGraph: {
    type: "website",
    siteName: "WAWUAfrica",
    title: TITLE,
    description: DESCRIPTION,
    url: "/join",
    locale: "en_NG",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "WAWU" }],
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION, images: ["/og-image.png"] },
  // An event link, not a page to rank: it stops meaning anything when the offer closes.
  robots: { index: false, follow: false },
};

/**
 * No Suspense and no search-params hook here on purpose: either one makes
 * Next send an empty page and draw everything with JavaScript, which on a slow
 * venue connection is a blank screen. Rendered plainly, the static HTML already
 * holds the logo, the heading and the form's skeleton.
 */
export default function JoinPage() {
  return <JoinFlow />;
}
