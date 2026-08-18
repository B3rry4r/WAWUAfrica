/**
 * Brand sticker watermarks for the landing page.
 *
 * The stickers ship in ELEMENTS.zip as loud, full-colour die-cuts (neon pink,
 * lime, cyan). Dropped in at full strength they would fight the headline, so
 * they are laid in behind the content at watermark opacity: clearly readable as
 * brand texture, but never competing with the headline for attention.
 *
 * Rules this layer obeys:
 *  - Purely decorative, so `aria-hidden` and `pointer-events-none`. Nothing
 *    here is announced to a screen reader or steals a click from the CTA.
 *  - Positioned toward the edges. The hero headline is centred, so the
 *    placements deliberately leave the middle column clear.
 *  - Most are desktop-only. On a phone the hero is nearly full-bleed text and
 *    extra marks read as noise, so only two survive the breakpoint.
 *  - `overflow-hidden` on the layer, not the section, so a sticker can sit
 *    half off the edge without adding a horizontal scrollbar.
 *  - The layer sits ABOVE the content, not behind it. Underneath, every
 *    sticker that fell where a card or stat panel landed was simply invisible,
 *    which is most of them. Above the content at watermark opacity they read
 *    as a print overlay and are never occluded. `pointer-events-none` keeps
 *    every link and button underneath fully clickable.
 */

interface Sticker {
  src: string;
  /** Position, size and rotation. Sizes are set per placement, not globally. */
  className: string;
}

const HERO: Sticker[] = [
  { src: "/stickers/oh-wow.svg", className: "-left-[6%] top-[6%] w-[86px] -rotate-[13deg] dt:left-[3%] dt:top-[15%] dt:w-[150px]" },
  { src: "/stickers/find-more.svg", className: "-right-[7%] top-[4%] w-[124px] rotate-[9deg] dt:right-[4%] dt:top-[13%] dt:w-[232px]" },
  { src: "/stickers/wow-wow-wow.svg", className: "left-[2%] top-[38%] w-[52px] rotate-[15deg] dt:left-[1.5%] dt:top-[44%] dt:w-[92px]" },
  { src: "/stickers/unlocked.svg", className: "-right-[12%] top-[36%] w-[150px] -rotate-[8deg] dt:-right-[6%] dt:top-[40%] dt:w-[280px]" },
  { src: "/stickers/much-more.svg", className: "hidden dt:block dt:bottom-[6%] dt:-left-[3%] dt:w-[150px] dt:-rotate-[18deg]" },
  { src: "/stickers/build-more.svg", className: "hidden dt:block dt:bottom-[4%] dt:-right-[4%] dt:w-[240px] dt:rotate-[6deg]" },
];

const PRICING: Sticker[] = [
  { src: "/stickers/unlocked.svg", className: "-left-[12%] top-[8%] w-[170px] rotate-[10deg] dt:left-[-3%] dt:top-[22%] dt:w-[270px]" },
  { src: "/stickers/much-more.svg", className: "-right-[8%] top-[4%] w-[104px] -rotate-[12deg] dt:right-[-1%] dt:top-[16%] dt:w-[168px]" },
];

const CTA: Sticker[] = [
  { src: "/stickers/look-again.svg", className: "-left-[9%] top-[10%] w-[130px] -rotate-[10deg] dt:left-[5%] dt:top-[18%] dt:w-[210px]" },
  { src: "/stickers/wow-wow-wow.svg", className: "-right-[4%] bottom-[12%] w-[66px] rotate-[13deg] dt:right-[7%] dt:bottom-[16%] dt:w-[116px]" },
];

const PLACEMENTS = { hero: HERO, pricing: PRICING, cta: CTA } as const;

interface StickerWatermarksProps {
  placement?: keyof typeof PLACEMENTS;
}

export function StickerWatermarks({ placement = "hero" }: StickerWatermarksProps) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-30 select-none overflow-hidden"
    >
      {PLACEMENTS[placement].map((sticker) => (
        <img
          key={`${placement}-${sticker.src}`}
          src={sticker.src}
          alt=""
          loading="lazy"
          decoding="async"
          className={`absolute h-auto opacity-[0.20] dt:opacity-[0.28] ${sticker.className}`}
        />
      ))}
    </div>
  );
}
