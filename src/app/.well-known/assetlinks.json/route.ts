import { appLinkJsonResponse, assetLinks } from "@/lib/app-links";

// Android reads this to decide whether the WAWU app may open links to this site
// (src/lib/app-links.ts). A plain 200 with no redirect, in every site mode.
export const dynamic = "force-static";

export function GET() {
  return appLinkJsonResponse(assetLinks());
}
