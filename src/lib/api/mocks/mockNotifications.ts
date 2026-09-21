import type {
  AppNotification,
  CampaignAudience,
  CampaignDestination,
  CampaignDispatchResult,
  CampaignDraft,
  NotificationCampaign,
  NotificationsResponse,
} from "@/types/notification";
import { formatNaira, formatCredits } from "@/lib/format";

const minutesAgo = (mins: number) => new Date(Date.now() - mins * 60_000).toISOString();

/**
 * Every notification kind the client renders. Money-bearing kinds carry
 * `amount` (naira); credits kinds carry a COUNT.
 *
 * Build brief C8 adds the two picture-led kinds at the top: an admin
 * `campaign` and the recurring `verify_reminder`. They are first in the list
 * because they are the newest, and the list is time-ordered.
 */
// SEAM: replace with GET /api/hub/notifications
export const mockNotifications: NotificationsResponse = {
  unreadCount: 6,
  items: [
    {
      id: "n-campaign-bills",
      kind: "campaign",
      title: "Bills payment is live on WAWU",
      body: "Airtime, data, electricity and cable TV, all inside the app. Pay in naira and the token lands on the spot, no second app and no queue.",
      tone: "accent",
      imageUrl: "/mock/notifications/wawu-bills.jpg",
      actionLabel: "Pay a bill",
      actionHref: "/home",
      campaignId: "camp-bills-sep",
      read: false,
      createdAt: minutesAgo(35),
    },
    {
      id: "n-verify-reminder",
      kind: "verify_reminder",
      title: "Your account is not verified yet",
      body: "Verified creators carry the purple tick on their profile and on every card they appear on. Send your ID to start.",
      tone: "info",
      actionLabel: "Get verified",
      actionHref: "/profile/verification",
      read: false,
      createdAt: minutesAgo(90),
    },
    {
      id: "n-dm-deadline",
      kind: "dm_deadline",
      title: "Reply to Emeka within 1h 12m",
      body: "Miss it and his ₦300 is refunded. You earn nothing.",
      tone: "danger",
      amount: 300,
      actionLabel: "Reply now",
      read: false,
      createdAt: minutesAgo(2),
    },
    {
      id: "n-sale",
      kind: "sale",
      title: "CAC in 7 days sold",
      body: "Ngozi Eze unlocked it · 20 min ago",
      tone: "accent",
      amount: 2250,
      read: false,
      createdAt: minutesAgo(20),
    },
    {
      id: "n-dm-received",
      kind: "dm_received",
      title: "Paid message from Musa",
      body: "“Can two people share one registration?” · 2h",
      tone: "accent",
      amount: 300,
      read: false,
      createdAt: minutesAgo(120),
    },
    {
      id: "n-content-published",
      kind: "content_published",
      title: "The trader's playbook is live",
      body: "Approved and in the feed",
      tone: "success",
      read: false,
      createdAt: minutesAgo(4 * 60),
    },
    {
      id: "n-kyc-verified",
      kind: "kyc_verified",
      title: "You are verified",
      body: "Earnings now reach your GTB account ending 6789",
      tone: "success",
      read: true,
      createdAt: minutesAgo(24 * 60),
    },
    {
      id: "n-dm-refunded",
      kind: "dm_refunded",
      title: "Your ₦250 came back",
      body: "Tolu Balogun did not reply within 24 hours",
      tone: "info",
      amount: 250,
      read: true,
      createdAt: minutesAgo(24 * 60),
    },
    {
      id: "n-credits-low",
      kind: "credits_low",
      title: "3 credits left",
      body: "Top up to keep chatting in Traders of Ogbete",
      tone: "warning",
      creditsCount: 3,
      actionLabel: "Buy credits",
      read: true,
      createdAt: minutesAgo(2 * 24 * 60),
    },
    {
      id: "n-content-rejected",
      kind: "content_rejected",
      title: "Market survey 2024 was not approved",
      body: "Charts belong to another publisher · your slot is back",
      tone: "danger",
      read: true,
      createdAt: minutesAgo(3 * 24 * 60),
    },
    {
      id: "n-follower",
      kind: "new_follower",
      title: "Chidi Umeh followed you",
      body: "Artist · Nsukka",
      tone: "neutral",
      read: true,
      createdAt: minutesAgo(5 * 24 * 60),
    },
    {
      id: "n-tip",
      kind: "tip_received",
      title: "Tip from Ngozi Eze",
      body: "“The nil-return page saved me a trip” · 1w",
      tone: "accent",
      amount: 1000,
      read: true,
      createdAt: minutesAgo(7 * 24 * 60),
    },
    {
      id: "n-campaign-events",
      kind: "campaign",
      title: "Five events happening in Enugu this month",
      body: "A photography walk, two business clinics and a pair of live sessions. Free to browse, and hosts answer questions in the comments.",
      tone: "info",
      imageUrl: "/mock/notifications/wawu-events.jpg",
      actionLabel: "See what is on",
      actionHref: "/events",
      campaignId: "camp-events-sep",
      read: true,
      createdAt: minutesAgo(4 * 24 * 60),
    },
    {
      id: "n-trial-ending",
      kind: "trial_ending",
      title: "Your community trial ends tomorrow",
      body: `After that, each message costs ${formatCredits(1)}.`,
      tone: "warning",
      creditsCount: 0,
      read: true,
      createdAt: minutesAgo(6 * 24 * 60),
    },
  ],
};
/* ───────────── admin campaign fixtures (build brief C8) ──────────────────
 *
 * Dev/demo only. The composer calls the real endpoints whenever a backend is
 * configured; these exist so the surface can be built and looked at without
 * one, and so a dispatch in mock mode behaves like a dispatch (it refuses a
 * second send, and it reports two different counts) rather than always
 * succeeding.
 *
 * config.ts refuses to run a production build in mock mode at all, so none of
 * this can reach a user.
 */

