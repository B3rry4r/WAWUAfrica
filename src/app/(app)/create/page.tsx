"use client";

import { CreateHub } from "@/components/create/CreateHub";
import { PLANS } from "@/types/subscription";
import { useSession } from "@/lib/auth/session-provider";
import { useCreatorState } from "@/lib/auth/use-creator-state";
import { creatorGates } from "@/lib/auth/gates";
import { EmptyState, Skeleton } from "@/components/ui";

/** Gate/loading states get a real width on desktop instead of a stretched column. */
function CenteredPane({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col dt:min-h-[60vh] dt:items-center dt:justify-center dt:p-[48px]">
      <div className="w-full dt:max-w-[460px]">{children}</div>
    </div>
  );
}

export default function CreatePage() {
  const { user } = useSession();
  const { creator, resolved } = useCreatorState();
  const gates = creatorGates(user ? { accountType: user.accountType, creator } : { creator });

  // `resolved`, not `hydrated`. The session's creator snapshot is written once
  // at sign-in and never revisited, so branching before the live
  // GET /creator/state lands showed a paid-up creator the "you need a creator
  // account" wall on first paint — see useCreatorState's doc comment, which
  // says in as many words that a screen forking on creator-vs-user must wait
  // for this flag and must not fall back to the user branch.
  if (!resolved) {
    return (
      <CenteredPane>
        <div className="flex flex-col gap-[12px] p-[16px] dt:p-0">
          <Skeleton variant="row" className="h-[28px] w-[60%]" />
          <Skeleton variant="row" className="h-[80px]" />
          <Skeleton variant="row" className="h-[80px]" />
        </div>
      </CenteredPane>
    );
  }

  // Gate 1 of 2: uploading is only reachable from a creator account. A user
  // account has no `creator` record at all — send them to set one up rather
  // than letting them fall through to a picker that has nothing to publish.
  if (!gates.isCreator) {
    return (
      <CenteredPane>
        <EmptyState
          icon="Sparkles"
          title="Uploading needs a creator account"
          caption="User accounts can buy, save and message. Switch to a creator account to publish videos, courses, PDFs and more."
          action="Set up a creator account"
          actionHref="/onboarding"
        />
      </CenteredPane>
    );
  }

  // Gate 2 of 2: a creator account still needs a paid subscription to upload.
  // KYC is a separate, independent gate on earning, not on uploading — a
  // creator who is subscribed but KYC-pending (gates.awaitingKyc) reaches
  // CreateHub normally below.
  if (!gates.canUpload) {
    return (
      <CenteredPane>
        <EmptyState
          icon="CreditCard"
          title="Subscribe to unlock uploading"
          caption="A paid creator subscription unlocks publishing. KYC is separate and only gates payouts. You can start that anytime after."
          action="Choose a plan"
          actionHref="/subscription"
        />
      </CenteredPane>
    );
  }

  const tier = creator?.tier ?? "basic";
  const plan = PLANS[tier];

  return (
    <CreateHub
      slotsUsed={creator?.slotsUsed ?? 0}
      slotsTotal={creator?.slotsTotal ?? plan.slots}
      tier={tier}
      proPrice={PLANS.pro.price}
      proSlots={PLANS.pro.slots}
    />
  );
}
