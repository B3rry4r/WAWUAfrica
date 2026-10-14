"use client";

import { useEffect, useState } from "react";
import { getAdminToken } from "@/lib/api/notifications";
import { AdminSignIn } from "../notifications/AdminSignIn";
import { ReferralsDashboard } from "./ReferralsDashboard";

/**
 * /admin/referrals (REF-01): the referral codes of the /join registration
 * page, the totals of the whole offer and the people who registered, with a
 * CSV. Outside the `(app)` route group like the rest of the admin tools, on the
 * same admin sign-in: the real gate is the Hub's (AdminAuthGuard and the role
 * matrix), this screen only asks for the password because without one every
 * call it makes would 401. Dark, like the whole website.
 */
export default function AdminReferralsPage() {
  const [signedIn, setSignedIn] = useState(false);
  const [ready, setReady] = useState(false);

  // localStorage is only readable after mount, so the first paint must not guess.
  useEffect(() => {
    setSignedIn(getAdminToken() !== null);
    setReady(true);
  }, []);

  return (
    <main className="min-h-screen bg-page text-text-primary">
      {!ready ? null : signedIn ? (
        <ReferralsDashboard onSignedOut={() => setSignedIn(false)} />
      ) : (
        <AdminSignIn onSignedIn={() => setSignedIn(true)} title="Referral codes" />
      )}
    </main>
  );
}
