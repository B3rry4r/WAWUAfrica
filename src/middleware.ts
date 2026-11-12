import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { appRedirectTarget, APP_ORIGIN, movedPageTarget } from "@/lib/app-redirects";
import { currentSiteMode, isOpenInJoinOnly } from "@/lib/site-mode";

/**
 * Site mode (see lib/site-mode.ts). In `full` mode this does nothing. In
 * `join-only` mode a path that is open (the landing page, the company pages,
 * /join/paid, the legal pages, a file those pages need, the two app-link files under
 * /.well-known, and /admin) goes through. An old app address (a profile, a
 * piece, a receipt, sign in and the rest) gets a 308 to the same place on
 * https://usewmt.com (WEB-STRIP, R-133; src/lib/app-redirects.ts). Every other
 * path gets a 307 to https://usewmt.com, /api paths and /payment/return among them. 307
 * keeps the method, so a stray POST is not silently turned into a GET.
 *
 * The mode is read from the environment on every request (currentSiteMode), so
 * changing SITE_MODE (or the deployment's VERCEL_ENV) changes behaviour without
 * a rebuild of the code.
 */
export function middleware(request: NextRequest) {
  // R-141: the join page, the Who Made This page and the password pages are gone from this site, in every mode.
  // A password page keeps its query string (the mails' token and email). Next hands the query over
  // already parsed, so a character a URL treats as equal (an "@" and "%40") may come back in its percent form;
  // the values are the same, and the mails' own tokens (hex) and emails (%40, %2B) arrive exactly as sent.
  const closed = movedPageTarget(request.nextUrl.pathname, request.nextUrl.search);
  if (closed) return permanent(closed);

  if (currentSiteMode() === "full") return NextResponse.next();

  if (isOpenInJoinOnly(request.nextUrl.pathname)) return NextResponse.next();

  const app = appRedirectTarget(request.nextUrl.pathname, request.nextUrl.search);
  if (app) return permanent(app);

  return redirectToApp();
}

/** 308, a permanent answer, but not one a browser keeps for ever: SITE_MODE can still be flipped back. */
function permanent(target: string): NextResponse {
  const response = NextResponse.redirect(target, 308);
  response.headers.set("Cache-Control", "public, max-age=3600");
  return response;
}

/**
 * 307 to the Who Made This app's home for any other closed path (R-141: the site has no join page to send
 * people to). 307, not 308: it is not a known app address, and 307 keeps the method, so a stray POST is not
 * silently turned into a GET.
 */
function redirectToApp(): NextResponse {
  const response = NextResponse.redirect(APP_ORIGIN, 307);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export const config = {
  // Everything except the build's own static assets and the image optimiser,
  // which the page needs and which carry nothing of the site.
  matcher: ["/((?!_next/static|_next/image).*)"],
};
