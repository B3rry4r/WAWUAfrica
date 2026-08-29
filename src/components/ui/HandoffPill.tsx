import { Icon } from "./Icon";
import { cn } from "@/lib/cn";

/**
 * Signals that a tap leaves WAWU for another product.
 *
 * `app` has no default any more. It defaulted to "WAWUBasket", which is no
 * longer surfaced anywhere — a default that names a product the app does not
 * show is a caption waiting to appear somewhere wrong. Callers name their
 * destination.
 */
export function HandoffPill({
  app,
  className,
}: {
  app: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-[var(--radius-chip)]",
        "border border-[var(--border-hairline)] px-2.5 py-1",
        "text-[11px] font-semibold text-[var(--text-muted)]",
        className
      )}
    >
      Opens in {app}
      <Icon name="ArrowUpRight" size={12}  />
    </span>
  );
}
