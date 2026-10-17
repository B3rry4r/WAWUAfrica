import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OpenInApp } from "@/components/open-in-app/OpenInApp";
import { appAddressFor, contentIdFrom } from "@/lib/app-links";

/**
 * The fallback page for wawuafrica.com/content/<id>: a piece of content, as
 * the app's Share sends it (FIX-60). An app link like /u/<handle>: the app
 * opens the piece when it is installed, and this page is what everyone else
 * sees. It reads nothing from the Hub and shows no content: the id is only
 * passed on to the app's own address.
 *
 * It lives under /app-link, not on /content, because the full site already has
 * a page on /content/<id> ((app)/content/[id]). In join-only mode the
 * middleware rewrites /content/<id> here; in full mode it does not, so the full
 * site keeps its own page. Asked for directly, this path is closed in
 * join-only mode like any other page.
 */
export const metadata: Metadata = {
  title: { absolute: "Open in the WAWU app" },
  robots: { index: false, follow: false },
};

export default function ContentLinkPage({ params }: { params: { id: string } }) {
  const id = contentIdFrom(`/content/${params.id}`);
  if (!id) notFound();
  return (
    <OpenInApp
      message="Tap the button on a phone that has the WAWU app to see this content."
      appAddress={appAddressFor(`/content/${id}`)}
    />
  );
}
