import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { appRedirectTarget } from "@/lib/app-redirects";
import { currentSiteMode, isOpenInJoinOnly } from "@/lib/site-mode";

/**
 * Site mode (see lib/site-mode.ts). In `full` mode this does nothing. In
 * `join-only` mode a path that is open (the landing page, the company pages,
 * /join, the legal pages, the password pages /forgot-password, /reset-password
 * and /activate, a file those pages need, the two app-link files under
 * /.well-known, and /admin) goes through. An old app address (a profile, a
 * piece, a receipt, sign in and the rest) gets a 308 to the same place on
 * https://usewmt.com (WEB-STRIP, R-133; src/lib/app-redirects.ts). Every other
 * path gets a 307 to /join, /api paths and /payment/return among them. 307
 * keeps the method, so a stray POST is not silently turned into a GET.
 *
 * The mode is read from the environment on every request (currentSiteMode), so
 * changing SITE_MODE (or the deployment's VERCEL_ENV) changes behaviour without
 * a rebuild of the code.
 */
export function middleware(request: NextRequest) {
  if (currentSiteMode() === "full") return NextResponse.next();

  if (isOpenInJoinOnly(request.nextUrl.pathname)) return NextResponse.next();

  const app = appRedirectTarget(request.nextUrl.pathname, request.nextUrl.search);
  if (app) {
    const response = NextResponse.redirect(app, 308);
    // A permanent answer, but not one a browser keeps for ever: SITE_MODE can still be flipped back.
    response.headers.set("Cache-Control", "public, max-age=3600");
    return response;
  }

  return redirectToJoin(request);
}

/**
 * 307 to /join, on the host the request came in on. Next only takes an absolute
 * URL here and builds it from the request itself, which is the public address
 * on Vercel. (A local `next start` on a bare IP such as 127.0.0.1 is the one
 * place Next names its own host "localhost" instead: open the site as
 * http://localhost:PORT there and the redirect stays on the same origin.)
 */
function redirectToJoin(request: NextRequest): NextResponse {
  const target = request.nextUrl.clone();
  target.pathname = "/join";
  target.search = "";
  const response = NextResponse.redirect(target, 307);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export const config = {
  // Everything except the build's own static assets and the image optimiser,
  // which the page needs and which carry nothing of the site.
  matcher: ["/((?!_next/static|_next/image).*)"],
};
