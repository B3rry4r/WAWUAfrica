import { assetLinks } from "@/lib/app-links";

/**
 * /.well-known/assetlinks.json (LINKS-01): the file Android reads to check that
 * the WAWU app may open links on this website. Android takes the list of paths
 * from the app's own intent filters, so the paths are not repeated here.
 *
 * The signing certificate fingerprint(s) are a setting
 * (ANDROID_SHA256_CERT_FINGERPRINTS, comma separated) read on every request;
 * until it is set the file names no app. Never typed in the code.
 */
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json(assetLinks({ ANDROID_SHA256_CERT_FINGERPRINTS: process.env["ANDROID_SHA256_CERT_FINGERPRINTS"] }), {
    headers: { "Cache-Control": "public, max-age=300" },
  });
}
