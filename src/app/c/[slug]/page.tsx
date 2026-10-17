import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OpenInApp } from "@/components/open-in-app/OpenInApp";
import { appAddressFor, roomSlugFrom } from "@/lib/app-links";

/**
 * wawuafrica.com/c/<slug>: a community room, as the Hub issues its link
 * (LINKS-01). An app link like /r/<code>: the app opens the room when it is
 * installed, and this page is what everyone else sees. It reads nothing from
 * the Hub: the slug is only passed on to the app's own address.
 */
export const metadata: Metadata = {
  title: { absolute: "Open in the WAWU app" },
  robots: { index: false, follow: false },
};

export default function RoomLinkPage({ params }: { params: { slug: string } }) {
  const slug = roomSlugFrom(`/c/${params.slug}`);
  if (!slug) notFound();
  return (
    <OpenInApp
      message="Tap the button on a phone that has the WAWU app to open this community."
      appAddress={appAddressFor(`/c/${slug}`)}
    />
  );
}
