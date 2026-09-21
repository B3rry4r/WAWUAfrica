"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CONTENT_TYPES, type ContentType } from "@/types/content";
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
  // Nothing else is read from the library here any more. This route used to
  // load it to work out whether this was the creator's first upload and how
  // many ₦0 pieces their plan still allowed. Both concepts are gone: every
  // listing carries a price, and the only cap is MAX_ITEMS_PER_ACCOUNT, which
  // the server enforces.

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

  // No gate decision until the SERVER has answered whether this account is a
  // creator (`resolved` covers session hydration too).
  if (!resolved) {
    return (
      <FlowPane>
        <div className="dt:hidden">
          <FlowHeader title="Upload" onBack={() => router.push("/create/content")} />
        </div>
        <div className="flex flex-col gap-[12px] p-[16px]">
          <Skeleton variant="row" className="h-[80px] rounded-card" />
          <Skeleton variant="row" className="h-[80px] rounded-card" />
        </div>
      </FlowPane>
    );
  }

  // This route is a direct URL, not just a button behind CreateHub — it needs
  // the same gate CreateHub enforces. There is only one now: uploading is
  // free, so a creator account is the whole of it. KYC never factors in here.
  if (!gates.isCreator) {
    return (
      <FlowPane>
        <div className="dt:hidden">
          <FlowHeader title="Upload" onBack={() => router.push("/create/content")} />
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

  // Waiting on the resubmit item to load.
  if (resubmitItem === undefined) {
    return (
      <FlowPane>
        <div className="dt:hidden">
          <FlowHeader title="Upload" onBack={() => router.push("/create/content")} />
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

  // A resubmitted piece already owns the slot it was published into, so the
  // wizard is told it is a resubmission and does not count it against the cap
  // a second time.
  return (
    <PublishingWizard
      type={type}
      resubmit={resubmitItem ? { id: resubmitItem.id, title: resubmitItem.title } : undefined}
    />
  );
}
