import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** An h2 with an optional eyebrow and lead. `tone` is the surface it sits on. */
export function SectionHead({
  eyebrow,
  title,
  lead,
  tone = "light",
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  lead?: ReactNode;
  tone?: "light" | "dark";
  className?: string;
}) {
  const dark = tone === "dark";
  return (
    <div className={cn("max-w-[760px]", className)}>
      {eyebrow ? (
        <p className={cn("m-0 mb-4 text-[13px] font-bold uppercase tracking-[0.16em]", dark ? "text-site-lilac" : "text-site-purple")}>{eyebrow}</p>
      ) : null}
      <h2 className={cn("m-0 text-[clamp(2.2rem,5.6vw,3.9rem)] font-extrabold leading-[0.98] tracking-[-0.04em]", dark ? "text-white" : "text-site-deep")}>{title}</h2>
      {lead ? <p className={cn("mb-0 mt-5 max-w-[56ch] text-[clamp(1.05rem,2vw,1.2rem)] leading-relaxed", dark ? "text-white/80" : "text-site-mute")}>{lead}</p> : null}
    </div>
  );
}
