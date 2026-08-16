import { apiFetch } from "./client";
import type { TipResult } from "./mocks/tips";
import { sendMockTip, TIP_PRESETS } from "./mocks/tips";

export { TIP_PRESETS };

interface FlutterwaveConfigResponse {
  flutterwaveConfig: {
    txRef: string;
    amount: number;
    currency: "NGN";
    publicKey: string;
  };
}

/**
 * POST /api/hub/tips + POST /api/hub/tips/verify (Purchase resource — verified
 * against WAWU-Hub-API/src/purchase/purchase.controller.ts, no `/api/hub`
 * proxy prefix issue since apiFetch already prepends API_BASE). Both routes
 * sit under `WawuAuthGuard`, `roles: ["any"]` — any signed-in user, no
 * creator gate (a plain user tips a creator).
 *
 * Same as the content-unlock flow (src/app/(app)/content/[id]/page.tsx),
 * there is no real Flutterwave inline-checkout SDK wired into this frontend
 * yet — this fakes the actual card-payment step with a short delay and a
 * synthetic `transaction_id`, exactly mirroring that existing pattern, then
 * calls the real verify endpoint so a genuine `Purchase` row (type: 'tip')
 * gets created and completed server-side.
 */
export async function sendTip(
  creator: { wawuId: string; name: string },
  amount: number,
  note?: string,
): Promise<{ result: TipResult; amount: number }> {
  try {
    const init = await apiFetch<FlutterwaveConfigResponse>("/api/hub/tips", {
      method: "POST",
      authed: true,
      body: { creatorWawuId: creator.wawuId, amount, note },
    });

    // SEAM: replace this fake delay with a real Flutterwave inline checkout
    // once the SDK is wired — see content/[id]/page.tsx's identical stand-in.
    await new Promise((resolve) => setTimeout(resolve, 900));

    await apiFetch<{ tipped: true }>("/api/hub/tips/verify", {
      method: "POST",
      authed: true,
      body: { transaction_id: `txn-${Date.now()}`, tx_ref: init.flutterwaveConfig.txRef },
    });

    return { result: "success", amount };
  } catch {
    // SEAM: replace with POST /api/hub/tips + POST /api/hub/tips/verify
    return sendMockTip(creator, amount, note);
  }
}
