"use client";

import { useEffect, useState } from "react";
import { USE_MOCKS } from "@/lib/api/config";
import { getAdminToken } from "@/lib/api/notifications";
import { AdminSignIn } from "./AdminSignIn";
import { CampaignComposer } from "./CampaignComposer";

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

  // localStorage is only readable after mount, so the first paint must not
  // guess at the answer.
  useEffect(() => {
    setSignedIn(USE_MOCKS || getAdminToken() !== null);
    setReady(true);
  }, []);

  return (
    <main className="min-h-screen bg-page text-text-primary">
      {!ready ? null : signedIn ? (
        <CampaignComposer />
      ) : (
        <AdminSignIn onSignedIn={() => setSignedIn(true)} />
      )}
    </main>
  );
}
