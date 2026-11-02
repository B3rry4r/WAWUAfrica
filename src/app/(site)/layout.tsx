import localFont from "next/font/local";
import type { ReactNode } from "react";
import { SiteFooter } from "./_components/SiteFooter";
import { SiteHeader } from "./_components/SiteHeader";
import "./site.css";

/**
 * The brand site: the public pages of wawuafrica.com (BRAND-SITE, owner 2 Nov
 * 2026), apart from /join and the legal pages. Alan Sans is the brand font;
 * the file is the Fontsource build of the Google Fonts original (latin,
 * variable weight 300-900), served from this site by next/font, so a visit
 * makes no request to a font host.
 */
const alanSans = localFont({
  src: "./_fonts/AlanSans-latin-wght.woff2",
  variable: "--font-site",
  weight: "300 900",
  display: "swap",
  fallback: ["-apple-system", "BlinkMacSystemFont", "Segoe UI", "Helvetica", "Arial", "sans-serif"],
});

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`wawu-site ${alanSans.variable} flex min-h-screen flex-col font-site antialiased`}>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-white focus:px-5 focus:py-3 focus:text-[15px] focus:font-bold focus:text-site-deep focus:shadow-lg"
      >
        Skip to content
      </a>
      <SiteHeader />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
