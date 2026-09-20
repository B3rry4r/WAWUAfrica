"use client";

import { creatorGates } from "@/lib/auth/gates";
import { useCreatorState } from "@/lib/auth/use-creator-state";
import { FlowHeader } from "@/components/layout/FlowHeader";
import { BackLink } from "@/components/ui/BackLink";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";
import { CreatorSetupChecklist } from "./CreatorSetupChecklist";

/**
 * /creator/setup — the flow that did not exist between "payment confirmed" and
 * "here is a dashboard, good luck".
 *
 * It is a destination, not a wizard: no step order is enforced, nothing is
 * blocked behind it, and it can be closed and reopened for as long as the
 * creator wants. The checklist itself reads live state, so returning to it is
 * always accurate (see useCreatorSetup).
 */
export function CreatorSetup() {
  const { creator, resolved } = useCreatorState();
  // accountType is deliberately not part of this — see creatorGates().
  const gates = creatorGates({ creator });

  if (!resolved) {
    return (
      <Column>
        <FlowHeader title="Set up your account" />
        <div className="flex flex-col gap-[12px] p-[16px]">
          <Skeleton variant="row" className="h-[86px]" />
          <Skeleton variant="row" className="h-[64px]" />
          <Skeleton variant="row" className="h-[64px]" />
        </div>
      </Column>
    );
  }

  if (!gates.isCreator) {
    return (
      <Column>
        <FlowHeader title="Set up your account" />
        <EmptyState
          icon="Sparkles"
          title="This is the creator setup"
          caption="It appears once you have a creator account. User accounts can buy, save, join communities and message creators without one."
          action="Set up a creator account"
          actionHref="/onboarding"
        />
      </Column>
    );
  }

  return (
    <Column>
      <div className="xl:hidden">
        <FlowHeader title="Set up your account" />
      </div>

      <div className="flex flex-col gap-[18px] px-[18px] pb-[36px] pt-[18px] xl:px-[26px] xl:pt-[26px]">
        {/* Desktop has no bottom bar and /creator/* suppresses the global
            header, so without this the page is a dead end unless you use the
            browser's own back button — same treatment as the dashboard. */}
        <div className="hidden xl:flex xl:items-center xl:gap-[12px]">
          <BackLink label="" className="!h-9 !w-9 !justify-center !px-0" />
          <span className="text-[22px] font-bold tracking-[-0.02em] text-text-primary">Set up your account</span>
        </div>

        <div className="flex flex-col gap-[10px]">
          <h2 className="m-0 text-[22px] font-bold leading-[1.2] tracking-[-0.03em] text-text-primary xl:hidden">
            Five things, none of them urgent
          </h2>
          <p className="m-0 text-[13.5px] leading-[1.5] text-text-secondary">
            Uploading is already open to you, and it costs nothing. The rest is what turns an empty creator account
            into one people can find, pay and talk to. Do them in any order, stop whenever, come back whenever.
          </p>
        </div>

        <CreatorSetupChecklist />

        {/* Restated where somebody who skipped the onboarding screen will
            still meet it. Never a wall — see CreatorSetupChecklist. */}
        <div className="flex flex-col gap-[13px] rounded-card border border-hairline bg-card p-[16px]">
          <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-text-muted">Two separate things</span>
          <div className="flex gap-[12px]">
            <span className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-[10px] border border-[rgba(184,232,62,0.28)] bg-[var(--success-tint)]">
              <Icon name="Check" size={16} strokeWidth={2.6} color="var(--success)" />
            </span>
            <span className="flex-1 text-[13.5px] leading-[1.45] text-text-secondary">
              <span className="font-semibold text-text-primary">Uploading is open.</span> It costs nothing and there is
              no plan to buy. Publish, price and sell from today.
            </span>
          </div>
          <div className="flex gap-[12px]">
            <span className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-[10px] bg-accent">
              <Icon name="ShieldAlert" size={16} strokeWidth={2.4} color="var(--text-on-accent)" />
            </span>
            <span className="flex-1 text-[13.5px] leading-[1.45] text-text-secondary">
              <span className="font-semibold text-text-primary">Getting paid is separate.</span> That is verification.
              Until it clears, what you earn is counted and held for you. Nothing is lost, and nothing else is affected.
            </span>
          </div>
        </div>

        <Button full size="lg" variant="secondary" href="/creator" iconRight="ArrowRight">
          Go to your dashboard
        </Button>
      </div>
    </Column>
  );
}

function Column({ children }: { children: React.ReactNode }) {
  return <div className="m-0 flex min-h-[100vh] max-w-[var(--mobile-column)] flex-col xl:max-w-[860px]">{children}</div>;
}
