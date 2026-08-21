"use client";

import { ContentLibrary } from "@/components/create/ContentLibrary";
import { useSession } from "@/lib/auth/session-provider";
import { useCreatorState } from "@/lib/auth/use-creator-state";
import { creatorGates } from "@/lib/auth/gates";
import { BackLink, EmptyState, Skeleton } from "@/components/ui";

/**
 * Gate/loading states, with a way out and a real width on desktop instead of
 * a stretched mobile column.
 *
 * The back control is a BackLink rather than a FlowHeader: this route is not
 * listed in AppHeader.OWN_HEADER_ROUTES, so a FlowHeader stacked a second
 * header bar directly under the global one at every width.
 */
function GatePane({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col">
      <div className="px-[16px] pt-[16px] dt:mx-auto dt:w-full dt:max-w-[1120px] dt:px-[26px] dt:pt-[26px]">
        <BackLink label="Back to Create" />
      </div>
      <div className="flex flex-col dt:min-h-[50vh] dt:items-center dt:justify-center dt:p-[48px]">
        <div className="w-full dt:max-w-[460px]">{children}</div>
      </div>
    </div>
  );
}

export default function LibraryPage() {
  const { user } = useSession();
  const { creator, resolved } = useCreatorState();
  const gates = creatorGates(user ? { accountType: user.accountType, creator } : { creator });

  // `resolved`, not `hydrated` — the sign-in-time snapshot is stale for anyone
  // who became a creator after signing in, and branching on it showed them the
  // "not a creator" wall first. Same fix as /create and /create/new.
  if (!resolved) {
    return (
      <GatePane>
        <div className="flex flex-col gap-[12px] p-[16px] dt:p-0">
          <Skeleton variant="row" className="h-[100px] rounded-card" />
          <Skeleton variant="row" className="h-[100px] rounded-card" />
        </div>
      </GatePane>
    );
  }

  if (!gates.isCreator) {
    return (
      <GatePane>
        <EmptyState
          icon="Sparkles"
          title="No content library yet"
          caption="Content libraries are for creator accounts. Switch to a creator account to start publishing."
          action="Set up a creator account"
          actionHref="/onboarding"
        />
      </GatePane>
    );
  }

  if (!gates.canUpload) {
    return (
      <GatePane>
        <EmptyState
          icon="CreditCard"
          title="Subscribe to unlock uploading"
          caption="A paid creator subscription unlocks publishing and your content library. KYC is separate and only gates payouts."
          action="Choose a plan"
          actionHref="/subscription"
        />
      </GatePane>
    );
  }

  return <ContentLibrary />;
}
