import { CONTENT_TYPES, type ContentType } from "@/types/content";
import { libraryItems } from "@/lib/api/creator-content";
import { PublishingWizard } from "@/components/create/PublishingWizard";
import { currentSession } from "@/lib/api/mocks/session";
import { creatorGates } from "@/lib/auth/gates";
import { FlowHeader } from "@/components/layout/FlowHeader";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata = {
  title: "New content · WAWUAfrica",
};

interface Props {
  searchParams: { type?: string; first?: string; resubmit?: string };
}

export default function NewContentPage({ searchParams }: Props) {
  const gates = creatorGates(currentSession);

  // This route is a direct URL, not just a button behind CreateHub — it needs
  // the same two gates CreateHub enforces, or it's a bypass of "paid
  // subscription unlocks uploading". KYC status never factors in here.
  if (!gates.isCreator) {
    return (
      <div className="flex flex-col min-h-[100vh] max-w-[var(--mobile-column)] m-0">
        <FlowHeader title="Upload" />
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

  if (!gates.canUpload) {
    return (
      <div className="flex flex-col min-h-[100vh] max-w-[var(--mobile-column)] m-0">
        <FlowHeader title="Upload" />
        <EmptyState
          icon="CreditCard"
          title="Subscribe to unlock uploading"
          caption="A paid creator subscription unlocks publishing. KYC is separate and only gates payouts."
          action="Choose a plan"
          actionHref="/subscription"
        />
      </div>
    );
  }

  const resubmitItem = searchParams.resubmit
    ? libraryItems.find((i) => i.id === searchParams.resubmit)
    : undefined;

  const type: ContentType = resubmitItem
    ? resubmitItem.type
    : CONTENT_TYPES.includes(searchParams.type as ContentType)
      ? (searchParams.type as ContentType)
      : "video";

  const hasPublished = libraryItems.some((i) => i.status === "live");
  const firstUpload = resubmitItem ? !!resubmitItem.isFirstUpload : searchParams.first === "1" ? true : !hasPublished;

  return (
    <PublishingWizard
      type={type}
      firstUpload={firstUpload}
      resubmit={resubmitItem ? { id: resubmitItem.id, title: resubmitItem.title } : undefined}
    />
  );
}
