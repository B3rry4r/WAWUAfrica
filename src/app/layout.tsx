import type { Metadata } from "next";
import "./globals.css";

/**
 * Site-wide metadata.
 *
 * ── WHY metadataBase MATTERS ───────────────────────────────────────────────
 * Without it Next emits RELATIVE og:image URLs, and every scraper (Google,
 * WhatsApp, X, LinkedIn) needs absolute ones — so the share card renders with
 * no image at all. It reads from the deployment URL so preview builds do not
 * advertise production's address.
 *
 * ── THE DEFAULT SAYS WHAT WAWU IS ─────────────────────────────────────────
 * A page with no metadata of its own falls back to these words, so they are the
 * brand site's own (title, description and picture), never an old product line.
 * There is no default canonical or og:url: each page names its own, so no page
 * is ever canonicalised to the home page by inheritance.
 */
const SITE = "https://wawuafrica.com";
// No em-dash. This string is a browser tab, a Google result and the title
// on every share card, which is about as user-visible as copy gets.
const TITLE = "WAWUAfrica · Apps that give people a name, a voice and a way to earn";
const DESCRIPTION =
  "WAWU builds apps for everyday people. Who Made This lets you put your name on your work and get paid. VOICES asks one question a day about life in Nigeria: say your answer and vote.";
const IMAGE = "/wawu-og-brand.png";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? SITE),
  title: {
    default: TITLE,
    // Every other page appends to this rather than restating the brand.
    template: "%s · WAWUAfrica",
  },
  description: DESCRIPTION,
  applicationName: "WAWUAfrica",
  authors: [{ name: "WAWUAfrica" }],
  openGraph: {
    type: "website",
    siteName: "WAWUAfrica",
    title: TITLE,
    description: DESCRIPTION,
    locale: "en_NG",
    images: [{ url: IMAGE, width: 1200, height: 630, alt: "WAWU: apps that give people a name, a voice and a way to earn" }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [IMAGE],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
