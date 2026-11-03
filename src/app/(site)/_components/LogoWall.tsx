import Image from "next/image";
import { cn } from "@/lib/cn";
import { PARTNERS } from "@/lib/site/partners";

/**
 * On a phone the wall is two tiles to a row. A `wide` logo takes the whole
 * row, and so does a tile that would be left alone beside one, so a row is
 * never half empty. From a tablet up every tile is the same width and the
 * last row is centred.
 */
function phoneRowSpans(): boolean[] {
  const full = PARTNERS.map((p) => p.wide === true);
  let column = 0;
  PARTNERS.forEach((_, i) => {
    if (full[i]) {
      if (column === 1) full[i - 1] = true;
      column = 0;
    } else {
      column = (column + 1) % 2;
    }
  });
  if (column === 1) full[PARTNERS.length - 1] = true;
  return full;
}

/**
 * The partner logos, each in its own colours, as supplied, on one tile each:
 * white for the logos that came on white, black for Dreamax, whose logo is
 * white on black. Every logo is drawn at about the same visual weight (sizes in
 * src/lib/site/partners.ts). `compact` is the shorter strip on the home page.
 */
export function LogoWall({ compact = false, className }: { compact?: boolean; className?: string }) {
  const full = phoneRowSpans();
  return (
    <ul className={cn("m-0 flex list-none flex-wrap justify-center gap-3 p-0 sm:gap-4", className)}>
      {PARTNERS.map((partner, i) => (
        <li
          key={partner.slug}
          className={cn(
            "site-logo-tile grid place-items-center rounded-[22px] border transition duration-200 hover:-translate-y-0.5 hover:shadow-site-logo motion-reduce:transition-none motion-reduce:hover:translate-y-0",
            partner.tile === "black" ? "border-black bg-black" : "border-site-line bg-white hover:border-site-purple",
            full[i] ? "w-full md:w-[calc(33.333%-11px)]" : "w-[calc(50%-6px)] md:w-[calc(33.333%-11px)]",
            compact
              ? "h-[120px] px-3 lg:w-[calc(20%-13px)]"
              : "h-[140px] px-5 lg:w-[calc(25%-12px)]",
          )}
        >
          <Image
            src={partner.src}
            alt={partner.name}
            width={partner.width}
            height={partner.height}
            unoptimized
            className="h-auto max-w-full"
          />
        </li>
      ))}
    </ul>
  );
}
