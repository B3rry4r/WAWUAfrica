import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { ArrowIcon } from "./Icons";

export interface CardItem {
  title: string;
  body: string;
  href?: string;
  /** The link's label when `href` is set. */
  cta?: string;
  icon?: ReactNode;
}

/**
 * A row of cards (three across on a wide screen). `numbered` draws 1, 2, 3
 * badges for steps; `tone` sets the surface; `accent` is the badge colour
 * (green on the VOICES page only).
 */
export function Cards({
  items,
  numbered = false,
  tone = "light",
  accent = "purple",
  columns = 3,
  className,
}: {
  items: readonly CardItem[];
  numbered?: boolean;
  tone?: "light" | "dark";
  accent?: "purple" | "green";
  columns?: 2 | 3;
  className?: string;
}) {
  const dark = tone === "dark";
  return (
    <ul className={cn("m-0 grid list-none gap-4 p-0", columns === 3 ? "md:grid-cols-3" : "md:grid-cols-2", className)}>
      {items.map((item, index) => {
        const inner = (
          <>
            {numbered ? (
              <span
                aria-hidden="true"
                className={cn(
                  "mb-5 grid h-11 w-11 place-items-center rounded-full text-[18px] font-extrabold text-white",
                  accent === "green" ? "bg-site-green" : "bg-site-purple",
                )}
              >
                {index + 1}
              </span>
            ) : item.icon ? (
              <span
                aria-hidden="true"
                className={cn("mb-5 grid h-12 w-12 place-items-center rounded-2xl", dark ? "bg-white/10 text-site-lilac" : accent === "green" ? "bg-site-mint text-site-green-deep" : "bg-site-purple-tint text-site-purple")}
              >
                {item.icon}
              </span>
            ) : null}
            <h3 className={cn("m-0 text-[clamp(1.5rem,2.6vw,1.9rem)] font-extrabold leading-[1.05] tracking-[-0.03em]", dark ? "text-white" : "text-site-deep")}>{item.title}</h3>
            <p className={cn("mb-0 mt-3 text-[16px] leading-relaxed", dark ? "text-white/80" : "text-site-mute")}>{item.body}</p>
            {item.href ? (
              <span className={cn("mt-6 inline-flex items-center gap-2 text-[15px] font-bold", dark ? "text-site-lilac" : "text-site-purple")}>
                {item.cta ?? "Read more"}
                <ArrowIcon className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transition-none" />
              </span>
            ) : null}
          </>
        );
        const card = cn(
          "group flex h-full flex-col rounded-[28px] border-2 p-7 transition duration-200 motion-reduce:transition-none sm:p-8",
          dark ? "border-white/15 bg-white/[0.06]" : "border-site-line bg-white",
          item.href && (dark ? "hover:-translate-y-1 hover:border-site-lilac" : "hover:-translate-y-1 hover:border-site-purple"),
        );
        return (
          <li key={item.title}>
            {item.href ? (
              <Link href={item.href} className={cn(card, dark && "on-dark")}>
                {inner}
              </Link>
            ) : (
              <div className={card}>{inner}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
