"use client";

import type { ReactNode } from "react";
import { EmptyState, Skeleton } from "@/components/ui";
import { useSession } from "@/lib/auth/session-provider";
import { useCreatorState } from "@/lib/auth/use-creator-state";
import { creatorGates } from "@/lib/auth/gates";
import type { VerificationState } from "@/types/verification";

/**
 * The one creator gate both Create screens sit behind.
 *
 * `/create` (the hub) and `/create/content` (the format picker) need exactly
 * the same guard, the same loading skeleton and the same slot figures. This
 * holds them once and hands the resolved numbers to its child, so the second
 * screen cannot drift into a different answer about who may publish - which
 * is what the `forks` gate exists to catch.
 */
function CenteredPane({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col dt:min-h-[60vh] dt:items-center dt:justify-center dt:p-[48px]">
      <div className="w-full dt:max-w-[460px]">{children}</div>
    </div>
  );
}

export interface CreateGateChildProps {
  slotsUsed: number;
  slotsTotal: number;
  verification: VerificationState | null | undefined;
}

export function CreateGate({ children }: { children: (props: CreateGateChildProps) => ReactNode }) {
  const { user } = useSession();
  const { creator, resolved } = useCreatorState();
  const gates = creatorGates(user ? { accountType: user.accountType, creator } : { creator });

  // `resolved`, not `hydrated`. The session's creator snapshot is written once
  // at sign-in and never revisited, so branching before the live
  // GET /creator/state lands showed an established creator the "you need a
  // creator account" wall on first paint. useCreatorState's own doc comment
  // says a screen forking on creator-vs-user must wait for this flag and must
  // not fall back to the user branch.
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

  // The one gate on these screens: making something needs a creator account.
  // A user account has no `creator` record at all, so send them to set one up
  // rather than letting them fall through to a hub with nothing behind it.
  if (!gates.isCreator) {
    return (
      <CenteredPane>
        <EmptyState
          icon="Sparkles"
          title="Creating needs a creator account"
          caption="User accounts can buy, save and message. Switch to a creator account to publish content, host events, run a community or list a service."
          action="Set up a creator account"
          actionHref="/onboarding"
        />
      </CenteredPane>
    );
  }

  // There is no second gate. Uploading used to need a paid subscription on
  // top of a creator account; subscriptions are gone and listing is free. KYC
  // remains a separate, independent gate on EARNING, never on creating, so a
  // creator who is KYC-pending (gates.awaitingKyc) passes through here
  // normally. Hosting an event needs a verified tick, and that is enforced at
  // /events/new by HostEventGate plus the server, not here: gating the whole
  // Create screen on it would hide the three things an unverified creator can
  // still do.
  return <>{children({ slotsUsed: gates.slotsUsed, slotsTotal: gates.slotsTotal, verification: user?.verification })}</>;
}
