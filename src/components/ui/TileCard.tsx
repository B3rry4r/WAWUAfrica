import Link from "next/link";
import { Icon, type IconName } from "./Icon";

/**
 * The card the landing services use, available to every list in the app.
 *
 * Lists here were rows, or chips: a name, maybe a blurb, a chevron. That is
 * legible but it is not the product — a page of twenty-seven identical rows,
 * or a strip of grey pills, reads as a database table. The landing services
 * proved the alternative, so this is that card, once, rather than each screen
 * growing its own.
 *
 * Most in-app lists pass NO icon: legal services, categories and professional
 * fields have never had one, and inventing a glyph per row would be inventing
 * meaning. The watermark is there for the callers that genuinely have icons.
 */

/**
 * The palette, cycled by index.
 *
 * Deterministic on purpose: the same list renders the same colours every time,
 * so a card keeps its identity between visits instead of reshuffling. Every
 * entry is a token — no raw hex, per CLAUDE.md — and every one is dark enough
 * for white text to clear contrast at the bottom of the card, which is the
 * only place text sits.
 */
export const TILE_GRADIENTS = [
  "bg-[linear-gradient(150deg,var(--accent-deep),var(--accent))]",
  "bg-[linear-gradient(150deg,rgba(11,10,13,0.35),var(--brand-aqua))]",
  "bg-[linear-gradient(150deg,rgba(11,10,13,0.55),var(--accent-deep))]",
  "bg-[linear-gradient(150deg,rgba(11,10,13,0.35),var(--brand-coral))]",
  "bg-[linear-gradient(150deg,var(--accent-deep),rgba(148,17,201,0.5))]",
  "bg-[linear-gradient(150deg,rgba(11,10,13,0.4),var(--brand-yellow))]",
  "bg-[linear-gradient(150deg,rgba(11,10,13,0.4),var(--brand-lime))]",
] as const;

export function tileGradient(index: number): string {
  return TILE_GRADIENTS[((index % TILE_GRADIENTS.length) + TILE_GRADIENTS.length) % TILE_GRADIENTS.length];
}

export type TileCardSize = "sm" | "md" | "lg";

const SIZE: Record<TileCardSize, string> = {
  // A filter chip's replacement: wide enough for two words, short enough that
  // a row of them is still a filter rather than a second page of content.
  sm: "h-[86px] w-[150px]",
  md: "h-[140px] w-full dt:h-[150px]",
  lg: "h-[140px] w-[220px] dt:h-[170px] dt:w-[270px]",
};

export interface TileCardProps {
  title: string;
  /** One line under the name. A blurb, a status, "Coming soon". */
  subtitle?: string;
  /** A third line, for the figure somebody is comparing across the list. */
  meta?: string;
  /** Watermark. Omit on lists that have no icons of their own. */
  icon?: IconName;
  /**
   * A supplied icon badge (PNG/SVG). Self-contained art — its own dark tile
   * and glow baked in — so it is shown near-solid rather than bled to a
   * low-opacity watermark. `layout="overlay"` (the default) draws it top
   * right, clear of the title/subtitle scrim at the bottom. `layout="stacked"`
   * draws it large, leading the card. Takes priority over `icon` when both
   * are passed.
   */
  iconImageSrc?: string;
  /**
   * "overlay" (default): icon watermarked behind a full-bleed gradient, title
   * and subtitle on a bottom scrim — the original landing-services treatment.
   * "stacked": a big icon leads a plain card, title and subtitle sit below it
   * in normal flow, no gradient. Asked for by name — "the icons should be big
   * and be the actual slides, the write-ups below them" — after the gradient
   * version read as a wall of mismatched colours once every card carried a
   * supplied icon rather than a single lucide glyph.
   */
  layout?: "overlay" | "stacked";
  href?: string;
  onClick?: () => void;
  /** Greys the card and drops the link — for a service that is not open yet. */
  disabled?: boolean;
  /** Filter state, when a row of these is acting as a filter. */
  selected?: boolean;
  /** Picks the gradient. Pass the item's index. */
  index?: number;
  /** An explicit gradient, when the caller already owns one. Ignored by `layout="stacked"`. */
  gradientClass?: string;
  size?: TileCardSize;
  className?: string;
}

const STACKED_ICON_SIZE: Record<TileCardSize, string> = {
  // Mobile stays compact (4 tiles to a row); desktop gets real room (8 in one
  // row, plenty of width per tile), so this is the one size in the map that
  // carries its own `dt:` step rather than a single fixed figure.
  sm: "h-16 w-16 dt:h-24 dt:w-24",
  md: "h-28 w-28",
  lg: "h-32 w-32",
};

