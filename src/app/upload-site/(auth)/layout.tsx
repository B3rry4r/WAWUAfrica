import type { ReactNode } from "react";
import { SiteAuthFrame } from "@/components/site-upload/SiteUploadShell";

export default function UploadSiteAuthLayout({ children }: { children: ReactNode }) {
  return <SiteAuthFrame>{children}</SiteAuthFrame>;
}
