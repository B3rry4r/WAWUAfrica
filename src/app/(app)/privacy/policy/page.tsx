import { LegalDocument } from "@/components/legal/LegalDocument";
import { PRIVACY_SECTIONS } from "@/lib/legal/master-agreement";

export const metadata = {
  title: "Privacy policy · WAWUAfrica",
};

/**
 * The privacy and data sections of the master agreement, with their own
 * numbering kept so a reader can line them up against the full document at
 * /terms. Same source, so the two pages cannot drift.
 */
export default function PrivacyPolicyPage() {
  return (
    <LegalDocument
      title="Privacy policy"
      sections={PRIVACY_SECTIONS}
      intro="These are the privacy and data provisions of the WAWUAfrica Master Terms, Privacy and Platform Policy. The numbering follows that document, which you can read in full under Terms of service."
    />
  );
}
