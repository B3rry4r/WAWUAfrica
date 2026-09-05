"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { creatorGates } from "@/lib/auth/gates";
import { useCreatorState } from "@/lib/auth/use-creator-state";
import { Icon } from "@/components/ui/Icon";

/**
 * Create, as a floating action button.
 *
 * Create used to occupy bottom-bar slot 3, which meant a creator had no way
 * into Explore at all — becoming a creator silently cost you a nav
 * destination. On the product owner's instruction Explore now stays in the bar
 * for everyone and Create floats above it, for creators only.
 *
 * Renders NOTHING until creator state resolves. Flashing a Create button at
 * someone who turns out not to be a creator is the same class of bug as the
 * "Become a creator" flash shown to people who had already paid — see
 * useCreatorState's `resolved`.
 */

/** Routes where a floating button would sit on top of the thing you are using. */
const HIDDEN_ON = [
  "/create",
  "/messages/", // an open thread has its own composer at the bottom
  "/communities/", // so does a room
];

/**
 * Is the Create button on screen right now?
 *
 * Exported because the sound button stacks on top of this one and has to know
 * whether there is anything under it. Two floating buttons deciding
 * separately where the other one is would drift apart the first time these
 * rules changed.
 */
export function useCreateFabShown(): boolean {
  const { creator, resolved } = useCreatorState();
  const pathname = usePathname();
  if (!resolved) return false;
  if (!creatorGates({ creator }).isCreator) return false;
  return !HIDDEN_ON.some((p) => pathname.startsWith(p));
}

export function CreateFab() {
  if (!useCreateFabShown()) return null;

  return (
    <Link
      href="/create"
      aria-label="Create"
      /* Sits above the 78px bar, clear of the safe area, and below the bar's
         z-40 stacking neighbours but above page content. */
      className="fixed bottom-[94px] right-[18px] z-40 grid h-[56px] w-[56px] place-items-center rounded-full bg-accent text-on-accent shadow-float transition-colors hover:bg-accent-hover active:bg-accent-press xl:hidden"
    >
      <Icon name="Plus" size={26} strokeWidth={2.4} />
    </Link>
  );
}
