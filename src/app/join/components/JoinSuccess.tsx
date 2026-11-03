import { Button, Icon } from "@/components/ui";
import { ShareLink } from "./ShareLink";

interface JoinSuccessProps {
  /** The plan paid for ("Verify Plus"), or `null` when this visit does not know it (a return from a bank app). */
  tierName: string | null;
  /** What this visit confirmed was charged ("₦5,999"), or `null` when it did not read it. */
  price: string | null;
  /** A referral code covered the whole price: nothing was charged. */
  noPayment: boolean;
  /** The registration's short reference ("XXXX XXXX"): for support only, never typed anywhere. */
  reference: string;
}

/**
 * Everything on the screen after payment that comes under the heading
 * (JOIN-TIERS-WEB, R-125, owner 3 Nov 2026). There is no code to type: the
 * person signs in to the WAWU app (and later the website) with the SAME email
 * or phone number they used here, and the server finds the paid plan and gives
 * it. The registration reference stays on screen small, for support only.
 */
export function JoinSuccess({ tierName, price, noPayment, reference }: JoinSuccessProps) {
  return (
    <div className="flex w-full flex-col items-center gap-5">
      <div className="flex w-full flex-col items-center gap-1 rounded-input border border-accent bg-accent-tint px-4 py-4 text-center">
        {tierName ? (
          <span className="text-[12px] font-bold uppercase tracking-[0.14em] text-accent-soft">Your plan</span>
        ) : null}
        <span data-testid="success-plan" className="text-[28px] font-extrabold leading-[1.1] tracking-[-0.02em] text-text-primary">
          {tierName ?? "Your plan"}
        </span>
        {price ? (
          <span className="text-[14.5px] text-text-secondary">{noPayment ? "Covered by your referral code" : `Paid ${price}`}</span>
        ) : null}
      </div>

      <ol className="m-0 flex w-full list-none flex-col gap-3 p-0 text-left">
        <li className="flex items-start gap-3">
          <span className="grid h-[28px] w-[28px] flex-none place-items-center rounded-full bg-accent text-[14px] font-extrabold text-on-accent">1</span>
          <span className="pt-[3px] text-[15.5px] leading-[1.45] text-text-primary">
            Sign in to the WAWU app or on wawuafrica.com with the <b>same email or phone you used here</b>.
          </span>
        </li>
        <li className="flex items-start gap-3">
          <span className="grid h-[28px] w-[28px] flex-none place-items-center rounded-full bg-accent text-[14px] font-extrabold text-on-accent">2</span>
          <span className="pt-[3px] text-[15.5px] leading-[1.45] text-text-primary">
            {tierName ? `Your ${tierName} plan is waiting.` : "Your plan is waiting."}
          </span>
        </li>
      </ol>

      <p className="m-0 flex items-start gap-2 text-left text-[13.5px] leading-[1.45] text-text-secondary">
        <Icon name="Info" size={16} className="mt-[1px] flex-none" />
        If the app asks you to confirm that email or phone number, do that first.
      </p>

      <Button href="/sign-in" full>
        Sign in on this website
      </Button>

      <ShareLink />

      <p className="m-0 text-[12.5px] text-text-muted">
        For support only: your reference is{" "}
        <span data-testid="short-reference" className="whitespace-nowrap font-mono font-bold tracking-[0.08em]">
          {reference}
        </span>
        .
      </p>
    </div>
  );
}
