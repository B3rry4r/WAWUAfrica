import Link from "next/link";
import { Icon } from "@/components/ui";

/**
 * The listing-slot state, in one place, for both Create screens.
 *
 * It exists as its own file because the hub (`/create`) and the content
 * format picker (`/create/content`) both need it and a second copy would
 * drift - the `forks` gate exists for exactly this, and the two copies would
 * have disagreed the first time the cap or the wording changed.
 *
 * The rule it states: build brief B2 caps an account at five items across
 * products, content and services TOGETHER. Communities and events are not
 * listings and do not consume a slot. That last sentence matters more than it
 * looks: while `/create` was only ever a content picker, every option on
 * screen cost a slot and there was nothing to explain. Now that two of the
 * four creatable things are free, a creator who assumes hosting a room costs
 * them one of their five will ration uploads they did not need to ration.
 */
export interface SlotMeterProps {
  slotsUsed: number;
  /** The flat per-account cap. See MAX_ITEMS_PER_ACCOUNT in gates.ts. */
  slotsTotal: number;
  className?: string;
}

export function SlotMeter({ slotsUsed, slotsTotal, className = "" }: SlotMeterProps) {
  const slotsLeft = Math.max(0, slotsTotal - slotsUsed);
  const slotsFull = slotsLeft === 0;
  const pct = slotsTotal > 0 ? Math.min(100, Math.round((slotsUsed / slotsTotal) * 100)) : 0;

  return (
    <div className={`flex flex-col gap-[10px] rounded-card border border-hairline bg-card p-[16px] ${className}`}>
      <div className="flex items-baseline gap-[10px]">
        <span className="flex-1 text-[13px] text-text-secondary">Listing slots</span>
        <span className="text-[15px] font-bold text-text-primary [font-feature-settings:var(--font-feature-tabular)]">
          {slotsUsed} of {slotsTotal}
        </span>
      </div>
      <div className="h-[5px] overflow-hidden rounded-full bg-tag">
        <div
          className={`h-full rounded-full transition-[width] duration-200 ${slotsFull ? "bg-warning" : "bg-accent"}`}
          // A percentage is a computed value, so it cannot be a Tailwind
          // class. Same documented exception StorageMeter and the upload
          // progress bar already take.
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[12.5px] leading-[1.45] text-text-muted">
        {slotsFull
          ? "Every slot is in use. Take something down to open one up."
          : `${slotsLeft} still open. Taking a listing down returns its slot.`}
      </span>
      <span className="text-[12.5px] leading-[1.45] text-text-muted">
        Content and services use a slot. Events and communities do not.
      </span>
      <Link
        href="/create/library"
        className="inline-flex items-center gap-[6px] text-[13px] font-semibold text-accent hover:text-text-primary"
      >
        Manage my listings
        <Icon name="ArrowRight" size={14} strokeWidth={2.2} />
      </Link>
    </div>
  );
}
