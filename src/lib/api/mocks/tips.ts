import { delay } from "../client";

/** Locked tip presets — integer Naira, in-app one-tap only. */
export const TIP_PRESETS = [500, 1000, 2000, 5000] as const;

export type TipResult = "success" | "payment_failed";

export async function sendMockTip(
  creator: { wawuId: string; name: string },
  amount: number,
  note?: string,
): Promise<{ result: TipResult; amount: number }> {
  await delay(650);
  void creator;
  void note;
  return { result: "success", amount };
}