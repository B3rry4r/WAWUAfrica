import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { CONTENT_FALLBACK_PREFIX, contentIdFrom } from "@/lib/app-links";
import { currentSiteMode, isOpenInJoinOnly } from "@/lib/site-mode";

/**
 * Site mode (see lib/site-mode.ts). In `full` mode this does nothing. In
 * `join-only` mode every path that is not the landing page, the registration
 * link, the privacy document it links to, a file those pages need, the two
 * pages WAWU's emails link to (/reset-password, /forgot-password) or an app
 * link (/r/<code>, /selfie, /activate, /receipt/<code>, /u/<handle>, /c/<slug>,
 * /content/<id> and the two /.well-known files, see app-links.ts)
 * gets a 307 to /join: pages, the app, sign-in and sign-up, /payment/return
 * and any /api path alike. 307 keeps the method, so a stray POST is not
 * silently turned into a GET.
 *
 * /content/<id> is the one app link that shares its path with a page of the
 * full site ((app)/content/[id]). In join-only mode it is rewritten (the
 * address in the browser does not change) to the small "Open in the WAWU app"
 * page, so the full site's content page does not answer there; in full mode
 * the full site's own page answers, as it always did.
 *
 * The mode is read from the environment on every request (currentSiteMode), so
 * changing SITE_MODE (or the deployment's VERCEL_ENV) changes behaviour without
 * a rebuild of the code.
 */
export function middleware(request: NextRequest) {
  if (currentSiteMode() === "full") return NextResponse.next();

  const contentId = contentIdFrom(request.nextUrl.pathname);
  if (contentId) return rewriteToContentFallback(request, contentId);
  if (isOpenInJoinOnly(request.nextUrl.pathname)) return NextResponse.next();

  return redirectToJoin(request);
}

/** /content/<id> in join-only mode: the fallback page for that id, same address, no query. */
function rewriteToContentFallback(request: NextRequest, id: string): NextResponse {
  const target = request.nextUrl.clone();
  target.pathname = `${CONTENT_FALLBACK_PREFIX}${id}`;
  target.search = "";
  return NextResponse.rewrite(target);
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
