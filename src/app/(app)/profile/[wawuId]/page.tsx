"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
// `toProfileView` is shared with the public store route: two copies of a
// normaliser is two places for a profile to start rendering differently.
import { getCreatorProfile, isFollowing, toProfileView } from "@/lib/api/profile";
import type { CreatorProfile } from "@/types/profile";
import { PROFILE_TAB_LABEL, type ProfileTab, type ProfileView } from "@/types/profile";
import { ErrorState } from "@/components/ui/ErrorState";
import { ProfileScreen } from "@/components/profile/ProfileScreen";
import { ProfileSkeleton } from "@/components/profile/ProfileSkeleton";

/**
 * Somebody else's profile.
 *
 * It renders ProfileScreen, the same component /profile renders for the
 * owner. This file's whole job is to fetch the public aggregate and normalise
 * it into ProfileView. Build brief C2 forbids a second template, and there
 * was one: this page WAS the storefront and /profile was a settings menu.
 *
 * Client Component, deliberately. A Server Component here always 401'd (no
 * session token exists during SSR) and, after profile.ts stopped catching and
 * returning mocks, that surfaced as a thrown error instead of the signed-in
 * viewer's real view of this creator. useSearchParams needs a Suspense
 * boundary, hence the wrapper.
 */
export default function VisitedProfilePage() {
  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <VisitedProfileContent />
    </Suspense>
  );
}


function VisitedProfileContent() {
  const params = useParams<{ wawuId: string }>();
  const wawuId = String(params?.wawuId ?? "");
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  // The screen decides which tabs EXIST (they depend on what this account
  // actually has), so this only has to reject a ?tab= that is not a tab at
  // all. An unavailable one falls back to Overview there.
  const tab: ProfileTab =
    tabParam && tabParam in PROFILE_TAB_LABEL ? (tabParam as ProfileTab) : "overview";

  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [following, setFollowing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    let active = true;
    setError(null);
    setProfile(null);
    Promise.all([getCreatorProfile(wawuId), isFollowing(wawuId)])
      .then(([p, f]) => {
        if (!active) return;
        setProfile(p);
        setFollowing(f);
      })
      .catch((e) => {
        if (!active) return;
        setError(e instanceof Error ? e.message : "This profile doesn't exist or was removed.");
      });
    return () => {
      active = false;
    };
  }, [wawuId]);

  useEffect(load, [load]);

  if (error) {
    return (
      <div className="p-4">
        <ErrorState title="Profile not found" body={error} onRetry={load} />
      </div>
    );
  }

  if (!profile) return <ProfileSkeleton />;

  return (
    <ProfileScreen
      view={toProfileView(profile)}
      isOwner={false}
      tab={tab}
      basePath={`/profile/${wawuId}`}
      following={following}
    />
  );
}
