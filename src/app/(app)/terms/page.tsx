import { LegalDocument } from "@/components/legal/LegalDocument";
import {
  ACCEPTANCE,
  IMPORTANT_NOTICE,
  MASTER_SECTIONS,
} from "@/lib/legal/master-agreement";

export const metadata = {
  title: "Terms of service · WAWUAfrica",
};

/**
 * The full Master Terms, Privacy and Platform Policy. This page used to carry
 * a summary that described itself as a placeholder, on the document a user is
 * required to accept before an account is created.
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
