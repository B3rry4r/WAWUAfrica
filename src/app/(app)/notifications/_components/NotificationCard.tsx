"use client";

import Link from "next/link";
import { Icon } from "@/components/ui";
import type { AppNotification } from "@/types/notification";
import { actionHrefFor, ctaClassFor, kindIcon, kindLabel, timeLabelFor } from "./kinds";

/**
 * The picture-led notification (build brief C8).
 *
 * ── WHY THIS IS NOT MediaCard ────────────────────────────────────────────────
 * MediaCard is this project's picture-led card and it was the obvious
 * candidate: `variant="stacked"` is a photograph with a dark panel under it,
 * which is exactly this shape. It was read first and rejected for three
 * measurable reasons, none of which is a matter of taste:
 *
 *  1. its title is `truncate` — ONE line, clipped. At 14px bold in a 336px
 *     card that is about 32 characters, so "Airtime and data are now live on
 *     WAWU" renders as a headline with its end cut off. A notification
 *     headline that does not finish is not a notification;
 *  2. its caption is `line-clamp-2`. C8 asks for "images and detail", and two
 *     clipped lines at 390px is about 88 characters of detail;
 *  3. it has no slot for a timestamp or an unread state, which are the two
 *     things that make a notification a notification rather than a tile.
 *
 * Fitting a notification into it would have meant either forking it (never)
 * or adding props to a shared component this task is scoped read-only on. So
 * this is a different component for a different job, not a second copy of
 * that one: it shares MediaCard's visual grammar (the same radius, hairline
 * and overlay-badge positions, read from the same tokens) and none of its
 * code. Recorded in DECISIONS.md D17a.
 *
 * ── WHAT MAKES IT "EXPERIENTIAL" ─────────────────────────────────────────────
 * A 16:9 photograph the eye lands on first, a headline that is allowed to be
 * two lines, the body at full length, and one action. The whole card is the
 * link, so the target is the width of a thumb rather than a 32px button.
 */
export function NotificationCard({
  notification: n,
  onOpen,
}: {
  notification: AppNotification;
  /** Fired before navigation so the unread dot is cleared by a real write. */
  onOpen?: (id: string) => void;
}) {
  const label = kindLabel[n.kind] ?? "Update";
  const icon = kindIcon[n.kind] ?? "Bell";

  return (
    <Link
      href={actionHrefFor(n)}
      onClick={() => onOpen?.(n.id)}
      className={`group flex flex-col overflow-hidden rounded-card border no-underline transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-page)] ${
        n.read ? "border-hairline bg-card" : "border-strong bg-elevated"
      } hover:border-strong`}
    >
      <span className="relative block aspect-[16/9] w-full overflow-hidden bg-[linear-gradient(160deg,var(--accent-deep),var(--surface-elevated))]">
        {n.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={n.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : null}
        {/* The badge says WHAT this is. On a picture the tone colour would be
            fighting the photograph, so it is a neutral scrim chip. */}
        <span className="absolute left-[10px] top-[10px] inline-flex items-center gap-[5px] rounded-full bg-[var(--surface-scrim)] px-[9px] py-[4px] text-[10.5px] font-semibold uppercase tracking-[0.05em] text-white backdrop-blur-[var(--blur-chrome)]">
          <Icon name={icon} size={12} />
          {label}
        </span>
        {!n.read ? (
          <span
            className="absolute right-[10px] top-[10px] h-[9px] w-[9px] rounded-full bg-accent shadow-[var(--shadow-accent)]"
            aria-label="Unread"
          />
        ) : null}
      </span>

      <span className="flex flex-col gap-[7px] px-4 py-[14px]">
        <span className="text-[15.5px] font-semibold leading-snug tracking-[-0.01em] text-text-primary">
          {n.title}
        </span>
        <span className="text-[13px] leading-relaxed text-text-secondary">{n.body}</span>
        <span className="mt-[3px] flex items-center justify-between gap-3">
          <span className="text-[11.5px] text-text-muted [font-feature-settings:var(--font-feature-tabular)]">
            {timeLabelFor(n.createdAt)}
          </span>
          {n.actionLabel ? (
            <span
              className={`inline-flex h-[34px] shrink-0 items-center gap-[6px] rounded-button px-4 text-[12.5px] font-semibold transition-colors ${ctaClassFor(n)}`}
            >
              {n.actionLabel}
              <Icon name="ArrowRight" size={14} />
            </span>
          ) : null}
        </span>
      </span>
    </Link>
  );
}