export function TileCard({
  title,
  subtitle,
  meta,
  icon,
  iconImageSrc,
  layout = "overlay",
  href,
  onClick,
  disabled = false,
  selected = false,
  index = 0,
  gradientClass,
  size = "md",
  className = "",
}: TileCardProps) {
  if (layout === "stacked") {
    // No card shell on purpose: "remove the containers, the icons should be
    // big and bold, the title shows below" — the icon itself is the tile,
    // not a badge sitting inside one.
    const stackedShell = [
      "flex shrink-0 flex-col items-center gap-1 text-center",
      // "sm" fills its grid cell on mobile (the caller owns a 4-col grid
      // there), but sizes to its own content on desktop, where the caller
      // switches to a centered flex row and a `w-full` tile would stretch
      // to fill it, spreading every tile across the whole row instead of
      // sitting close together.
      size === "sm" ? "w-full dt:w-auto" : size === "lg" ? "w-[160px] dt:w-[175px]" : "w-full",
      selected ? "outline outline-2 outline-offset-4 outline-[var(--accent)]" : "",
      disabled ? "brightness-[0.45]" : "transition-transform duration-200 hover:scale-[1.05]",
      className,
    ].join(" ");

    const stackedBody = (
      <>
        {iconImageSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={iconImageSrc}
            alt=""
            className={`${STACKED_ICON_SIZE[size]} drop-shadow-[0_8px_20px_rgba(0,0,0,0.35)]`}
          />
        ) : icon ? (
          <Icon
            name={icon}
            size={size === "sm" ? 56 : size === "lg" ? 88 : 76}
            color="var(--accent)"
            strokeWidth={1.6}
          />
        ) : null}
        <span className="flex flex-col gap-0.5">
          <span className={`block font-bold leading-tight text-text-primary ${size === "sm" ? "text-[13px]" : "text-[15px]"}`}>
            {title}
          </span>
          {subtitle ? (
            <span className="block text-[12.5px] leading-snug text-text-secondary">{subtitle}</span>
          ) : null}
          {meta ? <span className="mt-0.5 block text-[11.5px] font-semibold leading-tight text-accent">{meta}</span> : null}
        </span>
      </>
    );

    if (disabled) return <div className={stackedShell}>{stackedBody}</div>;
    if (href) {
      return (
        <Link href={href} className={`${stackedShell} no-underline`}>
          {stackedBody}
        </Link>
      );
    }
    return (
      <button type="button" onClick={onClick} className={`${stackedShell} cursor-pointer`}>
        {stackedBody}
      </button>
    );
  }

  const shell = [
    "relative block shrink-0 overflow-hidden rounded-media text-left",
    SIZE[size],
    gradientClass ?? tileGradient(index),
    // The selected ring is an outline rather than a border so it does not
    // change the card's size and shuffle the row when a filter is picked.
    selected ? "outline outline-2 outline-offset-2 outline-[var(--accent)]" : "",
    // Not-yet-open cards keep their COLOUR. `grayscale` plus 45% opacity read
    // as broken rather than as forthcoming, and on a rail where half the
    // services are coming soon it drained the whole row. The "Coming soon"
    // line under the name is what says they are not open; it does not need
    // the colour taken away as well. Still no hover lift, because there is
    // nothing to press.
    disabled ? "opacity-90" : "transition-transform duration-200 hover:scale-[1.03]",
    className,
  ].join(" ");

  const body = (
    <>
      {iconImageSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={iconImageSrc}
          alt=""
          className={`absolute right-3 top-3 drop-shadow-[0_6px_16px_rgba(0,0,0,0.45)] ${size === "sm" ? "h-9 w-9" : "h-12 w-12"}`}
        />
      ) : icon ? (
        <span className="absolute -bottom-4 -right-4 opacity-25">
          <Icon name={icon} size={size === "sm" ? 70 : 110} color="var(--text-on-accent)" strokeWidth={1.2} />
        </span>
      ) : null}
      {/*
        The scrim is what makes white text legible on a light gradient. It is
        anchored to the bottom rather than covering the card so the colour
        still reads as the card's own.
      */}
      <span className="absolute inset-x-0 bottom-0 bg-[linear-gradient(0deg,rgba(11,10,13,0.82),transparent)] px-[14px] pb-[11px] pt-[26px]">
        <span className={`block font-bold leading-tight text-white ${size === "sm" ? "text-[13px]" : "text-[15px]"}`}>
          {title}
        </span>
        {subtitle ? (
          <span className="mt-0.5 block truncate text-[11.5px] leading-tight text-[rgba(255,255,255,0.74)]">
            {subtitle}
          </span>
        ) : null}
        {meta ? (
          <span className="mt-0.5 block text-[11.5px] font-semibold leading-tight text-white">{meta}</span>
        ) : null}
      </span>
    </>
  );

  if (disabled) return <div className={shell}>{body}</div>;
  if (href) {
    return (
      <Link href={href} className={`${shell} no-underline`}>
        {body}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={`${shell} cursor-pointer border-0 p-0`}>
      {body}
    </button>
  );
}
