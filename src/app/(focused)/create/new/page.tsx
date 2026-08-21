"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CONTENT_TYPES, type ContentType } from "@/types/content";
import { contentApi } from "@/lib/api/creator-content";
import type { ContentItem } from "@/types/content";
import { PublishingWizard } from "@/components/create/PublishingWizard";
import { useSession } from "@/lib/auth/session-provider";
import { creatorGates } from "@/lib/auth/gates";
import { FlowHeader } from "@/components/layout/FlowHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Feedback";

export default function NewContentPage() {
  const searchParams = useSearchParams();
  const { user, hydrated } = useSession();
  const gates = creatorGates(user);

  const resubmitId = searchParams.get("resubmit");
  const [resubmitItem, setResubmitItem] = useState<ContentItem | null | undefined>(resubmitId ? undefined : null);
  // Whether this creator has anything live yet — determines whether this
  // upload is the free first one. Read fresh from the real library rather
  // than the frozen mock array, since that's what actually changes as
  // uploads get published.
  const [hasPublished, setHasPublished] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    if (!resubmitId) return;
    let cancelled = false;
    contentApi.getLibraryItem(resubmitId).then((item) => {
      if (!cancelled) setResubmitItem(item ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [resubmitId]);

  useEffect(() => {
    let cancelled = false;
    contentApi.getLibrary().then((items) => {
      if (!cancelled) setHasPublished(items.some((i) => i.status === "live"));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Real session hasn't hydrated from localStorage yet (SSR / first paint) —
  // hold off on any gate decision until we actually know who is signed in.
  if (!hydrated) {
    return (
      <div className="flex flex-col min-h-[100vh] max-w-[var(--mobile-column)] xl:max-w-[760px] m-0 xl:max-w-none">
        <FlowHeader title="Upload" />
        <div className="flex flex-col gap-[12px] p-[16px]">
          <Skeleton height={80} radius="var(--radius-card)" />
        </div>
      </div>
    );
  }

  // This route is a direct URL, not just a button behind CreateHub — it needs
  // the same two gates CreateHub enforces, or it's a bypass of "paid
  // subscription unlocks uploading". KYC status never factors in here.
  if (!gates.isCreator) {
    return (
      <>
        <div className="flex flex-col min-h-[100vh] max-w-[var(--mobile-column)] xl:max-w-[760px] m-0 xl:hidden">
          <FlowHeader title="Upload" />
          <EmptyState
            icon="Sparkles"
            title="Uploading needs a creator account"
            caption="User accounts can buy, save and message. Switch to a creator account to publish videos, courses, PDFs and more."
            action="Set up a creator account"
            actionHref="/onboarding"
          />
        </div>
        {/* Desktop has no DesktopHeader here (/create/new owns its own header
            per AppHeader.OWN_HEADER_ROUTES) and FocusedFlowShell gives this
            route the full remaining width next to the Sidebar — so the gate
            card is centered in that space rather than left-pinned at mobile
            width, matching the sizing/centering other centered empty states
            (e.g. communities' "Select a room") use at xl. */}
        <div className="hidden xl:flex xl:h-full xl:items-center xl:justify-center xl:p-[48px]">
          <div className="w-full max-w-[420px]">
            <EmptyState
              icon="Sparkles"
              title="Uploading needs a creator account"
              caption="User accounts can buy, save and message. Switch to a creator account to publish videos, courses, PDFs and more."
              action="Set up a creator account"
              actionHref="/onboarding"
            />
          </div>
        </div>
      </>
    );
  }

  if (!gates.canUpload) {
    return (
      <>
        <div className="flex flex-col min-h-[100vh] max-w-[var(--mobile-column)] xl:max-w-[760px] m-0 xl:hidden">
          <FlowHeader title="Upload" />
          <EmptyState
            icon="CreditCard"
            title="Subscribe to unlock uploading"
            caption="A paid creator subscription unlocks publishing. KYC is separate and only gates payouts."
            action="Choose a plan"
            actionHref="/subscription"
          />
        </div>
        <div className="hidden xl:flex xl:h-full xl:items-center xl:justify-center xl:p-[48px]">
          <div className="w-full max-w-[420px]">
            <EmptyState
              icon="CreditCard"
              title="Subscribe to unlock uploading"
              caption="A paid creator subscription unlocks publishing. KYC is separate and only gates payouts."
              action="Choose a plan"
              actionHref="/subscription"
            />
          </div>
        </div>
      </>
    );
  }

  // Waiting on the resubmit item and/or the live library to load.
  if (resubmitItem === undefined || hasPublished === undefined) {
    return (
      <div className="flex flex-col min-h-[100vh] max-w-[var(--mobile-column)] xl:max-w-[760px] m-0 xl:max-w-none">
        <FlowHeader title="Upload" />
        <div className="flex flex-col gap-[12px] p-[16px]">
          <Skeleton height={80} radius="var(--radius-card)" />
        </div>
      </div>
    );
  }

  const typeParam = searchParams.get("type");
  const type: ContentType = resubmitItem
    ? resubmitItem.type
    : CONTENT_TYPES.includes(typeParam as ContentType)
      ? (typeParam as ContentType)
      : "video";

  const firstUpload = resubmitItem
    ? !!resubmitItem.isFirstUpload
    : searchParams.get("first") === "1"
      ? true
      : !hasPublished;

  return (
    <PublishingWizard
      type={type}
      firstUpload={firstUpload}
      resubmit={resubmitItem ? { id: resubmitItem.id, title: resubmitItem.title } : undefined}
    />
  );
}
