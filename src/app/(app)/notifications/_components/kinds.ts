import type { IconName } from "@/components/ui";
import type { AppNotification, NotificationKind, NotificationTone } from "@/types/notification";

export const toneIcon: Record<NotificationTone, IconName> = {
  danger: "AlertCircle",
  accent: "TrendingUp",
  success: "CheckCircle2",
  warning: "AlertTriangle",
  info: "Info",
  neutral: "Bell",
};

export const toneIconClass: Record<NotificationTone, string> = {
  danger: "text-danger",
  accent: "text-accent",
  success: "text-success",
  warning: "text-warning",
  info: "text-info",
  neutral: "text-text-muted",
};

/**
 * The icon in the badge on a picture-led card. Keyed by KIND, not tone,
 * because on a rich card the badge says what this is ("Announcement") rather
 * than how urgent it is: the picture already carries the weight.
 */
export const kindIcon: Partial<Record<NotificationKind, IconName>> = {
  campaign: "Megaphone",
  verify_reminder: "BadgeCheck",
};

/** The word on the badge. Only the two composed kinds get one. */
export const kindLabel: Partial<Record<NotificationKind, string>> = {
  campaign: "Announcement",
  verify_reminder: "Verification",
};

/**
 * Card borders, corrected against build brief A5 ("purple is an accent, not a
 * wash").
 *
 * This used to tint the border by tone: a purple border on every sale, paid
 * DM and tip, an amber one on every credits warning. On a list where most
 * rows are money that painted the whole screen in brand colour and left
 * nothing for emphasis to mean. Now the hairline is the default and only the
 * one semantic case that must not be missed keeps a coloured edge: red for
 * money about to be lost. Amber, green and purple say their piece through
 * the icon instead.
 */
export const toneBorderClass: Record<NotificationTone, string> = {
  danger: "border-danger",
  accent: "border-hairline",
  success: "border-hairline",
  warning: "border-hairline",
  info: "border-hairline",
  neutral: "border-hairline",
};

/**
 * Where a notification goes when it is opened.
 *
 * Two rules, in order:
 *
 *  1. `actionHref` wins when the server sent one. Only the admin-composed
 *     kinds carry it, and it was validated server-side against a fixed
 *     allowlist of in-app routes (see the backend's campaign-destination.ts),
 *     so it is never an arbitrary URL.
 *  2. Everything else routes by `kind`. Where "your paid DM expires in an
 *     hour" goes is a property of the event, not something a composer should
 *     be able to retarget, so those destinations live in code.
 *
 * The action buttons were read-only decoration before this existed (confirmed
 * live: clicking "View earnings" on a real sale notification did nothing).
 */
export function actionHrefFor(n: AppNotification): string {
  if (n.actionHref) return n.actionHref;

  switch (n.kind) {
    case "dm_deadline":
    case "dm_received":
    case "dm_refunded":
      return "/messages";
    case "sale":
    case "tip_received":
      return "/earnings";
    case "credits_low":
      return "/communities?topup=1";
    case "content_published":
    case "content_rejected":
      return "/create/library";
    // KYC is the creator EARNING gate (BVN/NIN, ID document, payout bank) and
    // it lives at /kyc. /profile/verification is where the two paid ticks
    // are bought — a different system, different endpoints — so
    // this sent every "your payout verification changed" notification to a
    // screen that says nothing about KYC at all.
    case "kyc_verified":
      return "/kyc";
    case "verify_reminder":
      return "/profile/verification";
    // The decision on opening a wallet: the page reads where the person stands
    // (approved, refused with what to fix, stopped) and shows exactly that.
    case "identity_review":
      return "/wallet/open";
    default:
      return "/notifications";
  }
}

/**
 * The one CTA per screen that is allowed to be filled purple.
 *
 * Brief A5: "let one thing per screen be the emphatic thing". A paid DM about
 * to expire is money the creator loses if they do nothing, and it is the only
 * notification in this product with a clock on it. Everything else, including
 * the verification prompt, takes a white or neutral button — A5 says a white
 * primary on dark is correct and should be used where it serves hierarchy.
 */
export function ctaClassFor(n: AppNotification): string {
  if (n.kind === "dm_deadline") {
    return "bg-accent text-on-accent hover:bg-accent-hover active:bg-accent-press";
  }
  if (n.kind === "verify_reminder") {
    return "bg-text-primary text-page hover:bg-text-secondary active:bg-text-muted";
  }
  return "border border-hairline bg-tag text-text-secondary hover:bg-surface-hover active:bg-surface-press";
}

/** "2:14 pm" for today, "11 Sep" for anything older. */
export function timeLabelFor(createdAt: string): string {
  const time = new Date(createdAt);
  const sameDay =
    time.toLocaleDateString("en-NG", { day: "numeric", month: "short" }) ===
    new Date().toLocaleDateString("en-NG", { day: "numeric", month: "short" });
  return sameDay
    ? time.toLocaleTimeString("en-NG", { hour: "numeric", minute: "2-digit" })
    : time.toLocaleDateString("en-NG", { day: "numeric", month: "short" });
}
