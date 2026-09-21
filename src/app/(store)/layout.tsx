import type { ReactNode } from "react";
import { SessionProvider } from "@/lib/auth/session-provider";

/**
 * The public storefront shell.
 *
 * Build brief C3: opening a shared `wawu/<handle>` link "goes straight to
 * their store. No login wall, no registration prompt, no interstitial."
 *
 * That is why this is a route group of its own rather than another screen
 * under `(app)`. Everything in `(app)` is wrapped in AppShell, which mounts
 * RequireAuth (redirects a sessionless visitor to /sign-in), plus a header,
 * a sidebar and a bottom bar that each fetch on mount with a token that does
 * not exist. A store link had to land somewhere that assumes nothing.
 *
 * SessionProvider is still here, for two reasons: the profile screen's own
 * controls sit inside components that read it, and the store header has to
 * be able to say "Open app" to somebody who is already signed in instead of
 * asking them to join a second time. It reads localStorage; it demands
 * nothing.
 */
export default function StoreLayout({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <div className="min-h-screen w-full bg-page">{children}</div>
    </SessionProvider>
  );
}
