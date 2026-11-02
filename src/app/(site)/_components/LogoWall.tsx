import Image from "next/image";
import { cn } from "@/lib/cn";
import { PARTNERS } from "@/lib/site/partners";

/**
 * The partner logos: one white tile each, so the logos that came on white
 * backgrounds sit on white, with every logo drawn at about the same visual
 * weight (sizes in src/lib/site/partners.ts). Grey and quiet until the
 * pointer is over a tile on a device that has one; on a phone they stay in
 * colour. `compact` is the smaller strip on the home page.
 */
export function LogoWall({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <ul className={cn("m-0 flex list-none flex-wrap justify-center gap-3 p-0 sm:gap-4", className)}>
      {PARTNERS.map((partner) => (
        <li
          key={partner.slug}
          className={cn(
            "site-logo-tile grid place-items-center rounded-[20px] border border-site-line bg-white transition duration-200 hover:-translate-y-0.5 hover:border-site-purple hover:shadow-site-logo motion-reduce:transition-none motion-reduce:hover:translate-y-0",
            compact
              ? "h-[88px] w-[calc(50%-6px)] px-4 sm:h-[96px] sm:w-[calc(33.333%-11px)] md:w-[calc(25%-12px)] lg:w-[calc(14.2857%-14px)]"
              : "h-[112px] w-[calc(50%-6px)] px-5 sm:h-[124px] sm:w-[calc(33.333%-11px)] lg:w-[calc(25%-12px)]",
          )}
        >
          <Image
            src={partner.src}
            alt={partner.name}
            width={partner.width}
            height={partner.height}
            unoptimized
            className={cn("site-logo-img h-auto max-w-full", compact && "scale-[0.85]")}
          />
        </li>
      ))}
    </ul>
  );
}
