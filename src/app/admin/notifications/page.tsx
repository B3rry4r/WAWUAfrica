"use client";

import { useEffect, useState } from "react";
import { USE_MOCKS } from "@/lib/api/config";
import { getAdminToken } from "@/lib/api/notifications";
import { AdminSignIn } from "./AdminSignIn";
import { CampaignComposer } from "./CampaignComposer";
import { EmailTab } from "./EmailTab";

/**
 * The admin push composer (build brief C8), deliberately OUTSIDE the `(app)`
 * route group.
 *
 * That group wraps everything in AppShell: the five-slot bottom bar, the
 * creator FAB, the app header. None of that belongs around an admin tool, and
 * putting it there would also put a link to the consumer app's navigation on
 * a screen reached with a different credential.
 *
 * ── THE GATE ─────────────────────────────────────────────────────────────────
 * The real gate is the backend's: every route under /admin/* is behind
 * AdminAuthGuard (an HS256 admin token from this backend's own AdminUser
 * table) and AdminRolesGuard, and DISPATCH is superadmin only. A WAWU ID user
 * token cannot satisfy any of it, because it is signed with a key this
 * backend has never held. So this screen is not what keeps anybody out: it
 * asks for the admin password because without one every call it makes would
 * 401.
 *
 * In a mock build there is no backend to sign in to (config.ts refuses to run
 * a production build in mock mode at all), so the composer opens straight
 * onto fixtures for development.
 */
export default function AdminNotificationsPage() {
  const [signedIn, setSignedIn] = useState(false);
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<"push" | "email">("push");

  // localStorage is only readable after mount, so the first paint must not
  // guess at the answer.
  useEffect(() => {
    setSignedIn(USE_MOCKS || getAdminToken() !== null);
    if (window.location.hash === "#email") setTab("email");
    setReady(true);
  }, []);

  return (
    <main className="min-h-screen bg-page text-text-primary">
      {!ready ? null : signedIn ? (
        <>
          <nav className="mx-auto flex max-w-[1180px] gap-2 px-4 pt-5" role="tablist" aria-label="Notification channels">
            {(
              [
                ["push", "Push"],
                ["email", "Email"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={tab === key}
                onClick={() => {
                  setTab(key);
                  window.history.replaceState(null, "", key === "email" ? "#email" : window.location.pathname);
                }}
                className={`rounded-button px-4 py-2 text-[14px] font-semibold transition-colors ${
                  tab === key ? "bg-accent text-on-accent" : "bg-card text-text-secondary hover:bg-elevated"
                }`}
              >
                {label}
              </button>
            ))}
            <a
              href="/admin/referrals"
              className="rounded-button bg-card px-4 py-2 text-[14px] font-semibold text-text-secondary transition-colors hover:bg-elevated"
            >
              Referrals
            </a>
          </nav>
          {tab === "push" ? (
            <CampaignComposer />
          ) : (
            <div className="mx-auto max-w-[1180px] px-4 py-6">
              <h1 className="m-0 mb-4 text-[22px] font-semibold tracking-[-0.02em] text-text-primary">Email campaigns</h1>
              <EmailTab />
            </div>
          )}
        </>
      ) : (
        <AdminSignIn onSignedIn={() => setSignedIn(true)} />
      )}
    </main>
  );
}