// SEAM: replace with GET /api/hub/admin/notifications/audiences
export const mockCampaignAudiences: CampaignAudience[] = [
  {
    audience: "everyone",
    label: "Everyone",
    description: "Every account with a profile on WAWU.",
    size: 4820,
    optedIn: 4413,
  },
  {
    audience: "creators",
    label: "Creators",
    description: "Every creator account, verified or not.",
    size: 1964,
    optedIn: 1802,
  },
  {
    audience: "buyers",
    label: "Buyers",
    description: "Accounts that browse and buy, and do not list.",
    size: 2856,
    optedIn: 2611,
  },
  {
    audience: "unverified_creators",
    label: "Unverified creators",
    description: "Creators who have never had a verification approved.",
    size: 1517,
    optedIn: 1390,
  },
  {
    audience: "professionals",
    label: "Professionals",
    description: "Accounts with an approved professional profile.",
    size: 312,
    optedIn: 289,
  },
  {
    audience: "unverified_professionals",
    label: "Unverified professionals",
    description: "Approved professionals who have never had a verification approved.",
    size: 208,
    optedIn: 191,
  },
];

// SEAM: replace with GET /api/hub/admin/notifications/destinations
export const mockCampaignDestinations: CampaignDestination[] = [
  { href: "/home", label: "Home feed" },
  { href: "/explore", label: "Explore" },
  { href: "/events", label: "Events" },
  { href: "/shop", label: "Shop" },
  { href: "/learn", label: "Learn" },
  { href: "/services", label: "Services" },
  { href: "/communities", label: "Communities" },
  { href: "/professionals", label: "Professionals" },
  { href: "/profile/verification", label: "Get verified" },
  { href: "/create", label: "Create a listing" },
  { href: "/notifications", label: "Stay here" },
];

