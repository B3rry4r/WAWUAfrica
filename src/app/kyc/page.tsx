import { currentSession } from "@/lib/api/mocks/session";
import { creatorGates } from "@/lib/auth/gates";
import { KycFlow } from "@/components/kyc/KycFlow";

export const metadata = {
  title: "Verify your identity · WAWUAfrica",
};

export default function KycPage() {
  const { kycStatus } = creatorGates(currentSession);
  return <KycFlow initialStatus={kycStatus} />;
}
