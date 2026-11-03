import { WMT_SCREENS, ScreenTile, type ScreenId } from "./ScreenTile";

const ORDER: ScreenId[] = ["dollar", "explore", "creator", "unlock"];

/**
 * The four screens in a row. On a phone the row scrolls sideways (it can be
 * focused and scrolled with the arrow keys); from a tablet up all four fit.
 */
export function ScreenGallery() {
  return (
    <div
      role="region"
      aria-label="Screens from WHO MADE THIS?"
      tabIndex={0}
      className="-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-6 sm:-mx-8 sm:px-8 md:mx-0 md:grid md:grid-cols-4 md:gap-4 md:overflow-visible md:px-0 lg:gap-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {ORDER.map((id) => (
        <figure key={id} className="m-0 w-[68%] shrink-0 snap-center sm:w-[44%] md:w-auto">
          {/* One frame for all four: the phone from the top, the bottom fading out (two are cut off in the original pictures). */}
          <div className="site-shot site-frame relative aspect-[574/1013] w-full">
            <div className="site-fade absolute inset-0 overflow-hidden">
              <ScreenTile
                id={id}
                sizes="(min-width: 1200px) 270px, (min-width: 768px) 22vw, 68vw"
                className="absolute inset-x-0 top-0 !filter-none"
              />
            </div>
          </div>
          <figcaption className="mt-4 text-[14.5px] leading-snug text-site-mute">{WMT_SCREENS[id].caption}</figcaption>
        </figure>
      ))}
    </div>
  );
}
