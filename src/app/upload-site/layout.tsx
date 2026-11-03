import type { Metadata } from "next";
import localFont from "next/font/local";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { SiteUploadRoot } from "@/components/site-upload/SiteUploadShell";
import { currentSiteMode } from "@/lib/site-mode";

/**
 * The join-only upload pages (WEB-UPLOAD, owner 3 Nov 2026, R-126).
 *
 * In join-only mode the middleware answers /sign-in, /sign-up, /forgot-password, /create/new and
 * /create/library from this folder (src/lib/site-mode.ts, `joinOnlyRewrite`); the address in the browser
 * stays the one the person typed. In full mode this folder is not served at all: the pages that have
 * always lived at those addresses are, so full mode is unchanged.
 *
 * Dynamic on purpose, like the landing page: the mode is read from the environment on each request, so
 * SITE_MODE changes the answer with no rebuild and a prerender cannot freeze one.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: "Upload · WAWUAfrica" },
  // Pages behind a sign-in: never indexed.
  robots: { index: false, follow: false },
};

// Alan Sans, the brand font, from the brand site's own file (nothing is requested from a font host).
const alanSans = localFont({
  src: "../(site)/_fonts/AlanSans-latin-wght.woff2",
  variable: "--font-site",
  weight: "300 900",
  display: "swap",
  fallback: ["-apple-system", "BlinkMacSystemFont", "Segoe UI", "Helvetica", "Arial", "sans-serif"],
});

export default function UploadSiteLayout({ children }: { children: ReactNode }) {
  if (currentSiteMode() !== "join-only") notFound();
  return (
    <div className={`${alanSans.variable} font-site antialiased`}>
      <SiteUploadRoot>{children}</SiteUploadRoot>
    </div>
  );
}
