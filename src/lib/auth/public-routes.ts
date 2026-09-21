/**
 * The paths a visitor with NO session is allowed to open, in one place.
 *
 * WHY THIS IS A MODULE AND NOT THREE ARRAYS. The same list was written out
 * twice already (RequireAuth's PUBLIC_ROUTES and AppShell's
 * PUBLIC_DOCUMENT_ROUTES, with a comment on one telling the next person to
 * keep it in step with the other), and allowing a route needs agreement in
 * THREE places, not two: the gate that redirects, the shell that would
 * otherwise mount chrome which fetches, and the API client's 401 handler,
 * which hard-navigates to /sign-in the moment any authed call comes back
 * unauthorised. Miss the third and a genuinely public page still evicts its
 * visitor as soon as one background read 401s, which is exactly what
 * happened to the store link.
 *
 * Build brief C3: a shared store link "goes straight to their store. No login
 * wall, no registration prompt, no interstitial." A logged-out visitor is a
 * first-class actor here, so the set of pages that serve one is product
 * state, not an implementation detail of whichever component asks.
 *
 * Note what is NOT listed: /, /sign-in, /sign-up and the rest of the
 * marketing and auth groups. They live outside the (app) route group
 * entirely, so no gate ever runs on them and they need no entry.
 */

/** Exact matches. Documents, not screens: no account, no chrome, no fetch. */
const PUBLIC_PATHS = ["/terms", "/privacy/policy"];

/**
 * Subtrees. `/wawu/<handle>` is the shareable store link (C3) and everything
 * under it is public by construction; `/privacy` on its own stays gated,
 * which is why the privacy policy is an exact match above and not a prefix.
 */
const PUBLIC_PREFIXES = ["/wawu/"];

export function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}
