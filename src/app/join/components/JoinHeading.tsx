import { Badge } from "@/components/ui";

/**
 * The top of the registration page, under the Who Made This logo: the
 * eyebrow, the name, the offer, the launch date and the call to action. Also
 * drawn by the loading state, so the page's very first paint (the static
 * HTML, before any script has run) already says what this page is.
 *
 * The words are the owner's (10 Oct 2026), kept exactly: capitals, the "?"
 * after the name and the full stops in the last line. No price is written
 * here; the fee is drawn on the pay button from what the API sent.
 */
export function JoinHeading() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2.5">
        <span className="text-[12px] font-bold tracking-[0.14em] text-accent-hover">PRE-REGISTRATION / WAITLIST</span>
        <h1 className="m-0 text-[34px] font-bold leading-[1.05] tracking-[-0.035em] text-text-primary dt:text-[44px]">
          WHO MADE THIS?
        </h1>
      </div>
      <p className="m-0 text-[16px] leading-[1.55] text-text-secondary dt:text-[17px]">
        Get <strong className="font-bold text-text-primary">50% OFF</strong> your subscription to WHO MADE THIS? the creator
        and professional monetization platform.
      </p>
      <Badge tone="accent" className="self-start tracking-[0.1em]">
        LAUNCHING OCTOBER 17, 2026
      </Badge>
      <p className="m-0 text-[17px] font-semibold leading-[1.4] tracking-[-0.01em] text-text-primary">
        Register now. Create. Monetize. Grow.
      </p>
    </div>
  );
}
