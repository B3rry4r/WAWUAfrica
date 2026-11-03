import Image from "next/image";
import { cn } from "@/lib/cn";
import { PARTNERS } from "@/lib/site/partners";

/**
 * How each logo is drawn: its size and its tone. Square and tall marks are set
 * by height (23 to 32 px on a phone, 30 to 32 from a tablet up). Long wordmarks
 * are set by width (64 to 68 px on a phone, 96 to 100 px from a tablet up), so
 * no logo is wider than about 100 px. The other side follows the file's shape
 * (width and height are also given on the image, so nothing moves when it loads).
 *
 * The tone: every file is first turned grey, then inverted, scaled and inverted
 * back, which leaves the white background exactly white and makes the ink of
 * every logo the same mid-dark grey (the number is that logo's own scale; Dreamax
 * is a white mark on a clear background, so it is simply dimmed to the same grey).
 */
const LOGO_LOOK: Record<string, string> = {
  "isn-hubs": "h-[23px] w-auto md:h-[30px] [filter:grayscale(1)_invert(1)_brightness(0.9)_invert(1)]",
  plli: "h-[23px] w-auto md:h-[30px] [filter:grayscale(1)_invert(1)_brightness(0.85)_invert(1)]",
  "edc-pan-atlantic": "h-[23px] w-auto md:h-[30px] [filter:grayscale(1)_invert(1)_brightness(1.0)_invert(1)]",
  dbn: "h-[25px] w-auto md:h-[32px] [filter:grayscale(1)_invert(1)_brightness(1.55)_invert(1)]",
  "learning-curve": "h-[25px] w-auto md:h-[32px] [filter:grayscale(1)_invert(1)_brightness(0.95)_invert(1)]",
  soueast: "h-auto w-[68px] md:w-[100px] [filter:grayscale(1)_invert(1)_brightness(0.75)_invert(1)]",
  canva: "h-[23px] w-auto md:h-[30px] [filter:grayscale(1)_invert(1)_brightness(1.2)_invert(1)]",
  "africa-trade-gateway": "h-[23px] w-auto md:h-[30px] [filter:grayscale(1)_invert(1)_brightness(1.75)_invert(1)]",
  fmyd: "h-[25px] w-auto md:h-[32px] [filter:grayscale(1)_invert(1)_brightness(1.1)_invert(1)]",
  pencom: "h-[25px] w-auto md:h-[32px] [filter:grayscale(1)_invert(1)_brightness(1.4)_invert(1)]",
  nuvion: "h-auto w-[64px] md:w-[96px] [filter:grayscale(1)_invert(1)_brightness(0.7)_invert(1)]",
  dreamax: "h-auto w-[64px] md:w-[96px] [filter:grayscale(1)_brightness(0.38)]",
  alison: "h-[23px] w-auto md:h-[30px] [filter:grayscale(1)_invert(1)_brightness(1.1)_invert(1)]",
};

function Logos({ hidden = false }: { hidden?: boolean }) {
  return (
    <ul
      aria-hidden={hidden || undefined}
      className={cn(
        "m-0 flex shrink-0 list-none items-center gap-x-8 p-0 pr-8 md:gap-x-14 md:pr-14",
        hidden && "motion-reduce:hidden",
      )}
    >
      {PARTNERS.map((partner) => (
        <li key={partner.slug} className="flex shrink-0 items-center">
          <Image
            src={partner.src}
            alt={hidden ? "" : partner.name}
            width={partner.width}
            height={partner.height}
            unoptimized
            className={cn(
              "max-w-none mix-blend-multiply",
              LOGO_LOOK[partner.slug],
            )}
          />
        </li>
      ))}
    </ul>
  );
}

/**
 * The partner logos in one row that slides on its own, in black and white
 * (every device, no colour on hover), each on the section's own background.
 * The list is drawn twice and the track moves by exactly one copy, so the loop
 * has no seam (site.css, .site-logo-track). It pauses while the pointer is over
 * it or a logo has focus. With "reduce motion" on it does not move: the second
 * copy goes away and the row is a plain strip that scrolls sideways.
 * `compact` is kept for the home page's call and changes nothing: both places
 * draw the same slider.
 */
export function LogoWall({ className }: { compact?: boolean; className?: string }) {
  return (
    <div
      role="region"
      aria-label="Our partners"
      tabIndex={0}
      className={cn("site-logo-wall", className)}
    >
      {/* The mask is on this inner strip, so it never clips the focus ring on the outer wrapper. */}
      <div tabIndex={-1} className="site-logo-strip overflow-x-hidden motion-reduce:overflow-x-auto motion-reduce:[scrollbar-width:thin]">
        <div className="site-logo-track flex w-max items-center py-2">
          <Logos />
          <Logos hidden />
        </div>
      </div>
    </div>
  );
}
