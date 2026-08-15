import type { TipResult } from "./mocks/tips";
import { sendMockTip, TIP_PRESETS } from "./mocks/tips";

export { TIP_PRESETS };

// SEAM: replace with POST /api/hub/tips
export async function sendTip(
  creator: { wawuId: string; name: string },
  amount: number,
  note?: string,
): Promise<{ result: TipResult; amount: number }> {
  return sendMockTip(creator, amount, note);
}