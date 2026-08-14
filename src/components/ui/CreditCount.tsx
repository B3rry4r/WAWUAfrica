import { formatCredits } from "@/lib/format";

/**
 * WAWU Credits are prepaid message units — a COUNT, never a currency value,
 * never cashable. Do not add a naira equivalent to this component.
 */
export function CreditCount({ count }: { count: number }) {
  return (
    <span className="text-[13px] font-medium text-[var(--text-secondary)] [font-variant-numeric:tabular-nums]">
      {formatCredits(count)}
    </span>
  );
}
