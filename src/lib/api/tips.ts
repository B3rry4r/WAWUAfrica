import { apiFetch, isMockModeError } from "./client";
import { openFlutterwaveCheckout, isFlutterwaveCancelled, checkoutCustomerFromSession } from "@/lib/flutterwave";
import { sessionStorage } from "@/lib/auth/session-storage";
import type { TipResult } from "./mocks/tips";
import { sendMockTip, TIP_PRESETS } from "./mocks/tips";

/**
 * The bounds the server actually enforces (CreateTipDto: @Min(1) @Max(10_000_000)).
 *
 * The floor is raised to ₦100 here because a ₦1 tip costs more in card fees
 * than it moves, and Flutterwave rejects trivially small charges anyway. The
 * ceiling is the server's own, so the form cannot offer an amount the API
 * will refuse.
 */
export const MIN_TIP_NAIRA = 100;
export const MAX_TIP_NAIRA = 10_000_000;

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
 * POST /api/hub/tips -> Flutterwave inline checkout -> POST /api/hub/tips/verify
 * (Purchase resource, WAWU-Hub-API/src/purchase/purchase.controller.ts). Both
 * routes sit under `WawuAuthGuard`, `roles: ["any"]` — any signed-in user, no
 * creator gate (a plain user tips a creator).
 *
 * The payer completes the charge in Flutterwave's own modal, which yields a
 * real `transaction_id`; the server then re-verifies that id with Flutterwave
 * before recording the tip. See src/lib/flutterwave.ts.
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

    const customer = checkoutCustomerFromSession(sessionStorage.getUser());
    if (!customer) return { result: "payment_failed", amount };

    const charge = await openFlutterwaveCheckout(init.flutterwaveConfig, customer, {
      title: `Tip ${creator.name}`,
      description: "Tip on WAWU",
    }, {
      verifyPath: "/api/hub/tips/verify",
      successPath: "/home",
      label: "Your tip",
    });

    // Past this line the money HAS moved. A failure now is not a decline —
    // telling the tipper "nothing was charged, try again" would take a second
    // payment, so it gets its own result the UI renders differently.
    try {
      await apiFetch<{ tipped: true }>("/api/hub/tips/verify", {
        method: "POST",
        authed: true,
        body: { transaction_id: charge.transaction_id, tx_ref: charge.tx_ref },
      });
    } catch {
      return { result: "verify_failed", amount };
    }

    return { result: "success", amount };
  } catch (e) {
    // Dismissing the checkout modal is not a failed payment — nothing was
    // charged and nothing went wrong, so report it distinctly.
    if (isFlutterwaveCancelled(e)) return { result: "cancelled", amount };
    if (!isMockModeError(e)) {
      // Real backend reached and rejected the tip (decline, validation, 5xx).
      return { result: "payment_failed", amount };
    }
    // SEAM: replace with POST /api/hub/tips + POST /api/hub/tips/verify
    return sendMockTip(creator, amount, note);
  }
}
