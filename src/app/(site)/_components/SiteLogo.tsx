import Image from "next/image";
import { cn } from "@/lib/cn";

/**
 * The WAWU wordmark from the owner's logo pack (the smiling W and the word).
 * "white" is for the deep purple header and footer; "colour" for light
 * surfaces. Both files are 4.36 : 1.
 */
export function SiteLogo({
  tone = "white",
  className,
  priority = false,
}: {
  tone?: "white" | "colour" | "purple";
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={`/wawu-brand-wordmark-${tone}.svg`}
      alt="WAWU"
      width={629}
      height={144}
      priority={priority}
      className={cn("h-auto w-[118px]", className)}
    />
  );
}
