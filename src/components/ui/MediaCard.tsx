import Link from "next/link";
import type { ReactNode } from "react";

/**
 * The picture-led card the Explore reference is built from
 * (refs/target-explore-desktop-structure.jpg).
 *
 * Featured Creators, Upcoming Events and Learning & Growth are all the same
 * card in that reference: a photograph, something small overlaid on it, and a
 * name with an action. They are ONE component with a `variant`, not three,
 * because three copies of a card is how a rail of creators and a rail of
 * events end up with different corner radii and different type scales.
 *
 *   variant="overlay"  the body sits ON the photograph, behind a scrim.
 *                      Creators and courses: the picture is the whole card
 *                      and the name is a label on it.
 *   variant="stacked"  the photograph is the top of the card and the body is
 *                      the dark panel under it. Events: a date, a venue and
 *                      two tags are too much to put over somebody's photo.
 *
 * What it deliberately does NOT do: invent a placeholder photograph. With no
 * image it draws a brand-tinted panel and lets `fallback` fill it, so a rail
 * keeps one shape whether or not everybody has uploaded a picture.
 */
export type MediaCardVariant = "overlay" | "stacked";

export interface MediaCardProps {
  href: string;
  imageUrl?: string | null;
  /** Drawn in the media area when there is no image. */
  fallback?: ReactNode;
  /** Top-left of the media area: a date block, a kind label. */
  badge?: ReactNode;
  /** Top-right of the media area: a save control, a status. */
  corner?: ReactNode;
  title: string;
  /** Sits immediately after the title, on the same line. A verification tick. */
  titleBadge?: ReactNode;
  caption?: string;
  /** Small chips under the caption. */
  tags?: readonly string[];
  /** The one action, full width at the bottom. */
  action?: ReactNode;
  variant?: MediaCardVariant;
  /** Tailwind aspect utility for the media area. */
  aspect?: string;
  className?: string;
}

export function MediaCard({
  href,
  imageUrl,
  fallback,
  badge,
  corner,
  title,
  titleBadge,
  caption,
  tags,
  action,
  variant = "overlay",
  aspect = "aspect-[3/4]",
  className = "",
}: MediaCardProps) {
  const media = (
    <span className={`relative block w-full overflow-hidden ${variant === "overlay" ? "h-full" : aspect} bg-[linear-gradient(160deg,var(--accent-deep),var(--surface-elevated))]`}>
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <span className="absolute inset-0 grid place-items-center">{fallback}</span>
      )}
      {badge ? <span className="absolute left-[10px] top-[10px]">{badge}</span> : null}
      {corner ? <span className="absolute right-[10px] top-[10px]">{corner}</span> : null}
    </span>
  );

  /*
    Two colour sets, not one.

    An overlay body sits on a photograph behind a dark scrim, so it is white
    whatever the theme: the scrim is the background, not the page. A stacked
    body sits on --surface-card and has to read in light mode too, so it
    takes tokens. Using the overlay's white on both is how a card ends up
    invisible for every viewer whose system is set to light.
  */
  const onScrim = variant === "overlay";
  const body = (
    <span className="flex flex-col gap-[3px]">
      <span className="flex items-center gap-[5px]">
        <span
          className={`min-w-0 flex-1 truncate text-[14px] font-bold leading-tight tracking-[-0.01em] ${
            onScrim ? "text-white" : "text-[var(--text-primary)]"
          }`}
        >
          {title}
        </span>
        {titleBadge}
      </span>
      {caption ? (
        <span
          className={`line-clamp-2 text-[12px] leading-[1.35] ${
            onScrim ? "text-[rgba(255,255,255,0.72)]" : "text-[var(--text-muted)]"
          }`}
        >
          {caption}
        </span>
      ) : null}
      {tags && tags.length > 0 ? (
        <span className="mt-[7px] flex flex-wrap gap-[6px]">
          {tags.map((t) => (
            <span
              key={t}
              className={`inline-flex items-center rounded-full px-[9px] py-[3px] text-[10.5px] font-semibold ${
                onScrim
                  ? "bg-[rgba(255,255,255,0.14)] text-[rgba(255,255,255,0.88)]"
                  : "border border-[var(--border-hairline)] bg-[var(--surface-tag)] text-[var(--text-secondary)]"
              }`}
            >
              {t}
            </span>
          ))}
        </span>
      ) : null}
      {action ? <span className="mt-[9px] block">{action}</span> : null}
    </span>
  );

  const shell =
    "group relative flex shrink-0 flex-col overflow-hidden rounded-[var(--radius-card)] border border-[var(--border-hairline)] no-underline transition-colors hover:border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-page)]";

  if (variant === "overlay") {
    return (
      <Link href={href} className={`${shell} ${aspect} ${className}`}>
        {media}
        {/*
          The scrim is what makes white text legible over a photograph that
          can be any brightness. Anchored to the bottom rather than covering
          the card, so the picture still reads as the card's own.
        */}
        <span className="absolute inset-x-0 bottom-0 bg-[linear-gradient(0deg,rgba(11,10,13,0.96)_0%,rgba(11,10,13,0.88)_46%,transparent_100%)] px-[11px] pb-[11px] pt-[52px]">
          {body}
        </span>
      </Link>
    );
  }

  return (
    <Link href={href} className={`${shell} bg-[var(--surface-card)] ${className}`}>
      {media}
      <span className="flex flex-1 flex-col px-[11px] pb-[12px] pt-[10px]">{body}</span>
    </Link>
  );
}
