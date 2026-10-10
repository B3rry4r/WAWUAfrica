import type { Metadata } from "next";
import { JoinFlow } from "../components/JoinFlow";

/**
 * Where Flutterwave sends the browser back to when a payment left /join (a
 * bank app, a 3-D Secure page). The page that opened the payment window is
 * gone by then, so this one picks the registration up from the reference in
 * the address and finishes the server check. See JoinFlow.
 */
export const metadata: Metadata = {
  title: { absolute: "WHO MADE THIS? Pre-registration" },
  robots: { index: false, follow: false },
};

export default function JoinPaidPage() {
  return <JoinFlow mode="return" />;
}
