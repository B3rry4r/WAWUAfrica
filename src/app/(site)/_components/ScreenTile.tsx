import Image from "next/image";
import { cn } from "@/lib/cn";

export type ScreenId = "today" | "wallet" | "dollar" | "explore" | "me" | "creator" | "unlock";

/**
 * The WHO MADE THIS? screens on the site. Five are the owner's own phone screenshots (3 Nov 2026), and
 * `creator` (Zainab Bello) and `unlock` (the paid PDF) are the two older ones he kept. Each file is cut to
 * the phone with transparent corners, so it stands on the section's own background.
 */
export const WMT_SCREENS: Record<ScreenId, { alt: string; caption: string; width: number; height: number }> = {
  today: { alt: "The Today screen in WHO MADE THIS?: a naira wallet with Send, Add and Scan, and shortcuts to Studio, Learn, Monetize and Legal.", caption: "Today: your wallet and everything you can do next.", width: 720, height: 1560 },
  wallet: { alt: "The Wallet screen in WHO MADE THIS? on the Naira tab: a naira balance with account number, points, passes, and shortcuts to add money, send, withdraw and more.", caption: "Wallet: your naira balance, and what to do with it.", width: 720, height: 1560 },
  dollar: { alt: "The Wallet screen in WHO MADE THIS? on its second tab: a balance with Send and Add buttons, a Get paid from abroad card and the latest transactions.", caption: "Wallet: get paid from abroad, and see every transaction.", width: 720, height: 1560 },
  explore: { alt: "The Explore screen in WHO MADE THIS?: a featured event, the daily TGIF card, categories and creators to follow.", caption: "Explore: find creators, events and work.", width: 720, height: 1560 },
  me: { alt: "A creator profile in WHO MADE THIS?: a photo, a bio, followers and following, and the creator's content.", caption: "Your profile: your work, your name.", width: 720, height: 1560 },
  creator: { alt: "A creator card in WHO MADE THIS?: followers, posts and rating, with a Follow button.", caption: "Follow the people whose work you like.", width: 574, height: 1013 },
  unlock: { alt: "A paid PDF in WHO MADE THIS?: a preview of the cover, the price in naira and an Unlock button.", caption: "Unlock paid work: preview first, then pay from your wallet.", width: 583, height: 1019 },
};

/**
 * One app screen, as the phone alone: no tile, panel or colour behind it. The
 * soft shadow follows the phone's own rounded outline.
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
      width={WMT_SCREENS[id].width}
      height={WMT_SCREENS[id].height}
      sizes={sizes}
      priority={priority}
      className={cn("site-shot h-auto w-full", className)}
    />
  );
}
