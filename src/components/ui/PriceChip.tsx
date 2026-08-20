import { formatNaira } from "@/lib/format";

interface PriceChipProps {
  free?: boolean;
  amount?: number;
  label?: string;
  tone?: "plain" | "glass" | "accent";
  size?: "sm" | "md";
}

/**
 * Price badge — "Free" or "₦X", always naira via formatNaira(). Paid chips
 * render on the accent tint so a locked piece is instantly readable.
 */
export function PriceChip({ free, amount, label, tone = "plain", size = "sm" }: PriceChipProps) {
  const height = size === "sm" ? "h-6" : "h-7";
  const text = size === "sm" ? "text-[12px]" : "text-[13px]";

  const toneClass =
    tone === "plain"
      ? "bg-tag text-text-secondary border-hairline"
      : tone === "glass"
        ? "bg-[rgba(19,19,22,0.86)] text-text-primary border-strong backdrop-blur"
        : "bg-accent-tint text-accent-hover border-accent";

  return (
    <span
      className={[
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-[9px]",
        "[font-feature-settings:var(--font-feature-tabular)]",
        height,
        text,
        toneClass,
      ].join(" ")}
    >
      {/* Content a creator chose not to charge for. "Free" is gone from the
          platform's language, so this states the price rather than labelling
          the thing. */}
      {free ? "₦0" : formatNaira(amount ?? 0)}
      {label ? <span className="opacity-70">{label}</span> : null}
    </span>
  );
}