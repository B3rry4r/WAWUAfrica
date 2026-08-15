import { currentSession } from "@/lib/api/mocks/session";
import { KycFlow } from "@/components/kyc/KycFlow";

export const metadata = {
  title: "Verify your identity · WAWUAfrica",
};

export default function KycPage() {
  const status = currentSession.creator?.kyc ?? "not_started";
  return <KycFlow initialStatus={status} />;
}
