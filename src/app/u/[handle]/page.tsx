import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OpenInApp } from "@/components/open-in-app/OpenInApp";
import { appAddressFor, profileHandleFrom } from "@/lib/app-links";

/**
 * wawuafrica.com/u/<handle>: a profile, as the app's Share sends it (LINKS-01).
 * An app link like /r/<code>: the app opens the person when it is installed,
 * and this page is what everyone else sees. It reads nothing from the Hub and
 * shows no profile: the handle is only passed on to the app's own address.
 * (The website's own profile page, /wawu/<handle>, is a different path and is
 * not touched.)
 */
export const metadata: Metadata = {
  title: { absolute: "Open in the WAWU app" },
  robots: { index: false, follow: false },
};

export default function ProfileLinkPage({ params }: { params: { handle: string } }) {
  const handle = profileHandleFrom(`/u/${params.handle}`);
  if (!handle) notFound();
  return (
    <OpenInApp
      message="Tap the button on a phone that has the WAWU app to see this profile."
      appAddress={appAddressFor(`/u/${handle}`)}
    />
  );
}
