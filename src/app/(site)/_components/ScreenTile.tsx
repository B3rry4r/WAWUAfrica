import Image from "next/image";
import { cn } from "@/lib/cn";

export type ScreenId = "home" | "profile" | "feed" | "creator" | "unlock";

/** The five WHO MADE THIS? screens the owner approved for the web (the store pictures, cropped to the phone). */
export const WMT_SCREENS: Record<ScreenId, { alt: string; caption: string }> = {
  home: { alt: "The Today screen in WHO MADE THIS?: a naira wallet with Send, Add and Scan, and shortcuts to Studio, Learn, Monetize and Legal.", caption: "Today: your wallet and everything you can do next." },
  profile: { alt: "A creator profile in WHO MADE THIS?: a verified name, a voice bio, social links and a grid of content.", caption: "Your profile: your name on all of your work." },
  feed: { alt: "The For you feed in WHO MADE THIS?: a photo post with like, comment, save and tip buttons.", caption: "For you: work from creators, in photos, video and audio." },
  creator: { alt: "A creator card in WHO MADE THIS?: followers, posts and rating, with a Follow button.", caption: "Follow the people whose work you like." },
  unlock: { alt: "A paid PDF in WHO MADE THIS?: a preview of the cover, the price in naira and an Unlock button.", caption: "Unlock paid work: preview first, then pay from your wallet." },
};

/**
 * One app screen in a rounded tile. The pictures are the owner's store
 * screenshots cropped to the phone, so the tile takes the picture's own
 * background (white or purple).
 */
export function ScreenTile({
  id,
  className,
  sizes,
  priority = false,
}: {
  id: ScreenId;
  className?: string;
  sizes: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={`/wawu-wmt-screen-${id}.webp`}
      alt={WMT_SCREENS[id].alt}
      width={700}
      height={1064}
      sizes={sizes}
      priority={priority}
      className={cn("h-auto w-full rounded-[28px] shadow-site-screen", className)}
    />
  );
}
