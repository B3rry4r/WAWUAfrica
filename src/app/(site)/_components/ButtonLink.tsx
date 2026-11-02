import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { ArrowIcon } from "./Icons";

export type ButtonVariant = "white" | "purple" | "green" | "outline-light" | "outline-dark";

const VARIANT: Record<ButtonVariant, string> = {
  white: "bg-white text-site-deep hover:bg-site-lilac on-dark",
  purple: "bg-site-purple text-white hover:bg-site-purple-hover",
  green: "bg-white text-site-green-deep hover:bg-site-mint on-dark",
  "outline-light": "border-2 border-white/45 text-white hover:border-white hover:bg-white/10 on-dark",
  "outline-dark": "border-2 border-site-deep text-site-deep hover:bg-site-deep hover:text-white",
};

/**
 * A pill link. Internal paths use next/link; mailto:, https: and downloads use
 * a plain anchor. `arrow` draws the arrow that slides on hover.
 */
export function ButtonLink({
  href,
  children,
  variant = "purple",
  arrow = false,
  download = false,
  external = false,
  className,
  ariaLabel,
}: {
  href: string;
  children: ReactNode;
  variant?: ButtonVariant;
  arrow?: boolean;
  download?: boolean;
  external?: boolean;
  className?: string;
  ariaLabel?: string;
}) {
  const classes = cn(
    "group/btn inline-flex min-h-[52px] items-center justify-center gap-2.5 rounded-full px-7 text-[16px] font-bold tracking-[-0.01em]",
    "transition duration-200 hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0",
    VARIANT[variant],
    className,
  );
  const inner = (
    <>
      {children}
      {arrow ? <ArrowIcon className="h-[18px] w-[18px] transition-transform duration-200 group-hover/btn:translate-x-0.5 motion-reduce:transition-none" /> : null}
    </>
  );
  if (href.startsWith("/") && !download) {
    return (
      <Link href={href} className={classes} aria-label={ariaLabel}>
        {inner}
      </Link>
    );
  }
  return (
    <a
      href={href}
      className={classes}
      aria-label={ariaLabel}
      {...(download ? { download: "" } : {})}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {inner}
    </a>
  );
}
