interface SlashedPriceProps {
  /** What is paid, as the API sent it ("₦1,200"). `null` while the plans load: nothing is drawn. */
  price: string | null;
  /**
   * The plan's own price, struck through, ONLY when a referral code applies (JOIN-TIERS, R-125).
   * There is no other "was" price: the old marketing figure is gone.
   */
  was?: string | null;
  /** "inline" sits in a sentence or a button; "hero" is a big figure. */
  size?: "inline" | "hero";
  className?: string;
}

/**
 * A price. With `was`, the plan's full price struck through beside the code's
 * price, and a screen reader hears one plain sentence instead of two prices.
 * Both figures are the API's: nothing here is a literal amount.
 */
export function SlashedPrice({ price, was = null, size = "inline", className = "" }: SlashedPriceProps) {
  if (!price) return null;
  const hero = size === "hero";
  const figure = (
    <span
      aria-hidden={was ? "true" : undefined}
      className={hero ? "text-[44px] font-extrabold leading-none tracking-[-0.03em] text-text-primary" : "font-extrabold"}
    >
      {price}
    </span>
  );
  if (!was) return <span className={`inline-flex items-baseline ${className}`}>{figure}</span>;
  return (
    <span className={`inline-flex items-baseline ${hero ? "flex-wrap gap-x-3 gap-y-1" : "gap-1.5"} ${className}`}>
      <span className="sr-only">{`${was} with your code: ${price}`}</span>
      <s aria-hidden="true" className={`font-semibold decoration-2 ${hero ? "text-[20px] text-text-muted" : "text-[0.85em] opacity-80"}`}>
        {was}
      </s>
      {figure}
    </span>
  );
}
