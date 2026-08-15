import { ContentLibrary } from "@/components/create/ContentLibrary";
import { currentSession } from "@/lib/api/mocks/session";
import { creatorGates } from "@/lib/auth/gates";
import { FlowHeader } from "@/components/layout/FlowHeader";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata = {
  title: "My content · WAWUAfrica",
};

export default function LibraryPage() {
  const gates = creatorGates(currentSession);

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
