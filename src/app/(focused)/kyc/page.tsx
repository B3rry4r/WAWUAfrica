import { KycFlow } from "@/components/kyc/KycFlow";

export const metadata = {
  title: "Verify your identity · WAWUAfrica",
};

export default function KycPage() {
  // KycFlow fetches the real submission status itself (GET /api/hub/kyc) on
  // mount — no session/gate needed here. See src/components/kyc/KycFlow.tsx.
  return <KycFlow />;
}
