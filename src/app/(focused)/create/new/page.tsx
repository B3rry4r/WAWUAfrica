"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CONTENT_TYPES, type ContentType } from "@/types/content";
import { PLANS } from "@/types/subscription";
import { contentApi } from "@/lib/api/creator-content";
import type { ContentItem } from "@/types/content";
import { PublishingWizard } from "@/components/create/PublishingWizard";
import { creatorGates } from "@/lib/auth/gates";
import { useCreatorState } from "@/lib/auth/use-creator-state";
import { FlowHeader } from "@/components/layout/FlowHeader";
import { EmptyState, Skeleton } from "@/components/ui";

/**
 * Shell for this route's non-wizard states.
 *
 * The old markup carried `max-w-[var(--mobile-column)] xl:max-w-[760px] m-0
 * xl:max-w-none` — two contradictory `xl:max-w` utilities on one node, plus
 * an `xl:max-w` on nodes that were `xl:hidden` anyway — and the gate states
 * duplicated the same EmptyState twice, once per breakpoint. One shell, one
 * copy of the content: mobile column below `dt`, centred pane above it.
 */
function FlowPane({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-[100vh] w-full max-w-[var(--mobile-column)] flex-col dt:min-h-0 dt:h-full dt:max-w-[560px] dt:justify-center dt:py-[48px]">
      {children}
    </div>
  );
}

export default function NewContentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Live creator state, never the session's sign-in-time snapshot: this route
  // is a direct URL that enforces both upload gates, and the snapshot says
  // "user" forever for anyone who subscribed after signing in.
  const { creator, resolved } = useCreatorState();
  const gates = creatorGates({ creator });

  const resubmitId = searchParams.get("resubmit");
  const [resubmitItem, setResubmitItem] = useState<ContentItem | null | undefined>(resubmitId ? undefined : null);
  // Whether this creator has anything live yet — determines whether this
  // upload is the first one, which the server requires to go out at ₦0. Read
  // fresh from the real library rather than the frozen mock array, since
  // that's what actually changes as uploads get published.
  const [hasPublished, setHasPublished] = useState<boolean | undefined>(undefined);
  // How many ₦0 pieces already exist. The plan includes a fixed number of
  // them (Basic 1, Pro 2) and the server enforces that, so the wizard has to
  // count them rather than assuming "first upload only" — which is what it
  // used to do, quietly costing Pro creators the second slot they paid for.
  const [noChargeUsed, setNoChargeUsed] = useState<number | undefined>(undefined);

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
      if (cancelled) return;
      setHasPublished(items.some((i) => i.status === "live"));
      // A rejected piece hands its slot back, so it does not count.
      setNoChargeUsed(items.filter((i) => i.status !== "rejected" && i.price === 0).length);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // No gate decision until the SERVER has answered whether this account is a
  // creator (`resolved` covers session hydration too).
  if (!resolved) {
    return (
      <FlowPane>
        <div className="dt:hidden">
          <FlowHeader title="Upload" onBack={() => router.push("/create")} />
        </div>
        <div className="flex flex-col gap-[12px] p-[16px]">
          <Skeleton variant="row" className="h-[80px] rounded-card" />
          <Skeleton variant="row" className="h-[80px] rounded-card" />
        </div>
      </FlowPane>
    );
  }

  // This route is a direct URL, not just a button behind CreateHub — it needs
  // the same two gates CreateHub enforces, or it's a bypass of "paid
  // subscription unlocks uploading". KYC status never factors in here.
  if (!gates.isCreator) {
    return (
      <FlowPane>
        <div className="dt:hidden">
          <FlowHeader title="Upload" onBack={() => router.push("/create")} />
        </div>
        <EmptyState
          icon="Sparkles"
          title="Uploading needs a creator account"
          caption="User accounts can buy, save and message. Switch to a creator account to publish videos, courses, PDFs and more."
          action="Set up a creator account"
          actionHref="/onboarding"
        />
      </FlowPane>
    );
  }

  if (!gates.canUpload) {
    return (
      <FlowPane>
        <div className="dt:hidden">
          <FlowHeader title="Upload" onBack={() => router.push("/create")} />
        </div>
        <EmptyState
          icon="CreditCard"
          title="Subscribe to unlock uploading"
          caption="A paid creator subscription unlocks publishing. KYC is separate and only gates payouts."
          action="Choose a plan"
          actionHref="/subscription"
        />
      </FlowPane>
    );
  }

  // Waiting on the resubmit item and/or the live library to load.
  if (resubmitItem === undefined || hasPublished === undefined || noChargeUsed === undefined) {
    return (
      <FlowPane>
        <div className="dt:hidden">
          <FlowHeader title="Upload" onBack={() => router.push("/create")} />
        </div>
        <div className="flex flex-col gap-[12px] p-[16px]">
          <Skeleton variant="row" className="h-[80px] rounded-card" />
          <Skeleton variant="row" className="h-[80px] rounded-card" />
        </div>
      </FlowPane>
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

  // A resubmitted piece already owns whichever slot it was published into, so
  // it must not be counted against the creator a second time.
  const allowance = PLANS[gates.tier ?? "basic"].freeSlots;
  const alreadyMine = resubmitItem && resubmitItem.price === 0 ? 1 : 0;
  const noChargeSlotsLeft = Math.max(0, allowance - noChargeUsed + alreadyMine);

  return (
    <PublishingWizard
      type={type}
      firstUpload={firstUpload}
      noChargeSlotsLeft={noChargeSlotsLeft}
      resubmit={resubmitItem ? { id: resubmitItem.id, title: resubmitItem.title } : undefined}
    />
  );
}
