import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OpenInApp } from "@/components/open-in-app/OpenInApp";
import { appAddressFor, inviteCodeFrom } from "@/lib/app-links";

/**
 * wawuafrica.com/r/<code>: an invite, as a person shares it (LINKS-01).
 *
 * This is an app link. On a phone with the WAWU app the link opens the app,
 * which keeps the code and claims it after sign-in; this page is what everyone
 * else sees. It claims nothing and reads nothing from the Hub: the code is only
 * passed on to the app's own address. It is not the registration campaign
 * (/join), which this page never touches.
 */
export const metadata: Metadata = {
  title: { absolute: "Open in the WAWU app" },
  robots: { index: false, follow: false },
};

export default function InvitePage({ params }: { params: { code: string } }) {
  const code = inviteCodeFrom(`/r/${params.code}`);
  if (!code) notFound();
  return (
    <OpenInApp
      message="Tap the button on a phone that has the WAWU app to accept your invite."
      appAddress={appAddressFor(`/r/${code}`)}
    />
  );
}
