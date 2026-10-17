import type { Metadata } from "next";
import { OpenInApp } from "@/components/open-in-app/OpenInApp";
import { ACTIVATE_PATH, appAddressFor } from "@/lib/app-links";

/**
 * wawuafrica.com/activate: where the "Set My Password" button in the activation
 * email lands (LINKS-01). wawu-id writes FRONTEND_URL/activate?token&email for an
 * account an admin set up, and this website never had that page. It is now an
 * app link like /r/<code>: the app opens sign-in when it is installed, and this
 * page is what everyone else sees. The token and the email in the address are
 * not read and not passed on: nothing in the app uses them.
 */
export const metadata: Metadata = {
  title: { absolute: "Open in the WAWU app" },
  robots: { index: false, follow: false },
};

export default function ActivatePage() {
  return (
    <OpenInApp
      message="Your WAWU account is ready. Open the WAWU app and sign in to carry on."
      appAddress={appAddressFor(ACTIVATE_PATH)}
    />
  );
}
