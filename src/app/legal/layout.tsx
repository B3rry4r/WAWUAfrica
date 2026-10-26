import type { ReactNode } from "react";
import { PublicLegalShell } from "@/components/legal/PublicLegalShell";

/**
 * /legal and /legal/<slug>: the nine legal documents, public and signed out.
 * The app stores ask for a public privacy policy address that is not behind a
 * sign-in or a country gate; /legal/privacy is it.
 */
export default function LegalLayout({ children }: { children: ReactNode }) {
  return <PublicLegalShell>{children}</PublicLegalShell>;
}
