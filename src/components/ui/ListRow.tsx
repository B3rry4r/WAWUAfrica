import Link from "next/link";
import { Button } from "./Button";
import { Icon } from "./Icon";
import type { IconName } from "./Icon";

interface ListRowProps {
  title: string;
  subtitle?: string;
  icon?: IconName;
  /** Optional action on the right (e.g. "Follow", "Join", "Watch"). */
  meta?: string;
  onAction?: () => void;
  trailing?: "none" | "chevron";
  onClick?: () => void;
  /** Renders the row as a navigation link instead of a button. */
  href?: string;
}

/** One-line list row used across search, purchases and empty-state suggestions. */
export function ListRow({ title, subtitle, icon, meta, onAction, trailing = "chevron", onClick, href }: ListRowProps) {
  const body = (
    <>
      {icon ? (
        <span className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-[13px] bg-tag text-text-secondary">
          <Icon name={icon} size={18} strokeWidth={2} />
        </span>
      ) : null}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14.5px] font-semibold text-text-primary">{title}</span>
        {subtitle ? <span className="mt-0.5 block truncate text-[12.5px] text-text-muted">{subtitle}</span> : null}
      </span>
{meta && onAction ? (
  <span onClick={(e) => e.stopPropagation()}>
    <Button size="sm" variant="secondary" onClick={onAction}>
      {meta}
    </Button>
  </span>
) : meta ? (
  // Plain text badge (design system's ListRow.jsx: meta renders as its own
  // bold tabular-number span, independent of and alongside the chevron —
  // not a replacement for it).
  <span className="shrink-0 text-[13.5px] font-bold text-text-primary [font-feature-settings:var(--font-feature-tabular)]">
    {meta}
  </span>
) : null}
{!(meta && onAction) && trailing === "chevron" ? (
  <Icon name="ChevronRight" size={17} color="var(--text-muted)" />
) : null}
    </>
  );
  const cls =
    "flex w-full items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-[rgba(255,255,255,0.05)]";
  if (href) {
    return (
      <Link href={href} className={cls}>
        {body}
      </Link>
    );
  }
  return (
    <button
      type="button"
      className={cls}
      onClick={onClick ? () => onClick!() : undefined}
    >
      {body}
    </button>
  );
}