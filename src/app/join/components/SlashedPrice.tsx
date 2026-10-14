import { WAS_PRICE } from "./join-content";

interface SlashedPriceProps {
  /** The fee as the API sent it ("₦2,000"). `null` while the offer is still loading: nothing is drawn. */
  price: string | null;
  /** "inline" sits in a sentence or a button; "hero" is the offer card's big figure. */
  size?: "inline" | "hero";
  className?: string;
}

/**
 * The offer price the way the owner wants it shown (12 Oct 2026): the "was"
 * figure struck through, the fee that is paid beside it. The paid amount is
 * the API's; the struck figure is the owner's marketing number
 * (`WAS_PRICE` in join-content.ts). A screen reader hears one plain sentence
 * instead of two prices. The big figure wraps under the struck one when the
 * card is too narrow for both side by side (a 320 px phone), so it never
 * runs past the card or the page.
 */
export function SlashedPrice({ price, size = "inline", className = "" }: SlashedPriceProps) {
  if (!price) return null;
  const hero = size === "hero";
  return (
    <span className={`inline-flex items-baseline ${hero ? "flex-wrap gap-x-3 gap-y-1" : "gap-1.5"} ${className}`}>
      <span className="sr-only">{`Slashed from ${WAS_PRICE} to ${price}`}</span>
      <s
        aria-hidden="true"
        className={`font-semibold decoration-2 ${hero ? "text-[22px] text-text-muted dt:text-[26px]" : "text-[0.85em] opacity-80"}`}
      >
        {WAS_PRICE}
      </s>
      <span aria-hidden="true" className={hero ? "text-[56px] font-extrabold leading-none tracking-[-0.03em] text-text-primary dt:text-[68px]" : "font-extrabold"}>
        {price}
      </span>
    </span>
  );
}