// SEAM: replace with GET /api/hub/admin/notifications/campaigns
const campaignLog: NotificationCampaign[] = [
  {
    id: "camp-bills-sep",
    title: "Bills payment is live on WAWU",
    body: "Airtime, data, electricity and cable TV, all inside the app. Pay in naira and the token lands on the spot, no second app and no queue.",
    imageUrl: "/mock/notifications/wawu-bills.jpg",
    actionLabel: "Pay a bill",
    actionHref: "/home",
    tone: "accent",
    audience: "everyone",
    status: "sent",
    recipientCount: 4820,
    deliveredCount: 4413,
    failureReason: null,
    createdByAdminEmail: "ops@wawuafrica.com",
    dispatchedByAdminEmail: "ops@wawuafrica.com",
    dispatchedAt: new Date(Date.now() - 35 * 60_000).toISOString(),
    createdAt: new Date(Date.now() - 70 * 60_000).toISOString(),
  },
  {
    id: "camp-events-sep",
    title: "Five events happening in Enugu this month",
    body: "A photography walk, two business clinics and a pair of live sessions. Free to browse, and hosts answer questions in the comments.",
    imageUrl: "/mock/notifications/wawu-events.jpg",
    actionLabel: "See what is on",
    actionHref: "/events",
    tone: "info",
    audience: "everyone",
    status: "sent",
    recipientCount: 4796,
    deliveredCount: 4390,
    failureReason: null,
    createdByAdminEmail: "ops@wawuafrica.com",
    dispatchedByAdminEmail: "ops@wawuafrica.com",
    dispatchedAt: new Date(Date.now() - 4 * 24 * 60 * 60_000).toISOString(),
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60_000 - 3_600_000).toISOString(),
  },
  {
    id: "camp-shop-draft",
    title: "The shop is open for Christmas orders",
    body: "Physical products ship nationwide. Sellers set their own delivery window and buyers see it before they pay.",
    imageUrl: "/mock/notifications/wawu-shop.jpg",
    actionLabel: "Open the shop",
    actionHref: "/shop",
    tone: "success",
    audience: "buyers",
    status: "draft",
    recipientCount: 0,
    deliveredCount: 0,
    failureReason: null,
    createdByAdminEmail: "ops@wawuafrica.com",
    dispatchedByAdminEmail: null,
    dispatchedAt: null,
    createdAt: new Date(Date.now() - 2 * 60 * 60_000).toISOString(),
  },
];

export function mockCampaigns(): NotificationCampaign[] {
  return campaignLog.map((c) => ({ ...c }));
}

export function recordMockCampaign(draft: CampaignDraft): NotificationCampaign {
  const campaign: NotificationCampaign = {
    id: `camp-local-${campaignLog.length + 1}`,
    title: draft.title,
    body: draft.body,
    imageUrl: draft.imageUrl ?? null,
    actionLabel: draft.actionLabel ?? null,
    actionHref: draft.actionHref ?? null,
    tone: draft.tone,
    audience: draft.audience,
    status: "draft",
    recipientCount: 0,
    deliveredCount: 0,
    failureReason: null,
    createdByAdminEmail: "you@wawuafrica.com",
    dispatchedByAdminEmail: null,
    dispatchedAt: null,
    createdAt: new Date().toISOString(),
  };
  campaignLog.unshift(campaign);
  return { ...campaign };
}

/**
 * Mirrors the backend's refusal to send the same campaign twice, so the
 * composer's confirm step is exercised in mock mode rather than only in
 * production.
 */
export function dispatchMockCampaign(id: string): CampaignDispatchResult {
  const campaign = campaignLog.find((c) => c.id === id);
  if (!campaign) throw new Error("That campaign does not exist.");
  if (campaign.status === "sent") {
    throw new Error("That campaign has already been sent. Compose a new one to send again.");
  }
  const segment = mockCampaignAudiences.find((a) => a.audience === campaign.audience);
  const recipientCount = segment?.size ?? 0;
  const deliveredCount = segment?.optedIn ?? 0;
  campaign.status = "sent";
  campaign.recipientCount = recipientCount;
  campaign.deliveredCount = deliveredCount;
  campaign.dispatchedByAdminEmail = "you@wawuafrica.com";
  campaign.dispatchedAt = new Date().toISOString();
  return {
    campaign: { ...campaign },
    recipientCount,
    deliveredCount,
    suppressedByPreference: recipientCount - deliveredCount,
  };
}
