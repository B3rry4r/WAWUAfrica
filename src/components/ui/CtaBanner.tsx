import Link from "next/link";
import { Icon, type IconName } from "./Icon";

/**
 * The full-width purple banner the mobile references close a browse screen
 * with: an outline icon, a title, one line of copy, and a way on.
 *
 * ONE component, not one per screen. Learning closes with "Get Certified" and
 * Marketplace with "Sell on WAWU"; the Services and Events references close
 * the same way. The only difference between them is whether the action is a
 * white pill or a chevron, so that is a prop rather than a second file.
 *
 *   ctaLabel given    a white pill, for a banner selling a whole flow
 *   ctaLabel omitted  a chevron disc, for a banner that is itself the row
 *
 * The whole banner is the link either way: a purple slab with one tappable
 * corner is a target people miss.
 */
export interface CtaBannerProps {
  icon: IconName;
  title: string;
  body: string;
  href: string;
  /** Renders the white pill instead of the chevron. */
  ctaLabel?: string;
  className?: string;
}

export function CtaBanner({ icon, title, body, href, ctaLabel, className = "" }: CtaBannerProps) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-[14px] rounded-[var(--radius-card)] bg-[linear-gradient(100deg,var(--accent),var(--accent-hover))] p-[15px_16px] no-underline transition-opacity hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-page)] xl:p-[20px_24px] ${className}`}
    >
      <span className="grid h-[46px] w-[46px] shrink-0 place-items-center rounded-[var(--radius-media)] border border-[rgba(255,255,255,0.32)]">
        <Icon name={icon} size={23} color="var(--text-on-accent)" strokeWidth={1.7} />
      </span>

      <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
        <span className="text-[17px] font-bold leading-[1.2] tracking-[-0.02em] text-[var(--text-on-accent)] xl:text-[19px]">
          {title}
        </span>
        <span className="text-[12.5px] leading-[1.4] text-[rgba(255,255,255,0.82)] xl:text-[13.5px]">
          {body}
        </span>
      </span>

      {ctaLabel ? (
        <span className="inline-flex h-[40px] shrink-0 items-center gap-[7px] rounded-[var(--radius-button)] bg-[var(--wawu-warm-white)] px-[16px] text-[13.5px] font-bold text-[var(--text-on-light)]">
          {ctaLabel}
          <Icon name="ArrowRight" size={15} color="currentColor" strokeWidth={2.4} />
        </span>
      ) : (
        <span className="grid h-[32px] w-[32px] shrink-0 place-items-center rounded-full bg-[rgba(255,255,255,0.22)]">
          <Icon name="ChevronRight" size={18} color="var(--text-on-accent)" strokeWidth={2.4} />
        </span>
      )}
    </Link>
  );
}
