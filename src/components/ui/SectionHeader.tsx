import Link from "next/link";

/**
 * A section's title, with one optional action on the right.
 *
 * `caption` is the small uppercase eyebrow some screens put above the title;
 * it is optional because the approved mobile references draw a bare title and
 * a "See all" link, with no eyebrow.
 *
 * The action is either a LINK (`actionHref`, which is what "See all" always
 * is: a destination, so it should be middle-clickable and have a real URL) or
 * a BUTTON (`onAction`). Passing both is a mistake; the link wins.
 */
interface SectionHeaderProps {
  caption?: string;
  title: string;
  action?: string;
  onAction?: () => void;
  /** Renders the action as a link to this destination. */
  actionHref?: string;
  /**
   * Alias of `actionHref`. Two screens landed on the two names at the same
   * time (Services on `actionHref`, Events on `href`); both are honoured
   * rather than breaking one of them, and one of the two should be retired
   * once those branches have merged.
   */
  href?: string;
  className?: string;
}

export function SectionHeader({ caption, title, action, onAction, actionHref, href, className = "" }: SectionHeaderProps) {
  const link = actionHref ?? href;
  const label = action ?? (link ? "See all" : undefined);

  return (
    <div className={`mb-0 flex items-end justify-between gap-3 ${className}`}>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {caption ? (
          <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-text-muted">{caption}</span>
        ) : null}
        <h2 className="m-0 text-[18px] font-bold leading-snug tracking-[-0.02em] text-text-primary xl:text-[21px]">
          {title}
        </h2>
      </div>
      {label && link ? (
        <Link href={link} className="shrink-0 text-[13px] font-semibold text-accent no-underline hover:text-text-primary">
          {label}
        </Link>
      ) : label ? (
        <button
          type="button"
          onClick={onAction}
          className="shrink-0 text-[13.5px] font-semibold text-accent hover:text-text-primary"
        >
          {label}
        </button>
      ) : null}
    </div>
  );
}
