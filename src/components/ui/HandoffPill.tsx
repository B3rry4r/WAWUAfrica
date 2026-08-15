import { Icon } from "./Icon";
import { cn } from "@/lib/cn";

/**
 * Marketplace is handoff only — WAWUBasket and WAWUBeauty are external apps.
 * Never rebuild their commerce engine; this pill signals the user is leaving.
 */
export function HandoffPill({
  app = "WAWUBasket",
  className,
}: {
  app?: string;
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
