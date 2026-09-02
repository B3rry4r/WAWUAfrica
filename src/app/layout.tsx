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
 * ── THE DESCRIPTION IS ONE CLAIM, NOT A LIST OF SECTORS ────────────────────
 * A description that names ten sectors in one breath ranks for none of them
 * and reads like a grant application. This says the one thing somebody is
 * searching for: African creators get paid for what they know, and keep most
 * of it.
 */
const SITE = "https://wawuafrica.com";
const TITLE = "WAWUAfrica — get paid for what you know";
const DESCRIPTION =
  "Publish your work, price it in naira, and keep up to 90% of what you earn. Courses, videos, audio and PDFs, plus the business services African creators actually need.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? SITE),
  title: {
    default: TITLE,
    // Every other page appends to this rather than restating the brand.
    template: "%s · WAWUAfrica",
  },
  description: DESCRIPTION,
  applicationName: "WAWUAfrica",
  keywords: [
    "WAWUAfrica",
    "sell courses Nigeria",
    "creator platform Africa",
    "get paid in naira",
    "monetise content Nigeria",
    "African creators",
  ],
  authors: [{ name: "WAWUAfrica" }],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "WAWUAfrica",
    title: TITLE,
    description: DESCRIPTION,
    url: "/",
    locale: "en_NG",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "WAWUAfrica" }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/og-image.png"],
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
