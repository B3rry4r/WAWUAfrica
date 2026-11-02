import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** The page column: 1200px, with a gutter that is 20px on a phone and 32px above. */
export function Wrap({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mx-auto w-full max-w-[1200px] px-5 sm:px-8", className)}>{children}</div>;
}
