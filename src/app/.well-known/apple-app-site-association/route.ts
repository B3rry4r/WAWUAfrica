import { appLinkJsonResponse, appleAppSiteAssociation } from "@/lib/app-links";

// iOS reads this (no file extension, still JSON) to decide which links to this
// site open the WAWU app (src/lib/app-links.ts). A plain 200 with no redirect,
// in every site mode.
export const dynamic = "force-static";

export function GET() {
  return appLinkJsonResponse(appleAppSiteAssociation());
}
