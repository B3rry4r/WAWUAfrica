import { pageMetadata } from "@/app/(site)/_lib/page-metadata";
import { LegalDocument } from "@/components/legal/LegalDocument";
import { ACCEPTANCE, IMPORTANT_NOTICE, MASTER_SECTIONS } from "@/lib/legal/master-agreement";

export const metadata = pageMetadata({
  title: "Master terms, privacy and platform policy · WAWUAfrica",
  description: "The terms of use, privacy provisions and platform policy for WAWU and Who Made This, in one document.",
  path: "/terms",
});

/**
 * The Master Terms, Privacy and Platform Policy: ONE document covering both
 * the terms and the privacy provisions (product owner, 4 Sep 2026). There is
 * no separate privacy page; /privacy/policy redirects into the privacy
 * sections here, so the two can never say different things.
 *
 * This page used to carry a summary that described itself as a placeholder,
 * on the document a user is required to accept before an account is created.
 */
export default function TermsPage() {
  return (
    <LegalDocument
      title="Master terms, privacy and platform policy"
      sections={MASTER_SECTIONS}
      notice={IMPORTANT_NOTICE}
      acceptance={ACCEPTANCE}
    />
  );
}
