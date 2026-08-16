"use client";

import { ContentLibrary } from "@/components/create/ContentLibrary";
import { useSession } from "@/lib/auth/session-provider";
import { useCreatorState } from "@/lib/auth/use-creator-state";
import { creatorGates } from "@/lib/auth/gates";
import { FlowHeader } from "@/components/layout/FlowHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Feedback";

export default function LibraryPage() {
  const { user, hydrated } = useSession();
  const { creator, loading } = useCreatorState();
  const gates = creatorGates(user ? { accountType: user.accountType, creator } : null);

  // Real session hasn't hydrated from localStorage yet (SSR / first paint) —
  // hold off on any gate decision until we actually know who is signed in,
  // same pattern as /create and /create/new.
  if (!hydrated || (loading && !creator && user?.accountType === "creator")) {
    return (
      <div className="flex flex-col min-h-[100%]">
        <FlowHeader title="My content" />
        <div className="flex flex-col gap-[12px] p-[16px]">
          <Skeleton height={100} radius="var(--radius-card)" />
          <Skeleton height={100} radius="var(--radius-card)" />
        </div>
      </div>
    );
  }

  if (!gates.isCreator) {
    return (
      <div className="flex flex-col min-h-[100%]">
        <FlowHeader title="My content" />
        <EmptyState
          icon="Sparkles"
          title="No content library yet"
          caption="Content libraries are for creator accounts. Switch to a creator account to start publishing."
          action="Set up a creator account"
          actionHref="/onboarding"
        />
      </div>
    );
  }

  if (!gates.canUpload) {
    return (
      <div className="flex flex-col min-h-[100%]">
        <FlowHeader title="My content" />
        <EmptyState
          icon="CreditCard"
          title="Subscribe to unlock uploading"
          caption="A paid creator subscription unlocks publishing and your content library. KYC is separate and only gates payouts."
          action="Choose a plan"
          actionHref="/subscription"
        />
      </div>
    );
  }

  return <ContentLibrary />;
}
