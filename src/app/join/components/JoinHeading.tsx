import { Badge } from "@/components/ui";

/**
 * The top of the registration page, under the Who Made This logo: the
 * eyebrow, the offer, the launch date and the call to action. Also drawn by
 * the loading state, so the page's very first paint (the static HTML, before
 * any script has run) already says what this page is.
 *
 * The words are the owner's (10 Oct 2026), kept exactly: capitals, the "?"
 * after the name and the full stops in the last line. There is no separate
 * "WHO MADE THIS?" heading: the logo above is the name. The offer line takes
 * the heading's place and weight, and is the page's one h1. "ONE-OFF" is
 * emphasised the way the earlier offer figure was (bold, primary text colour,
 * against the secondary colour of the rest). No price is written here; the
 * fee is drawn on the pay button from what the API sent.
 */
export function JoinHeading() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2.5">
        <span className="text-[12px] font-bold tracking-[0.14em] text-accent-hover">PRE-REGISTRATION / WAITLIST</span>
        <h1 className="m-0 text-[26px] font-medium leading-[1.25] tracking-[-0.025em] text-text-secondary dt:text-[30px]">
          Get a <strong className="font-bold text-text-primary">ONE-OFF</strong> subscription to WHO MADE THIS? the creator
          and professional monetization platform.
        </h1>
      </div>
      <Badge tone="accent" className="self-start tracking-[0.1em]">
        LAUNCHING OCTOBER 17, 2026
      </Badge>
      <p className="m-0 text-[17px] font-semibold leading-[1.4] tracking-[-0.01em] text-text-primary">
        Register now. Create. Monetize. Grow.
      </p>
    </div>
  );
}
