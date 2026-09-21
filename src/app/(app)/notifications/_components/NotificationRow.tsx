"use client";

import Link from "next/link";
import { Icon } from "@/components/ui";
import { formatNaira, formatCredits } from "@/lib/format";
import type { AppNotification } from "@/types/notification";
import {
  actionHrefFor,
  ctaClassFor,
  timeLabelFor,
  toneBorderClass,
  toneIcon,
  toneIconClass,
} from "./kinds";

/**
 * The compact notification: the shape every transactional kind takes, because
 * a sale, a refund and a follow have no picture and inventing one would be a
 * stock photograph chosen to fill a frame.
 *
 * Two changes from the row this replaces, both from build brief A5:
 *
 *  - the whole row is now the link. It used to be a div with a small button
 *    inside it, so the target was a 32px control in a 90px card and the rest
 *    of the row did nothing when tapped;
 *  - unread is an elevated surface plus a dot, not `bg-accent-tint`. On a
 *    list where most rows are money, tinting every unread one purple painted
 *    the screen in brand colour and left nothing for emphasis to mean.
 */
export function NotificationRow({
  notification: n,
  onOpen,
}: {
  notification: AppNotification;
  /** Fired before navigation so the unread dot is cleared by a real write. */
  onOpen?: (id: string) => void;
}) {
  return (
    <Link
      href={actionHrefFor(n)}
      onClick={() => onOpen?.(n.id)}
      className={`flex gap-3 rounded-card border px-4 py-3.5 no-underline transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-page)] ${
        n.read
          ? `${toneBorderClass[n.tone]} bg-card`
          : `${n.tone === "danger" ? "border-danger" : "border-strong"} bg-elevated`
      } hover:border-strong`}
    >
      <span
        className={`grid h-[38px] w-[38px] shrink-0 place-items-center rounded-full border border-hairline bg-tag ${toneIconClass[n.tone]}`}
      >
        <Icon name={toneIcon[n.tone]} size={17} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex items-start gap-2">
          <span className="min-w-0 flex-1 text-[14.5px] font-semibold leading-snug text-text-primary">
            {n.title}
          </span>
          {!n.read ? (
            <span className="mt-[5px] h-[7px] w-[7px] shrink-0 rounded-full bg-accent" aria-label="Unread" />
          ) : null}
        </span>
        {n.amount != null ? (
          <span className="text-[13px] font-semibold text-accent [font-feature-settings:var(--font-feature-tabular)]">
            {formatNaira(n.amount)}
          </span>
        ) : null}
        {/* WAWU Credits are a COUNT. Never a naira value, never cashable. */}
        {n.creditsCount != null ? (
          <span className="text-[13px] font-semibold text-warning">{formatCredits(n.creditsCount)}</span>
        ) : null}
        <span className="text-[13px] leading-relaxed text-text-secondary">{n.body}</span>
        <span className="mt-[2px] flex items-center justify-between gap-3">
          <span className="text-[11.5px] text-text-muted [font-feature-settings:var(--font-feature-tabular)]">
            {timeLabelFor(n.createdAt)}
          </span>
          {n.actionLabel ? (
            <span
              className={`inline-flex h-[32px] shrink-0 items-center rounded-button px-3.5 text-[12.5px] font-semibold transition-colors ${ctaClassFor(n)}`}
            >
              {n.actionLabel}
            </span>
          ) : null}
        </span>
      </span>
    </Link>
  );
}
