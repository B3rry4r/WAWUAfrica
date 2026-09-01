import { formatNaira } from "@/lib/format";

/**
 * A plan's price, with a referral discount applied if there is one.
 *
 * The three parts are all required together and that is the point: a
 * percentage with no prices is a claim nobody can check, and a discounted
 * price with no original is just a cheaper plan. Struck original, new price,
 * and the percentage off — so somebody can see what they are being given.
 *
 * With no discount it renders exactly what it rendered before, so callers can
 * pass the props unconditionally instead of forking the markup.
 */
export interface PlanPriceProps {
  /** The list price, before any code. */
  priceNaira: number;
  /** 1-100. Zero or undefined renders the plain price — a 0% code is an
   *  invitation, not a discount, and "0% off" reads as a broken code. */
  discountPercent?: number;
  /** Priced by the server. Never recomputed here. */
  discountedPriceNaira?: number;
  /** Appended after the figure, e.g. " / year". */
  suffix?: string;
  className?: string;
}

export function PlanPrice({
  priceNaira,
  discountPercent,
  discountedPriceNaira,
  suffix,
  className = "",
}: PlanPriceProps) {
  const discounted =
    discountPercent !== undefined &&
    discountPercent > 0 &&
    discountedPriceNaira !== undefined;

  return (
    <span className={`flex flex-wrap items-baseline gap-x-[8px] gap-y-[2px] ${className}`}>
      {discounted ? (
        <>
          <s className="text-[15px] font-semibold text-[var(--text-muted)] [font-feature-settings:var(--font-feature-tabular)]">
            {formatNaira(priceNaira)}
          </s>
          <span className="text-[20px] font-bold tracking-[-0.02em] text-[var(--text-primary)] [font-feature-settings:var(--font-feature-tabular)]">
            {formatNaira(discountedPriceNaira)}
          </span>
          <span className="rounded-full bg-[var(--accent)] px-[8px] py-[2px] text-[11px] font-bold text-[var(--text-on-accent)]">
            {discountPercent}% off
          </span>
        </>
      ) : (
        <span className="text-[20px] font-bold tracking-[-0.02em] text-[var(--text-primary)] [font-feature-settings:var(--font-feature-tabular)]">
          {formatNaira(priceNaira)}
        </span>
      )}
      {suffix ? (
        <span className="text-[13px] font-normal text-[var(--text-muted)]">{suffix}</span>
      ) : null}
    </span>
  );
}
