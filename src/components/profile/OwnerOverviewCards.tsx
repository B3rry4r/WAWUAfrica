"use client";

import Link from "next/link";
import { Icon, type IconName } from "@/components/ui";
import { formatNaira } from "@/lib/format";
import type { ProfileStep } from "@/types/verification";

/**
 * The owner's own Overview furniture, as the approved reference draws it:
 * a three-up card row, then the completeness ring.
 *
 * ALL OF IT IS OWNER-ONLY. Earnings, profile views and units sold are the
 * three figures a creator opens their own page to check, and all three are
 * nobody else's business. They come from GET /users/me/profile-stats and the
 * earnings endpoint, both of which take the caller's id from the token and
 * have no parameter that could point them at another account, so this is not
 * a client-side decision that could be got wrong: a visitor's read simply
 * cannot return these numbers.
 *
 * A ZERO IS SHOWN HERE, unlike in the stat row above it. The difference is
 * whose claim it is: "0 Followers" on a public row is a statement about how
 * interesting a person is, while "₦0 earned this month" on your own dashboard
 * is a fact you came to find out. Hiding it would leave a new creator
 * wondering whether the card was broken.
 */

interface StatCardSpec {
  icon: IconName;
  value: string;
  label: string;
  /** "This month" under the label, where the figure is month-scoped. */
  scope?: string;
  href?: string;
}

function StatCard({ icon, value, label, scope, href }: StatCardSpec) {
  const body = (
    <>
      <span className="grid h-[34px] w-[34px] place-items-center rounded-[10px] bg-tag">
        <Icon name={icon} size={17} color="var(--accent)" strokeWidth={2} />
      </span>
      <span className="mt-[10px] block text-[20px] font-bold leading-none tracking-[-0.02em] text-text-primary [font-feature-settings:var(--font-feature-tabular)]">
        {value}
      </span>
      <span className="mt-[6px] block text-[12.5px] text-text-secondary">{label}</span>
      {scope ? <span className="mt-[1px] block text-[11.5px] text-text-muted">{scope}</span> : null}
    </>
  );

  const className =
    "flex flex-col rounded-card border border-hairline bg-card p-[14px] no-underline transition-colors hover:border-strong";

  return href ? (
    <Link href={href} className={className}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

export interface OwnerStatCardsProps {
  earningsThisMonth?: number;
  monthlyViews?: string;
  productsSold?: number;
}

export function OwnerStatCards({
  earningsThisMonth,
  monthlyViews,
  productsSold,
}: OwnerStatCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-[12px] sm:grid-cols-3">
      <StatCard
        icon="BarChart3"
        // formatNaira, not a hand-rolled "₦" + toLocaleString: the naira
        // format is one function in this app so a figure here and the same
        // figure on the wallet cannot be punctuated differently.
        value={earningsThisMonth === undefined ? "-" : formatNaira(earningsThisMonth)}
        label="Total Earnings"
        scope="This month"
        href="/earnings"
      />
      <StatCard
        icon="Users"
        value={monthlyViews ?? "-"}
        label="Profile Views"
        scope="This month"
      />
      <StatCard
        icon="Package"
        value={productsSold === undefined ? "-" : String(productsSold)}
        label="Products Sold"
        scope="This month"
        href="/earnings"
      />
    </div>
  );
}

/* --------------------------- completeness ring -------------------------- */

/** What each outstanding step is called on screen, and where it is fixed. */
const STEP_LABEL: Record<ProfileStep, string> = {
  avatar: "Add a profile photo",
  cover: "Add a cover image",
  handle: "Choose your handle",
  bio: "Write a bio",
  links: "Add social links",
};

/**
 * The ring.
 *
 * An SVG rather than a CSS conic-gradient because the reference draws a
 * stroked arc with a rounded cap, and a gradient cannot round its own ends.
 * The dash offset is a computed value, which is the one documented exception
 * to the no-inline-style rule this repo already takes for progress bars.
 */
function Ring({ pct }: { pct: number }) {
  const R = 22;
  const C = 2 * Math.PI * R;
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" className="shrink-0" aria-hidden="true">
      <circle cx="28" cy="28" r={R} fill="none" stroke="var(--surface-tag)" strokeWidth="5" />
      <circle
        cx="28"
        cy="28"
        r={R}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={C}
        strokeDashoffset={C - (C * Math.min(100, Math.max(0, pct))) / 100}
        transform="rotate(-90 28 28)"
      />
      <text
        x="28"
        y="32"
        textAnchor="middle"
        className="fill-[var(--text-primary)] text-[13px] font-bold"
      >
        {pct}%
      </text>
    </svg>
  );
}

export interface CompleteProfileCardProps {
  pct?: number;
  missing?: ProfileStep[];
}

