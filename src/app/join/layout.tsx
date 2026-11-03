import localFont from "next/font/local";
import type { ReactNode } from "react";

/**
 * /join and /join/paid wear the brand site's typeface (JOIN-TIERS-WEB, owner 3 Nov 2026): Alan Sans, the
 * same file the brand pages use (src/app/(site)/_fonts), served from this site by next/font, so a visit
 * makes no request to a font host. Only the face changes: /join keeps its own dark, clean flow.
 */
const alanSans = localFont({
  src: "../(site)/_fonts/AlanSans-latin-wght.woff2",
  variable: "--font-site",
  weight: "300 900",
  display: "swap",
  fallback: ["-apple-system", "BlinkMacSystemFont", "Segoe UI", "Helvetica", "Arial", "sans-serif"],
});

export default function JoinLayout({ children }: { children: ReactNode }) {
  return <div className={`${alanSans.variable} font-site`}>{children}</div>;
}
