import { OpenWalletFlow } from "@/components/wallet/open/OpenWalletFlow";

export const metadata = {
  title: "Open your wallet · WAWUAfrica",
};

export default function OpenWalletPage() {
  // OpenWalletFlow reads where the person stands from the server on every
  // visit (GET /api/hub/money/wallet), so there is no step to pass in here.
  return <OpenWalletFlow />;
}
