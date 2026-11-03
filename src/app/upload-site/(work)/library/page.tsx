"use client";

import { MyUploads } from "@/components/site-upload/MyUploads";
import { AccessError, NotCreatorPanel } from "@/components/site-upload/AccessPanels";
import { useUploadAccess } from "@/components/site-upload/UploadAccess";

/** My uploads: every piece and where it stands. */
export default function UploadSiteLibraryPage() {
  const { access, reload } = useUploadAccess();
  if (access.phase === "error") return <AccessError message={access.message} onRetry={reload} />;
  if (access.phase === "not-creator") return <NotCreatorPanel onDone={reload} />;
  return <MyUploads />;
}
