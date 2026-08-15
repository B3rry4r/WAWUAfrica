import type { TipResult } from "./mocks/tips";
import { sendMockTip, TIP_PRESETS } from "./mocks/tips";

export { TIP_PRESETS };

export async function sendTip(
  creator: { wawuId: string; name: string },
  amount: number,
  note?: string,
): Promise<{ result: TipResult; amount: number }> {
  return sendMockTip(creator, amount, note);
}