export function CompleteProfileCard({ pct, missing }: CompleteProfileCardProps) {
  // Nothing to say when the server has not answered, and nothing to ask for
  // when the profile is already complete. A 100% ring with "Complete your
  // profile" beside it is the card telling somebody to do what they did.
  if (pct === undefined || pct >= 100) return null;

  return (
    <div className="flex items-center gap-[14px] rounded-card border border-hairline bg-card p-[16px]">
      <Ring pct={pct} />
      <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
        <span className="text-[14.5px] font-semibold text-text-primary">Complete your profile</span>
        <span className="text-[12.5px] leading-[1.45] text-text-secondary">
          {/* The outstanding steps BY NAME. The reference's generic line
              ("add a few details") leaves somebody to hunt for which
              details; the server already says which, so this says which. */}
          {missing && missing.length > 0
            ? missing.map((m) => STEP_LABEL[m]).join(", ")
            : "A few details left to attract more fans, clients and brand partnerships."}
        </span>
      </div>
      <Link
        href="/profile/edit"
        className="inline-flex h-[36px] shrink-0 items-center gap-[6px] rounded-full bg-accent px-[14px] text-[12.5px] font-semibold text-on-accent no-underline transition-colors hover:bg-accent-hover"
      >
        Complete Profile
        <Icon name="ArrowRight" size={14} color="currentColor" strokeWidth={2.2} />
      </Link>
    </div>
  );
}

/* ------------------------------ right rail ------------------------------ */

/**
 * Creator Tools: the five things a creator comes here to start.
 *
 * Every row points at a route that already exists. A rail advertising work
 * that has not been built is worse than a shorter rail, so the reference's
 * fifth row ("AI Creator Studio") is absent: nothing in this product stands
 * behind it. The four that remain are the four creatable things the Create
 * hub already offers, which keeps the two screens saying the same thing.
 */
const CREATOR_TOOLS: { icon: IconName; title: string; caption: string; href: string }[] = [
  {
    icon: "Upload",
    title: "Upload Content",
    caption: "Video, course, audio or PDF",
    href: "/create/content",
  },
  {
    icon: "CalendarPlus",
    title: "Create Event",
    caption: "Tickets and experiences",
    href: "/events/new",
  },
  {
    icon: "Users",
    title: "Start a Community",
    caption: "A room your people talk in",
    href: "/communities/new",
  },
  {
    icon: "BriefcaseBusiness",
    title: "Offer a Service",
    caption: "Consultations and bookings",
    href: "/professionals/apply",
  },
];

export function CreatorToolsCard() {
  return (
    <div className="flex flex-col gap-[12px] rounded-card border border-hairline bg-card p-[16px]">
      <div className="flex items-center justify-between gap-[10px]">
        <span className="text-[14px] font-semibold text-text-primary">Creator Tools</span>
        <Link
          href="/create"
          className="text-[12.5px] font-semibold text-accent no-underline hover:text-text-primary"
        >
          See all
        </Link>
      </div>
      <ul className="m-0 flex list-none flex-col gap-[4px] p-0">
        {CREATOR_TOOLS.map((t) => (
          <li key={t.href}>
            <Link
              href={t.href}
              className="flex items-center gap-[10px] rounded-[10px] p-[7px] no-underline transition-colors hover:bg-state-hover"
            >
              <span className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-[9px] bg-tag">
                <Icon name={t.icon} size={15} color="var(--text-primary)" strokeWidth={2} />
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-[12.5px] font-semibold text-text-primary">
                  {t.title}
                </span>
                <span className="truncate text-[11.5px] text-text-muted">{t.caption}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Profile Strength: the same five steps as the ring, as a checklist.
 *
 * It is the ring's detail view, driven by the SAME `missing` array, so the
 * two cannot disagree about what is outstanding. That is the whole reason it
 * takes the array rather than recomputing from the profile: two independent
 * readings of "is the bio filled in" is exactly how a card ends up ticking
 * something the ring still counts against you.
 */
const ALL_STEPS: ProfileStep[] = ["avatar", "cover", "bio", "links", "handle"];

export interface ProfileStrengthCardProps {
  pct?: number;
  missing?: ProfileStep[];
}

export function ProfileStrengthCard({ pct, missing }: ProfileStrengthCardProps) {
  if (pct === undefined) return null;
  const outstanding = new Set(missing ?? []);

  return (
    <div className="flex flex-col gap-[12px] rounded-card border border-hairline bg-card p-[16px]">
      <div className="flex items-center justify-between gap-[10px]">
        <span className="text-[14px] font-semibold text-text-primary">Profile Strength</span>
        <span className="text-[13px] font-bold text-accent [font-feature-settings:var(--font-feature-tabular)]">
          {pct}%
        </span>
      </div>
      <div className="h-[5px] overflow-hidden rounded-full bg-tag">
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-200"
          // A percentage is computed, so it cannot be a Tailwind class. Same
          // documented exception SlotMeter and the upload bar already take.
          style={{ width: `${pct}%` }}
        />
      </div>
      <ul className="m-0 flex list-none flex-col gap-[7px] p-0">
        {ALL_STEPS.map((step) => {
          const done = !outstanding.has(step);
          return (
            <li key={step} className="flex items-center gap-[8px]">
              <Icon
                name={done ? "CircleCheck" : "Circle"}
                size={14}
                color={done ? "var(--success)" : "var(--text-disabled)"}
                strokeWidth={2}
              />
              <span
                className={`text-[12px] ${done ? "text-text-muted line-through" : "text-text-secondary"}`}
              >
                {STEP_LABEL[step]}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
