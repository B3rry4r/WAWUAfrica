/**
 * Notification kinds. The design file (WAWU Notifications Search.dc.html)
 * is the source of truth: its two list screens show 11 kinds and the batch
 * header claims "Twelve kinds of news". `trial_ending` is derived from the
 * WAWU Credits trial (7 days, docs/01_SPEC.md §3) so the fan-side of the
 * credits system is covered alongside the fan-side refund.
 *
 * `subscription_renewal` (creator tier renewal/billing) was removed with
 * subscriptions: nothing renews and nothing is billed, so the notification had
 * no screen to open. A `kind` this frontend does not know still falls through
 * actionHrefFor's default rather than breaking the list.
 *
 * 1. dm_deadline            — reply before the 24h window closes (urgent, action)
 * 2. sale                   — content sold (money)
 * 3. dm_received            — paid DM received (money)
 * 4. content_published      — content approved and live
 * 5. kyc_verified           — account/payout status changed
 * 6. dm_refunded            — fan refunded, creator missed the window (money)
 * 7. credits_low            — credits balance low (a COUNT, never naira)
 * 8. content_rejected       — content not approved, slot returned
 * 9. new_follower          — new follower
 * 10. tip_received          — tip received (money)
 * 11. trial_ending          — credits trial ending/ended (count, fan-side)
 *
 * Build brief C8 adds the two kinds that are not a report of a transaction:
 * 12. campaign               — an admin-composed announcement or promotion,
 *                              fanned out from a NotificationCampaign. The one
 *                              kind whose copy a human typed, and the one that
 *                              carries an image and an admin-chosen destination.
 * 13. verify_reminder        — brief B1's recurring "you are not verified yet"
 *                              prompt. Written by the backend's
 *                              VerificationReminderService, at most once per
 *                              account per fortnight, and it stops the day the
 *                              account is verified.
 */
export type NotificationKind =
  | "dm_deadline"
  | "sale"
  | "dm_received"
  | "content_published"
  | "kyc_verified"
  | "dm_refunded"
  | "credits_low"
  | "content_rejected"
  | "new_follower"
  | "tip_received"
  | "trial_ending"
  | "campaign"
  | "verify_reminder";

export type NotificationTone = "danger" | "accent" | "success" | "warning" | "info" | "neutral";

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  tone: NotificationTone;
  /**
   * Money-bearing notifications carry an amount; everything else stays
   * quiet. Nullable on the wire (Prisma `amount Int?` serializes unset as
   * `null`, not a missing key) — callers must null-check with `!= null`,
   * not `!== undefined`.
   */
  amount?: number | null;
  /**
   * Credits always render as a COUNT via formatCredits(), never naira.
   * Nullable on the wire, same as `amount` above.
   */
  creditsCount?: number | null;
  /** Show an inline CTA (e.g. "Reply now", "Buy credits"). */
  actionLabel?: string;
  /**
   * A 16:9 picture. Set only on the kinds an admin composes; every
   * transactional kind sends `null`, and the list draws the compact row for
   * those rather than an empty frame.
   */
  imageUrl?: string | null;
  /**
   * An in-app path this notification opens, chosen by the admin who composed
   * it from a fixed server-side allowlist. Null on every transactional kind,
   * which is routed by `kind` instead (see actionHrefFor) because where "your
   * paid DM expires in an hour" goes is a property of the event, not something
   * a composer should be able to retarget.
   */
  actionHref?: string | null;
  /** Set when this row came from an admin campaign. Null otherwise. */
  campaignId?: string | null;
  read: boolean;
  createdAt: string;
}

/**
 * Real wire shape (WAWU-Hub-API's NotificationService.list, registry.json
 * response.shape "{unreadCount, items: PaginatedList<Notification>}"):
 * `items` is itself a full envelope (statusCode/message/data/pagination),
 * not a bare array -- the ResponseInterceptor only auto-wraps a top-level
 * Paginated<T> return, so the service builds this nested envelope by hand.
 * The frontend was reading `res.items` as if it were the array directly,
 * which crashed every load of /notifications.
 */
export interface NotificationsWireResponse {
  unreadCount: number;
  items: {
    statusCode: number;
    message: string;
    data: AppNotification[];
    pagination: { currentPage: number; nextPage: number | null; perPage: number; total: number };
  };
}

export interface NotificationsResponse {
  items: AppNotification[];
  unreadCount: number;
}

/* ───────────────── admin campaigns (build brief C8) ─────────────────────── */

/**
 * The segments a campaign can be sent to. Every one of these is a question
 * the backend can answer with a query it actually runs
 * (AdminNotificationsService.resolveAudience), which is the whole constraint
 * on the list: "everyone who opened the app this week" is a sensible
 * marketing segment and is not here, because nothing records a session.
 */
export type CampaignAudienceKey =
  | "everyone"
  | "creators"
  | "buyers"
  | "unverified_creators"
  | "professionals"
  | "unverified_professionals";

/** Tones a campaign may use. Never `danger` or `warning`: those are the app's money-and-deadline colours. */
export type CampaignTone = "accent" | "info" | "neutral" | "success";

/**
 * One segment with its LIVE size.
 *
 * `size` is how many accounts matched. `optedIn` is how many of those have
 * "Offers and news" switched on and will therefore actually receive it. Both
 * are counted by the backend at the moment the composer asks. The composer
 * shows both, because the gap between them is the opt-out rate and an admin
 * choosing a segment should see it before pressing send, not after.
 */
export interface CampaignAudience {
  audience: CampaignAudienceKey;
  label: string;
  description: string;
  size: number;
  optedIn: number;
}

/** One in-app route a campaign button may point at. Served by the backend, which is the allowlist. */
export interface CampaignDestination {
  href: string;
  label: string;
}

export type CampaignStatus = "draft" | "sending" | "sent" | "failed";

/** What the composer sends. */
export interface CampaignDraft {
  title: string;
  body: string;
  imageUrl?: string;
  actionLabel?: string;
  actionHref?: string;
  tone: CampaignTone;
  audience: CampaignAudienceKey;
}

export interface NotificationCampaign {
  id: string;
  title: string;
  body: string;
  imageUrl: string | null;
  actionLabel: string | null;
  actionHref: string | null;
  tone: string;
  audience: CampaignAudienceKey;
  status: CampaignStatus;
  /** How many accounts matched at dispatch. 0 on a draft: nothing is resolved yet. */
  recipientCount: number;
  /** How many notification rows were written. Always <= recipientCount. */
  deliveredCount: number;
  failureReason: string | null;
  createdByAdminEmail: string;
  dispatchedByAdminEmail: string | null;
  dispatchedAt: string | null;
  createdAt: string;
}

export interface CampaignDispatchResult {
  campaign: NotificationCampaign;
  recipientCount: number;
  deliveredCount: number;
  /** recipientCount - deliveredCount, named so nobody has to work it out. */
  suppressedByPreference: number;
}
