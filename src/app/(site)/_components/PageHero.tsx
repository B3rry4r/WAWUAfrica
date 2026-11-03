import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Wrap } from "./Wrap";

/**
 * The top of every inner page: a deep purple (or, for VOICES, deep green)
 * panel with the page's one h1. `aside` is the picture on the right on a wide
 * screen and sits under the text on a phone.
 */
export function PageHero({
  eyebrow,
  title,
  sub,
  tone = "purple",
  children,
  aside,
  className,
}: {
  eyebrow: string;
  title: ReactNode;
  sub?: ReactNode;
  tone?: "purple" | "green";
  children?: ReactNode;
  aside?: ReactNode;
  className?: string;
}) {
  const green = tone === "green";
  return (
    <section className={cn("on-dark relative isolate overflow-hidden text-white", green ? "bg-site-green-deep" : "bg-site-deep", className)}>
      {green ? (
        <>
          <div aria-hidden="true" className="site-bars pointer-events-none absolute inset-y-0 right-0 -z-10 w-3/5 opacity-60 [mask-image:linear-gradient(90deg,transparent,black)]" />
          <div aria-hidden="true" className="site-glow pointer-events-none absolute -right-40 -top-40 -z-10 h-[620px] w-[620px] rounded-full bg-site-green opacity-30 blur-3xl" />
        </>
      ) : (
        <div aria-hidden="true" className="site-hero-gradient pointer-events-none absolute inset-0 -z-10" />
      )}
      <Wrap className={cn("grid items-center gap-12 pb-16 pt-14 sm:pb-20 sm:pt-20 lg:pb-24 lg:pt-24", aside ? "lg:grid-cols-[1.15fr_0.85fr] lg:gap-8" : null)}>
        <div className="min-w-0">
          <p className={cn("site-rise m-0 mb-5 text-[13px] font-bold uppercase tracking-[0.16em]", green ? "text-site-mint" : "text-site-lilac")}>{eyebrow}</p>
          <h1 className="site-rise site-rise-2 m-0 text-[clamp(3.2rem,11vw,7.25rem)] font-extrabold leading-[0.92] tracking-[-0.045em]">{title}</h1>
          {sub ? (
            <p className={cn("site-rise site-rise-3 mb-0 mt-7 max-w-[40ch] text-[clamp(1.1rem,2.4vw,1.4rem)] leading-snug", green ? "text-white/90" : "text-white/85")}>{sub}</p>
          ) : null}
          {children ? <div className="site-rise site-rise-4 mt-9 flex flex-wrap items-center gap-3">{children}</div> : null}
        </div>
        {aside ? <div className="site-rise site-rise-3 min-w-0">{aside}</div> : null}
      </Wrap>
    </section>
  );
}
