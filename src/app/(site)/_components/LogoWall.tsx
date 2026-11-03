import Image from "next/image";
import { cn } from "@/lib/cn";
import { PARTNERS } from "@/lib/site/partners";

/**
 * How tall each logo is drawn: first the phone height, then the height from a
 * tablet up. Square and tall marks are 23 to 32 px, long wordmarks are kept
 * lower so every logo carries about the same visual weight. The width follows
 * from the file's own shape (width and height are also given on the image, so
 * nothing moves when it loads).
 */
const LOGO_HEIGHT: Record<string, string> = {
  "isn-hubs": "h-[23px] md:h-[30px]",
  plli: "h-[23px] md:h-[30px]",
  "edc-pan-atlantic": "h-[23px] md:h-[30px]",
  dbn: "h-[25px] md:h-[32px]",
  "learning-curve": "h-[25px] md:h-[32px]",
  soueast: "h-[10px] md:h-[12px]",
  canva: "h-[23px] md:h-[30px]",
  flixora: "h-[14px] md:h-[18px]",
  "africa-trade-gateway": "h-[23px] md:h-[30px]",
  fmyd: "h-[25px] md:h-[32px]",
  pencom: "h-[25px] md:h-[32px]",
  nuvion: "h-[14px] md:h-[18px]",
  dreamax: "h-[14px] md:h-[18px]",
  alison: "h-[23px] md:h-[30px]",
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
              "w-auto max-w-none mix-blend-multiply grayscale contrast-[1.5]",
              // Dreamax's file is the white mark on a clear background: drawn solid black on the light section
              partner.tile === "black" && "brightness-0",
              LOGO_HEIGHT[partner.slug],
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
      className={cn(
        "site-logo-strip overflow-x-hidden motion-reduce:overflow-x-auto motion-reduce:[scrollbar-width:thin]",
        className,
      )}
    >
      <div className="site-logo-track flex w-max items-center py-2">
        <Logos />
        <Logos hidden />
      </div>
    </div>
  );
}
