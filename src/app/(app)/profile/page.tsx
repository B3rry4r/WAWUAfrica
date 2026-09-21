"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getOwnProfile } from "@/lib/api/verification";
import { contentApi } from "@/lib/api/creator-content";
import { CONTENT_TYPE_META, type ContentItem } from "@/types/content";
import type { OwnProfile } from "@/types/verification";
import type { ProfileContentItem } from "@/types/profile";
import { PROFILE_TAB_LABEL, type ProfileTab, type ProfileView } from "@/types/profile";
import { ErrorState } from "@/components/ui/ErrorState";
import { ProfileScreen } from "@/components/profile/ProfileScreen";
import { ProfileSkeleton } from "@/components/profile/ProfileSkeleton";

/**
 * Your own profile - the SAME screen anybody else sees, with Edit controls.
 *
 * WHAT THIS WAS. A settings menu: a small identity block over a column of
 * ListRows (creator dashboard, my content, earnings, wallet, identity
 * verification, verification badge, purchases, saved, settings). None of it
 * was the profile. The owner had no way to see their own storefront as a
 * visitor sees it, which on a page whose job is to sell their work is the
 * view that matters most, and build brief C2 forbids the fork outright.
 *
 * Those rows were not deleted, they were already duplicated: Settings (nav
 * slot 5) carries account, privacy, notifications and the rest, the creator
 * dashboard carries earnings, content and the inbox, and both are one tap
 * from the header. This page is the profile now.
 */
export default function OwnProfilePage() {
  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <OwnProfileContent />
    </Suspense>
  );
}

/**
 * The owner's own library, in the shape the profile renders.
 *
 * GET own-profile carries no content at all, so without this the owner's
 * Featured and Content tabs were empty on a profile full of published work -
 * the exact "you cannot see your own storefront" problem this rebuild is for.
 * A rejected piece is left out: it is not published, so it is not on the
 * storefront, and it already has a home in /create/library where it can be
 * fixed.
 */
function toContentItems(items: ContentItem[]): ProfileContentItem[] {
  return items
    .filter((i) => i.status !== "rejected")
    .map((i) => ({
      id: i.id,
      title: i.title,
      kindLabel: CONTENT_TYPE_META[i.type].label,
      price: i.price,
      // Your own work is never locked to you.
      locked: false,
      previewAssetUrl: i.previewAssetUrl,
      status: i.status === "review" ? "pending" : "approved",
      ownerMeta: i.activity,
    }));
}

function toView(p: OwnProfile, content: ProfileContentItem[]): ProfileView {
  return {
    wawuId: p.wawuId,
    name: p.name,
    handle: p.handle,
    bio: p.bio,
    verification: p.verification,
    avatarUrl: p.avatarUrl,
    coverUrl: p.coverUrl,
    website: p.socials.website,
    // `interests` is the older free-text list the profile editor writes;
    // ProfileScreen resolves C1 ids where they are ids and renders the rest
    // as typed, so both shapes survive the taxonomy migration.
    specializations: p.interests,
    roleLine: p.interests[0],
    socials: p.socials,
    stats: {
      pieces: p.stats.published,
      piecesLabel: "Published",
      // Deliberately conditional. No endpoint returns a follower count for
      // the caller's OWN profile - that field lives on the public aggregate,
      // keyed by another user's wawuId - and "0 Followers" on your own page
      // is a claim, not an absence.
      followers: p.stats.followers,
    },
    // No `dm`: you cannot pay to message yourself, and the paid-action row is
    // the one block the two views legitimately differ on.
    content,
    // GET own-profile carries no community list. The Overview section is
    // conditional on a non-empty array, so the owner simply does not get that
    // block rather than getting an empty one claiming they host nothing.
    communities: [],
  };
}

function OwnProfileContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  // The screen decides which tabs EXIST (they depend on what this account
  // actually has), so this only has to reject a ?tab= that is not a tab at
  // all. An unavailable one falls back to Overview there.
  const tab: ProfileTab =
    tabParam && tabParam in PROFILE_TAB_LABEL ? (tabParam as ProfileTab) : "overview";

  const [profile, setProfile] = useState<OwnProfile | null>(null);
  const [content, setContent] = useState<ProfileContentItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    let active = true;
    setError(null);
    setProfile(null);
    getOwnProfile()
      .then((p) => active && setProfile(p))
      .catch((e: unknown) => {
        if (active) setError(e instanceof Error ? e.message : "We couldn't load your profile.");
      });
    // Read separately, and a failure here is NOT a failure of the page: the
    // identity block is the part somebody came for, and an unreadable library
    // shows the empty state rather than an error where a profile should be.
    contentApi
      .getLibrary()
      .then((items) => active && setContent(toContentItems(items)))
      .catch(() => active && setContent([]));
    return () => {
      active = false;
    };
  }, []);

  useEffect(load, [load]);

  if (error) return <ErrorState title={error} onRetry={load} />;
  if (!profile) return <ProfileSkeleton />;

  return <ProfileScreen view={toView(profile, content)} isOwner tab={tab} basePath="/profile" />;
}
