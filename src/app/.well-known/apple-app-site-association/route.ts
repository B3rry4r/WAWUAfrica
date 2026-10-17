import { appleAppSiteAssociation } from "@/lib/app-links";

/**
 * /.well-known/apple-app-site-association (LINKS-01): the file iOS reads to
 * learn that the WAWU app opens /r/<code> and /selfie, and nothing else.
 *
 * Served as JSON, with no redirect and no file extension, as Apple requires.
 * The Apple team id is a setting (APPLE_TEAM_ID) read on every request; until
 * it is set the file names no app. Never typed in the code.
 */
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json(appleAppSiteAssociation({ APPLE_TEAM_ID: process.env["APPLE_TEAM_ID"] }), {
    headers: { "Cache-Control": "public, max-age=300" },
  });
}
