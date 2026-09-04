import { redirect } from "next/navigation";
import { PRIVACY_ANCHOR } from "@/lib/legal/master-agreement";

/**
 * ONE DOCUMENT, NOT TWO.
 *
 * The terms and the privacy policy are a single Master Terms, Privacy and
 * Platform Policy (product owner, 4 Sep 2026), so this no longer renders a
 * separate privacy page that could drift from the agreement it is part of.
 * Every existing link to /privacy/policy still works; it lands on the privacy
 * provisions inside the one document.
 */
export default function PrivacyPolicyPage() {
  redirect(`/terms#${PRIVACY_ANCHOR}`);
}
