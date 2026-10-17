import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OpenInApp } from "@/components/open-in-app/OpenInApp";
import { appAddressFor, receiptCheckAddress, receiptCodeFrom } from "@/lib/app-links";

/**
 * wawuafrica.com/receipt/<code>: a receipt's check address (LINKS-01). A receipt
 * has its own path on purpose: /r/<code> is the invite path, and an invite claim
 * must never be handed a receipt code. An app link like /r/<code>: the app opens
 * when it is installed, and this page is what everyone else sees. It reads
 * nothing from the Hub: the code is only passed on to the app's own address
 * and to the Hub's public check page (GET {NEXT_PUBLIC_API_BASE_URL}/api/hub/r/<code>),
 * the "Check this receipt" button beside the app button. With no API origin
 * set, that button is not drawn.
 */
export const metadata: Metadata = {
  title: { absolute: "Open in the WAWU app" },
  robots: { index: false, follow: false },
};

export default function ReceiptPage({ params }: { params: { code: string } }) {
  const code = receiptCodeFrom(`/receipt/${params.code}`);
  if (!code) notFound();
  const check = receiptCheckAddress(process.env.NEXT_PUBLIC_API_BASE_URL, code);
  return (
    <OpenInApp
      message={
        check
          ? "This is a WAWU receipt. Open the app to see your wallet activity, or check that the receipt is real."
          : "This is a WAWU receipt. Tap the button on a phone that has the WAWU app to see your wallet activity."
      }
      appAddress={appAddressFor(`/receipt/${code}`)}
      secondLink={check ? { label: "Check this receipt", href: check } : undefined}
    />
  );
}
