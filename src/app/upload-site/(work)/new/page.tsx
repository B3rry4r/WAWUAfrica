"use client";

import { UploadWizard } from "@/components/site-upload/UploadWizard";
import { AccessError, NoTierPanel, NotCreatorPanel, PlacesFullPanel } from "@/components/site-upload/AccessPanels";
import { useUploadAccess } from "@/components/site-upload/UploadAccess";
import { Skeleton } from "@/components/ui";

/** Upload: the wizard when the person has a place free, and a plain sentence when they do not. */
export default function UploadSiteNewPage() {
  const { access, reload } = useUploadAccess();
  if (access.phase === "loading") {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton variant="row" className="h-[40px] w-[60%] rounded-card" />
        <Skeleton variant="row" className="h-[260px] rounded-card" />
      </div>
    );
  }
  if (access.phase === "error") return <AccessError message={access.message} onRetry={reload} />;
  if (access.phase === "not-creator") return <NotCreatorPanel onDone={reload} />;
  if (access.state === "no-tier") return <NoTierPanel />;
  if (access.state === "full") return <PlacesFullPanel />;
  return <UploadWizard />;
}
