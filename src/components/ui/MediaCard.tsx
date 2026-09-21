import Link from "next/link";
import type { ReactNode } from "react";
import { Icon, type IconName } from "./Icon";

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

/**
 * How the card's link is drawn.
 *
 *   "wrap"     the whole card IS the anchor. The default, and right for a
 *              card whose only affordance is "open this".
 *   "overlay"  the card is a plain box with the anchor stretched across it
 *              and `badge` / `corner` / `action` lifted above it.
 *
 * "overlay" exists because a BUTTON may not live inside an anchor: nesting
 * interactive content is invalid HTML and leaves a screen reader with one
 * control that does two things, while a mouse press on the inner control
 * navigates instead of pressing it. An events card carries a save toggle on
 * the picture, so it needs this. It is a prop rather than a second card
 * component on purpose.
 */
export type MediaCardLinkMode = "wrap" | "overlay";

/** Type scale for the body. "lg" is the hero card at the top of a screen. */
export type MediaCardSize = "md" | "lg";

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
  /** A small glyph before the caption. A pin on a venue, a clock on a time. */
  captionIcon?: IconName;
  /** Small chips under the caption. */
  tags?: readonly string[];
  /** The one action, full width at the bottom. */
  action?: ReactNode;
  variant?: MediaCardVariant;
  linkMode?: MediaCardLinkMode;
  size?: MediaCardSize;
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
  captionIcon,
  tags,
  action,
  variant = "overlay",
  linkMode = "wrap",
  size = "md",
  aspect = "aspect-[3/4]",
  className = "",
}: MediaCardProps) {
  // A control on the picture has to sit above the stretched link, or the link
  // swallows the press. Only "overlay" draws that link, so only it lifts them.
  const lift = linkMode === "overlay" ? "z-[2]" : "";
  const media = (
    <span className={`relative block w-full overflow-hidden ${variant === "overlay" ? "h-full" : aspect} bg-[linear-gradient(160deg,var(--accent-deep),var(--surface-elevated))]`}>
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <span className="absolute inset-0 grid place-items-center">{fallback}</span>
      )}
      {badge ? <span className={`absolute left-[10px] top-[10px] ${lift}`}>{badge}</span> : null}
      {corner ? <span className={`absolute right-[10px] top-[10px] ${lift}`}>{corner}</span> : null}
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
  const large = size === "lg";
  const body = (
    <span className="flex flex-col gap-[3px]">
      <span className="flex items-center gap-[5px]">
        <span
          className={`min-w-0 flex-1 font-bold tracking-[-0.01em] ${
            large ? "line-clamp-2 text-[19px] leading-[1.22]" : "truncate text-[14px] leading-tight"
          } ${onScrim ? "text-white" : "text-[var(--text-primary)]"}`}
        >
          {title}
        </span>
        {titleBadge}
      </span>
      {caption ? (
        <span
          className={`flex items-center gap-[5px] ${large ? "text-[13.5px]" : "text-[12px]"} leading-[1.35] ${
            onScrim ? "text-[rgba(255,255,255,0.72)]" : "text-[var(--text-muted)]"
          }`}
        >
          {captionIcon ? (
            <Icon name={captionIcon} size={large ? 15 : 13} color="currentColor" strokeWidth={1.9} />
          ) : null}
          <span className="min-w-0 flex-1 truncate">{caption}</span>
        </span>
      ) : null}
      {tags && tags.length > 0 ? (
        <span className="mt-[7px] flex flex-wrap gap-[6px]">
          {tags.map((t) => (
            <span
              key={t}
              className={`inline-flex items-center rounded-full font-semibold ${
                large ? "px-[12px] py-[6px] text-[12px]" : "px-[9px] py-[3px] text-[10.5px]"
              } ${
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
      {/* Relative + lifted so a control in here stays pressable when the card
          draws a stretched link over itself (linkMode="overlay"). The scrim
          and the body panel are deliberately NOT lifted: tapping the title
          has to reach that link and open the card. */}
      {action ? <span className={`relative mt-[9px] block ${lift}`}>{action}</span> : null}
    </span>
  );

  const shell =
    "group relative flex shrink-0 flex-col overflow-hidden rounded-[var(--radius-card)] border border-[var(--border-hairline)] no-underline transition-colors hover:border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-page)]";

  /*
    The scrim is what makes white text legible over a photograph that can be
    any brightness. Anchored to the bottom rather than covering the card, so
    the picture still reads as the card's own.
  */
  const inner =
    variant === "overlay" ? (
      <>
        {media}
        <span
          className={`absolute inset-x-0 bottom-0 bg-[linear-gradient(0deg,rgba(11,10,13,0.96)_0%,rgba(11,10,13,0.88)_46%,transparent_100%)] ${
            large ? "px-[14px] pb-[14px] pt-[64px]" : "px-[11px] pb-[11px] pt-[52px]"
          }`}
        >
          {body}
        </span>
      </>
    ) : (
      <>
        {media}
        <span className="flex flex-1 flex-col px-[11px] pb-[12px] pt-[10px]">{body}</span>
      </>
    );

  const box = `${shell} ${variant === "overlay" ? aspect : "bg-[var(--surface-card)]"} ${className}`;

  if (linkMode === "overlay") {
    return (
      <div className={box}>
        {inner}
        <Link href={href} aria-label={title} className="absolute inset-0 z-[1] rounded-[inherit]" />
      </div>
    );
  }

  return (
    <Link href={href} className={box}>
      {inner}
    </Link>
  );
}
