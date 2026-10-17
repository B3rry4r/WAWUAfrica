import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OpenInApp } from "@/components/open-in-app/OpenInApp";
import { appAddressFor, receiptCodeFrom } from "@/lib/app-links";

/**
 * wawuafrica.com/receipt/<code>: a receipt's check address (LINKS-01). A receipt
 * has its own path on purpose: /r/<code> is the invite path, and an invite claim
 * must never be handed a receipt code. An app link like /r/<code>: the app opens
 * when it is installed, and this page is what everyone else sees. It reads
 * nothing from the Hub: the code is only passed on to the app's own address.
 */
export const metadata: Metadata = {
  title: { absolute: "Open in the WAWU app" },
  robots: { index: false, follow: false },
};

export default function ReceiptPage({ params }: { params: { code: string } }) {
  const code = receiptCodeFrom(`/receipt/${params.code}`);
  if (!code) notFound();
  return (
    <OpenInApp
      message="This is a WAWU receipt. Tap the button on a phone that has the WAWU app to see your wallet activity."
      appAddress={appAddressFor(`/receipt/${code}`)}
    />
  );
}
