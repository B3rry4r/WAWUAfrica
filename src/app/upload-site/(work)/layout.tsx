import type { ReactNode } from "react";
import { SiteWorkFrame } from "@/components/site-upload/SiteUploadShell";

export default function UploadSiteWorkLayout({ children }: { children: ReactNode }) {
  return <SiteWorkFrame>{children}</SiteWorkFrame>;
}
