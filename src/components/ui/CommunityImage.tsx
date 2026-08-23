import { Icon, type IconName } from "./Icon";

export interface CommunityImageProps {
  /** The room's picture. Null/absent falls back to the placeholder glyph. */
  src?: string | null;
  /** Placeholder glyph when there is no picture. */
  icon?: IconName;
  iconSize?: number;
  /**
   * Box classes — size, radius, border, background. Tokens only. Kept as a
   * prop rather than a size enum because the rooms list, the thread header,
   * the hosting rail and the join gate each already have their own approved
   * tile dimensions from the design; this component changes what goes INSIDE
   * the tile, not the tile itself.
   */
  className?: string;
}

/**
 * A community's picture, with the striped placeholder tile as the fallback.
 *
 * Communities had no image field at all, so every room everywhere rendered as
 * a grey tile with a generic `Users` glyph — on a platform whose categories
 * are fashion, food, crafts, art and beauty. The placeholder is still exactly
 * what a room without a picture gets; this only fills it in when there is one.
 *
 * `alt=""` because every caller renders the room's name right beside the
 * tile: announcing the name twice is worse than not announcing the picture.
 */
export function CommunityImage({ src, icon = "Users", iconSize = 19, className = "" }: CommunityImageProps) {
  return (
    <span className={`grid shrink-0 place-items-center overflow-hidden ${className}`}>
      {src ? (
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : (
        <Icon name={icon} size={iconSize} color="var(--accent)" strokeWidth={2} />
      )}
    </span>
  );
}
