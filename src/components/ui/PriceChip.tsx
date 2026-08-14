import { formatNaira } from "@/lib/format";
import { cn } from "@/lib/cn";

/**
 * Renders "Free" or a naira price. Used on content cards and detail headers.
 * `locked` adds the lock affordance for paid content the viewer has not bought.
 */
export function PriceChip({
  price,
  locked,
  className,
}: {
  price: number;
  locked?: boolean;
  className?: string;
}) {
  const isFree = price === 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-[var(--radius-chip)] px-2 py-1",
        "text-[12px] font-semibold leading-none backdrop-blur-[var(--blur-chrome)]",
        isFree
          ? "bg-[var(--surface-tag)] text-[var(--text-secondary)]"
          : "bg-[var(--accent)] text-[var(--text-on-accent)]",
        className
      )}
    >
      {locked && !isFree && <LockGlyph />}
      {isFree ? "Free" : formatNaira(price)}
    </span>
  );
}

function LockGlyph() {
  return (
    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path
        d="M3 5V3.5a3 3 0 0 1 6 0V5M2.5 5h7v5.5h-7z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}
