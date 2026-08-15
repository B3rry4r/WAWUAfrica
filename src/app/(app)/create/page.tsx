import { CreateHub } from "@/components/create/CreateHub";
import { PLANS } from "@/types/subscription";
import { currentSession } from "@/lib/api/mocks/session";
import { creatorGates } from "@/lib/auth/gates";
import { FlowHeader } from "@/components/layout/FlowHeader";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata = {
  title: "Create · WAWUAfrica",
};

export default function CreatePage() {
  const gates = creatorGates(currentSession);

  // Gate 1 of 2: uploading is only reachable from a creator account. A user
  // account has no `creator` record at all — send them to set one up rather
  // than letting them fall through to a picker that has nothing to publish.
  if (!gates.isCreator) {
    return (
      <div className="flex flex-col min-h-[100%]">
        <FlowHeader title="Create" />
        <EmptyState
          icon="Sparkles"
          title="Uploading needs a creator account"
          caption="User accounts can buy, save and message. Switch to a creator account to publish videos, courses, PDFs and more."
          action="Set up a creator account"
          actionHref="/onboarding"
        />
      </div>
    );
  }

  // Gate 2 of 2: a creator account still needs a paid subscription to upload.
  // KYC is a separate, independent gate on earning, not on uploading — a
  // creator who is subscribed but KYC-pending (gates.awaitingKyc) reaches
  // CreateHub normally below.
  if (!gates.canUpload) {
    return (
      <div className="flex flex-col min-h-[100%]">
        <FlowHeader title="Create" />
        <EmptyState
          icon="CreditCard"
          title="Subscribe to unlock uploading"
          caption="A paid creator subscription unlocks publishing. KYC is separate and only gates payouts — you can start that anytime after."
          action="Choose a plan"
          actionHref="/subscription"
        />
      </div>
    );
  }

  const creator = currentSession.creator;
  const tier = creator?.tier ?? "basic";
  const plan = PLANS[tier];
  const slotsTotal = creator?.slotsTotal ?? plan.slots;
  const slotsUsed = creator?.slotsUsed ?? 0;

  return (
    <CreateHub
      slotsUsed={slotsUsed}
      slotsTotal={slotsTotal}
      slotFree={slotsUsed < slotsTotal}
      tier={tier}
      proPrice={PLANS.pro.price}
      proSlots={PLANS.pro.slots}
    />
  );
}
