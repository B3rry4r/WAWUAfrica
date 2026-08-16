/**
 * Notification kinds. The design file (WAWU Notifications Search.dc.html)
 * is the source of truth: its two list screens show 11 kinds and the batch
 * header claims "Twelve kinds of news". The 12th — `trial_ending` — is
 * derived from the WAWU Credits trial (7 days, docs/01_SPEC.md §3) so the
 * fan-side of the credits system is covered alongside the fan-side refund.
 *
 * 1. dm_deadline            — reply before the 24h window closes (urgent, action)
 * 2. sale                   — content sold (money)
 * 3. dm_received            — paid DM received (money)
 * 4. content_published      — content approved and live
 * 5. kyc_verified           — account/payout status changed
 * 6. dm_refunded            — fan refunded, creator missed the window (money)
 * 7. credits_low            — credits balance low (a COUNT, never naira)
 * 8. content_rejected       — content not approved, slot returned
 * 9. subscription_renewal   — creator tier renewal/billing
 * 10. new_follower          — new follower
 * 11. tip_received          — tip received (money)
 * 12. trial_ending          — credits trial ending/ended (count, fan-side)
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
  | "subscription_renewal"
  | "new_follower"
  | "tip_received"
  | "trial_ending";

export type NotificationTone = "danger" | "accent" | "success" | "warning" | "info" | "neutral";

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  tone: NotificationTone;
  /** Money-bearing notifications carry an amount; everything else stays quiet. */
  amount?: number;
  /** Credits always render as a COUNT via formatCredits(), never naira. */
  creditsCount?: number;
  /** Show an inline CTA (e.g. "Reply now", "Buy credits"). */
  actionLabel?: string;
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
