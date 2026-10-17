import type { Metadata } from "next";
import { OpenInApp } from "@/components/open-in-app/OpenInApp";
import { SELFIE_PATH, appAddressFor } from "@/lib/app-links";

/**
 * wawuafrica.com/selfie: where the hosted selfie page sends a person back to
 * (LINKS-01). It is its own path on purpose: /join stays the registration
 * campaign. An app link like /r/<code>: the app opens it when it is installed,
 * and this page is what everyone else sees. The result of the selfie is not in
 * the address; the app reads it from the Hub.
 */
export const metadata: Metadata = {
  title: { absolute: "Open in the WAWU app" },
  robots: { index: false, follow: false },
};

export default function SelfieReturnPage() {
  return (
    <OpenInApp
      message="Your selfie step is finished on this page. Go back to the WAWU app to carry on with your wallet."
      appAddress={appAddressFor(SELFIE_PATH)}
    />
  );
}
