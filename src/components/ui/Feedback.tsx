/**
 * Historical import path.
 *
 * This file used to define its OWN EmptyState, ErrorState and Skeleton —
 * second copies of the components in this same folder, which CLAUDE.md forbids
 * ("Never fork a component. If a screen needs a variant, add a prop"). The
 * forks were not harmless: this ErrorState defaulted its description to
 * "We could not load this right now. Check your connection and try again.",
 * so every screen that rendered it without a description told the user their
 * connection had failed — including the Earnings screen, where the real answer
 * was a 403 from the server explaining that the account was not a creator.
 *
 * EmptyState and ErrorState now re-export the real ones, whose props were
 * widened to accept this file's names (`description`, a ReactNode `action`, an
 * optional `icon`) so the call sites did not have to change.
 *
 * Skeleton is still defined here: it takes runtime pixel dimensions, while the
 * canonical one takes named variants, and merging them is a mechanical change
 * across ~25 call sites that is not worth bundling into a bug fix. Tracked in
 * TASKS.md.
 */
export { EmptyState, type EmptyStateProps } from "./EmptyState";
export { ErrorState, type ErrorStateProps } from "./ErrorState";

export interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  radius?: number | string;
  circle?: boolean;
}

export function Skeleton({ width = "100%", height = 14, radius = 8, circle = false }: SkeletonProps) {
  return (
    <div
      className="bg-[linear-gradient(110deg,_var(--surface-tag)_25%,_var(--surface-elevated)_50%,_var(--surface-tag)_75%)] shrink-0 [background-size:200%_100%] [animation:wawuShimmer_1.6s_ease-in-out_infinite]"
      // Runtime pixel geometry, so Tailwind's JIT cannot see these values as
      // class names. `width`/`height` were destructured but never applied, so
      // every skeleton collapsed to 0px (and `shrink-0` kept it there in a
      // flex column) — 25 call sites rendered a blank screen while loading.
      style={{
        width: circle ? height : width,
        height,
        borderRadius: circle ? "50%" : radius,
      }}
    />
  );
}
