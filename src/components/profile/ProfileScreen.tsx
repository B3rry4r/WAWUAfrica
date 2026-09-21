"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listMyEvents } from "@/lib/api/events";
import { listProfessionals } from "@/lib/api/professionals";
import { eventDateParts } from "@/lib/event-date";
import { formatNaira } from "@/lib/format";
import { getSpecializations } from "@/lib/taxonomy/taxonomy";
import { EVENT_CATEGORY_LABEL, type WawuEvent } from "@/types/events";
import type { ProfessionalListing } from "@/types/professional";
import { PROFILE_TABS, type ProfileTab, type ProfileView } from "@/types/profile";
import {
  Avatar,
  Button,
  ContentThumb,
  EmptyState,
  Icon,
  MediaCard,
  PriceChip,
  Skeleton,
  SocialIcon,
  StatusPill,
  VerificationBadge,
  type SocialName,
} from "@/components/ui";
import { FollowButton } from "@/components/shared/FollowButton";
import { ProfileActions } from "@/components/profile/ProfileActions";
import { ShareProfileButton } from "@/components/profile/ShareProfileButton";
import { ProfileTabs } from "@/components/profile/ProfileTabs";
import { ProfileCrossSell } from "@/components/profile/ProfileCrossSell";

/**
 * THE profile screen. One template, owner and visitor alike.
 *
 * Build brief C2: "Owner vs visitor: the same page. The only difference is
 * that the owner sees an Edit control. Do not build two templates."
 *
 * There were two. /profile was a settings menu - a column of ListRows for
 * dashboard, earnings, wallet, KYC, purchases, saved, settings - with a small
 * identity block on top. /profile/[wawuId] was the storefront. So the owner
 * could never see their own shop window, which is the one view that decides
 * whether anybody buys anything. Both routes normalise into `ProfileView` and
 * render this.
 *
 * Built to refs/target-profile-desktop.jpg: cover, avatar overlapping it,
 * name with tick, role line, location and links, specialization chips with an
 * add affordance, stat row, tab bar. Overview carries the featured work WITH
 * PRICES; the side panel carries Social Links, Skills & Expertise and About
 * (stacked underneath on mobile).
 *
 * WHAT THE REFERENCE DRAWS THAT THIS DELIBERATELY DOES NOT.
 *  - "Your Tier: BASIC" and "Upgrade to Pro". There is no subscription and no
 *    creator tier (build brief B1, CLAUDE.md). Drawing a tier badge would
 *    reintroduce the exact thing B1 removed.
 *  - "Opportunities for You". CLAUDE.md: "No jobs, no gigs, no Opportunities
 *    section."
 *  - An "Analytics" tab. C2's tab list is Overview, Content, Products, Events,
 *    Services. The creator dashboard already owns analytics.
 * See DECISIONS.md D11.
 */
export interface ProfileScreenProps {
  view: ProfileView;
  /** The owner sees Edit controls. Everything else is identical. */
  isOwner: boolean;
  tab: ProfileTab;
  /** Where the tab links point: /profile for the owner, /profile/:id otherwise. */
  basePath: string;
  following?: boolean;
}

export function ProfileScreen({ view, isOwner, tab, basePath, following = false }: ProfileScreenProps) {
  return (
    <div className="flex flex-col pb-[96px] xl:pb-[40px]">
      <ProfileIdentity view={view} isOwner={isOwner} following={following} />
      <ProfileTabs basePath={basePath} active={tab} />

      <div className="flex flex-col gap-[20px] px-[16px] pt-[18px] xl:flex-row xl:items-start xl:gap-[26px] xl:px-[26px]">
        <div className="flex min-w-0 flex-1 flex-col gap-[20px]">
          <TabBody view={view} isOwner={isOwner} tab={tab} />
          {/* C10: no screen is a dead end, and a shared profile is the most
              common way somebody arrives at this product at all. */}
          <ProfileCrossSell isOwner={isOwner} name={view.name} />
        </div>

        {/*
          C2's side panel. On mobile the same three cards stack under the tab
          body rather than becoming a fourth tab: About is not a destination,
          it is context for whatever tab you are on.
        */}
        <aside className="flex shrink-0 flex-col gap-[14px] xl:w-[326px]">
          <SocialLinksCard view={view} isOwner={isOwner} />
          <SkillsCard view={view} isOwner={isOwner} />
          <AboutCard view={view} isOwner={isOwner} />
        </aside>
      </div>
    </div>
  );
}

/* ------------------------------ identity ------------------------------- */

function ProfileIdentity({
  view,
  isOwner,
  following,
}: {
  view: ProfileView;
  isOwner: boolean;
  following: boolean;
}) {
  const specs = getSpecializations(view.specializations);
  // A specialization id resolves to a taxonomy label; anything else is an
  // older free-text interest and is shown as typed rather than dropped.
  const chips =
    specs.length > 0
      ? specs.map((s) => s.label)
      : view.specializations;

  /*
    C2: "store link occupying the website field when the user has no external
    site". Everybody has a store; not everybody has a site of their own.
  */
  const storePath = `/profile/${view.handle || view.wawuId}`;
  const link = view.website
    ? { label: view.website.replace(/^https?:\/\//, ""), href: view.website, external: true }
    : { label: `wawu/${view.handle || view.wawuId}`, href: storePath, external: false };

  return (
    <header className="flex flex-col">
      {/* Cover. An account with none gets the brand gradient, not a gap. */}
      <div className="relative h-[132px] w-full overflow-hidden bg-[linear-gradient(140deg,var(--accent-deep),var(--surface-elevated))] xl:h-[200px]">
        {view.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={view.coverUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : null}
        {isOwner ? (
          <Link
            href="/profile/edit"
            className="absolute bottom-[10px] right-[12px] inline-flex h-[32px] items-center gap-[6px] rounded-full bg-[rgba(11,10,13,0.72)] px-[12px] text-[12.5px] font-semibold text-white no-underline backdrop-blur-sm transition-colors hover:bg-[rgba(11,10,13,0.9)]"
          >
            <Icon name="Camera" size={14} strokeWidth={2} />
            Edit cover
          </Link>
        ) : null}
      </div>

      {/*
        Desktop puts the avatar in its own column with the identity beside it
        and the actions on the same line as the name, which is what the
        reference draws. Mobile stacks: avatar and actions on one row, then
        the name and everything under it. One markup, `xl:` reflows it -
        a second "desktop identity" component is the fork C2 forbids.
      */}
      <div className="flex flex-col gap-[14px] px-[16px] pb-[4px] xl:flex-row xl:items-start xl:gap-[22px] xl:px-[26px]">
        <div className="-mt-[38px] flex items-end justify-between gap-3 xl:-mt-[54px] xl:block">
          <div className="relative shrink-0">
            <span className="block overflow-hidden rounded-full border-[3px] border-[var(--surface-page)]">
              <Avatar src={view.avatarUrl ?? null} initial={view.name.charAt(0)} size={84} />
            </span>
            {isOwner ? (
              <Link
                href="/profile/edit"
                aria-label="Change your profile picture"
                className="absolute bottom-[2px] right-[2px] grid h-[28px] w-[28px] place-items-center rounded-full border-2 border-[var(--surface-page)] bg-[var(--accent)] no-underline"
              >
                <Icon name="Camera" size={13} color="var(--text-on-accent)" strokeWidth={2.2} />
              </Link>
            ) : null}
          </div>

          {/* Mobile only: on desktop these move up beside the name. */}
          <div className="flex items-center gap-[8px] pb-[6px] xl:hidden">
            <ProfileOwnerActions view={view} isOwner={isOwner} following={following} />
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-[14px] xl:pt-[14px]">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 flex-col gap-[7px]">
              <div className="flex items-center gap-[8px]">
                <h1 className="m-0 truncate text-[22px] font-bold tracking-[-0.025em] text-[var(--text-primary)] xl:text-[27px]">
                  {view.name}
                </h1>
                <VerificationBadge tier={view.verification} size={19} />
              </div>
              <span className="text-[13.5px] text-[var(--text-muted)]">@{view.handle || view.wawuId}</span>
              {view.roleLine ? (
                <span className="text-[14.5px] font-semibold text-[var(--text-primary)]">{view.roleLine}</span>
              ) : null}
              {view.bio ? (
                <p className="m-0 max-w-[68ch] text-[13.5px] leading-[1.55] text-[var(--text-secondary)] [text-wrap:pretty]">
                  {view.bio}
                </p>
              ) : null}
            </div>

            <div className="hidden shrink-0 items-center gap-[8px] xl:flex">
              <ProfileOwnerActions view={view} isOwner={isOwner} following={following} />
            </div>
          </div>

        <div className="flex flex-wrap items-center gap-x-[16px] gap-y-[7px]">
          {view.location ? <MetaItem icon="MapPin" text={view.location} /> : null}
          {view.memberSince ? <MetaItem icon="Calendar" text={`On WAWU since ${view.memberSince}`} /> : null}
          {link.external ? (
            <a
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-[6px] text-[12.5px] font-semibold text-[var(--accent)] no-underline hover:text-text-primary"
            >
              <Icon name="Link" size={14} strokeWidth={2} />
              {link.label}
            </a>
          ) : (
            <Link
              href={link.href}
              className="inline-flex items-center gap-[6px] text-[12.5px] font-semibold text-[var(--accent)] no-underline hover:text-text-primary"
            >
              <Icon name="Store" size={14} strokeWidth={2} />
              {link.label}
            </Link>
          )}
        </div>

        {/* Specialization chips with an add affordance, per C2. The "+" is the
            owner's only way in: it opens the editor where the picker lives,
            rather than being a second, drifting copy of it. */}
        {chips.length > 0 || isOwner ? (
          <div className="flex flex-wrap gap-[7px]">
            {chips.map((c) => (
              <span
                key={c}
                className="inline-flex h-[30px] items-center rounded-full border border-[var(--border-hairline)] bg-[var(--surface-tag)] px-[12px] text-[12.5px] font-medium text-[var(--text-secondary)]"
              >
                {c}
              </span>
            ))}
            {isOwner ? (
              <Link
                href="/profile/edit"
                aria-label="Add a specialization"
                className="inline-flex h-[30px] w-[30px] items-center justify-center rounded-full border border-dashed border-[var(--border-strong)] text-[var(--text-secondary)] no-underline transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
              >
                <Icon name="Plus" size={15} strokeWidth={2.2} />
              </Link>
            ) : null}
          </div>
        ) : null}

          <StatRow view={view} />

          {/* A visitor's paid actions. The owner cannot pay to message
              themselves, so this is the one block the two views differ on
              beyond the Edit controls. */}
          {!isOwner && view.dm ? (
            <ProfileActions
              creator={{
                wawuId: view.wawuId,
                name: view.name,
                handle: view.handle,
                avatarUrl: view.avatarUrl,
                dmPrice: view.dm.price,
                dmResponseHours: view.dm.responseHours,
                verification: view.verification,
              }}
              dmEnabled={view.dm.enabled}
            />
          ) : null}
        </div>
      </div>
    </header>
  );
}

/**
 * Edit + Share for the owner, Follow + Share for everybody else. Extracted
 * because the row appears twice in ONE markup - beside the avatar on mobile,
 * beside the name on desktop - and two inline copies is how they drift.
 */
function ProfileOwnerActions({
  view,
  isOwner,
  following,
}: {
  view: ProfileView;
  isOwner: boolean;
  following: boolean;
}) {
  return (
    <>
      {isOwner ? (
        <Button size="sm" variant="secondary" icon="SquarePen" href="/profile/edit">
          Edit profile
        </Button>
      ) : (
        <FollowButton wawuId={view.wawuId} initial={following} size="sm" />
      )}
      <ShareProfileButton handle={view.handle || view.wawuId} compact />
    </>
  );
}

function MetaItem({ icon, text }: { icon: "MapPin" | "Calendar"; text: string }) {
  return (
    <span className="inline-flex items-center gap-[6px] text-[12.5px] text-[var(--text-muted)]">
      <Icon name={icon} size={14} strokeWidth={2} />
      {text}
    </span>
  );
}

/**
 * The reference's stat row reads Posts / Followers / Following / Monthly
 * Views. Two of those are not on the contract: nothing returns a FOLLOWING
 * count or a monthly view count for a profile, and putting a 0 under either
 * label is a claim rather than an absence. So the row renders the numbers
 * that exist, and gains the other two the day an endpoint answers them.
 * See DECISIONS.md D11.
 */
function StatRow({ view }: { view: ProfileView }) {
  const items: { value: string; label: string }[] = [];
  if (view.stats.pieces !== undefined)
    items.push({ value: String(view.stats.pieces), label: view.stats.piecesLabel ?? "Posts" });
  if (view.stats.followers !== undefined) items.push({ value: view.stats.followers, label: "Followers" });
  if (view.stats.evg !== undefined)
    items.push({ value: view.stats.evg.toLocaleString("en-NG"), label: "EVG" });
  if (items.length === 0) return null;

  return (
    <div className="flex gap-[26px] border-t border-[var(--border-hairline)] pt-[13px]">
      {items.map((s) => (
        <span key={s.label} className="flex flex-col gap-[2px]">
          <span className="text-[17px] font-bold leading-none text-[var(--text-primary)] [font-feature-settings:var(--font-feature-tabular)]">
            {s.value}
          </span>
          <span className="text-[11.5px] text-[var(--text-muted)]">{s.label}</span>
        </span>
      ))}
    </div>
  );
}

/* -------------------------------- tabs --------------------------------- */

function TabBody({ view, isOwner, tab }: { view: ProfileView; isOwner: boolean; tab: ProfileTab }) {
  switch (tab) {
    case "content":
      return <ContentTab view={view} isOwner={isOwner} />;
    case "products":
      return <ProductsTab isOwner={isOwner} />;
    case "events":
      return <EventsTab view={view} isOwner={isOwner} />;
    case "services":
      return <ServicesTab view={view} isOwner={isOwner} />;
    default:
      return <OverviewTab view={view} isOwner={isOwner} />;
  }
}

function SectionHead({ title, href }: { title: string; href?: string }) {
  return (
    <div className="flex items-end justify-between gap-3 px-[2px]">
      <h2 className="m-0 text-[16.5px] font-bold tracking-[-0.015em] text-[var(--text-primary)]">{title}</h2>
      {href ? (
        <Link
          href={href}
          className="shrink-0 text-[12.5px] font-semibold text-[var(--accent)] no-underline hover:text-text-primary"
        >
          See all
        </Link>
      ) : null}
    </div>
  );
}

/** C2's "Featured section: the user's featured content... with prices." */
function OverviewTab({ view, isOwner }: { view: ProfileView; isOwner: boolean }) {
  const featured = view.content.slice(0, 4);

  return (
    <div className="flex flex-col gap-[20px]">
      {featured.length > 0 ? (
        <section className="flex flex-col gap-[12px]">
          <SectionHead title="Featured" href={`${isOwner ? "/create/library" : ""}` || undefined} />
          <div className="grid grid-cols-2 gap-[12px] sm:grid-cols-3 xl:grid-cols-3">
            {featured.map((item) => (
              <ContentCardRow key={item.id} item={item} />
            ))}
          </div>
        </section>
      ) : (
        <EmptyState
          icon="ImagePlus"
          title={isOwner ? "Nothing featured yet" : "Nothing published yet"}
          caption={
            isOwner
              ? "Publish a piece and it shows here, priced, for anybody who opens your profile."
              : `Follow ${view.name.split(" ")[0]} and their first piece reaches you when it lands.`
          }
          action={isOwner ? "Upload something" : "Find similar creators"}
          actionHref={isOwner ? "/create" : "/explore/creators"}
        />
      )}

      {view.communities.length > 0 ? (
        <section className="flex flex-col gap-[12px]">
          <SectionHead title="Communities" />
          <div className="flex flex-col gap-[10px]">
            {view.communities.map((c) => (
              <Link
                key={c.id}
                href={`/communities/${c.id}`}
                className="flex items-center gap-[12px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[13px] no-underline transition-colors hover:border-strong hover:bg-surface-hover"
              >
                <span className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-[13px] bg-[var(--accent-tint)]">
                  <Icon name={c.kind === "private" ? "Lock" : "Users"} size={18} color="var(--accent)" />
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-[2px]">
                  <span className="truncate text-[14px] font-semibold text-[var(--text-primary)]">{c.name}</span>
                  <span className="text-[12px] text-[var(--text-muted)] [font-feature-settings:var(--font-feature-tabular)]">
                    {c.memberCount.toLocaleString("en-NG")} members · {c.kind}
                  </span>
                </span>
                <Icon name="ChevronRight" size={16} color="var(--text-muted)" />
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function ContentTab({ view, isOwner }: { view: ProfileView; isOwner: boolean }) {
  if (view.content.length === 0) {
    return (
      <EmptyState
        icon="ImagePlus"
        title="Nothing published yet"
        caption={
          isOwner
            ? "Every piece you publish appears here with its price."
            : `Follow ${view.name.split(" ")[0]} and their first piece reaches you when it lands.`
        }
        action={isOwner ? "Upload something" : "Find similar creators"}
        actionHref={isOwner ? "/create" : "/explore/creators"}
      />
    );
  }
  return (
    <div className="grid grid-cols-2 gap-[12px] sm:grid-cols-3">
      {view.content.map((item) => (
        <ContentCardRow key={item.id} item={item} />
      ))}
    </div>
  );
}

function ContentCardRow({ item }: { item: ProfileView["content"][number] }) {
  return (
    <Link
      href={`/content/${item.id}`}
      className="flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] no-underline transition-colors hover:border-strong"
    >
      <span className="relative block aspect-video w-full">
        <ContentThumb
          src={item.previewAssetUrl}
          alt=""
          locked={item.locked}
          rounded="0"
          className="absolute inset-0 h-full w-full !border-0"
        />
        <span className="absolute right-[8px] top-[8px]">
          {item.status === "pending" ? (
            <StatusPill kind="warning">In review</StatusPill>
          ) : (
            <PriceChip amount={item.price} label="PPV" free={item.price === 0} tone="plain" size="sm" />
          )}
        </span>
      </span>
      <span className="flex flex-col gap-[3px] px-[12px] pb-[12px] pt-[10px]">
        <span className="truncate text-[14px] font-semibold text-[var(--text-primary)]">{item.title}</span>
        <span className="truncate text-[12px] text-[var(--text-muted)]">{item.kindLabel}</span>
      </span>
    </Link>
  );
}

/**
 * Products.
 *
 * FLAGGED, not faked. C2 asks for a Products tab listing the user's products
 * with prices, and B2 lists products as a listing type. The backend's
 * `Product` model has NO owner: no sellerId, no creator relation. It is
 * WAWU's own curated shop catalogue (it carries `wawuVerified` and `wawuPick`,
 * both admin-set), and there is no creator-facing product upload anywhere in
 * the app - /create offers content types and communities only.
 *
 * So a creator does not own products today, and a tab that listed "their"
 * products would be listing somebody else's. Giving Product an owner and
 * building a seller flow (ownership, moderation, stock, fulfilment) is a real
 * feature, not a rename, and the shop is off the live surface anyway. Raised
 * rather than resolved quietly: DECISIONS.md D9.
 */
function ProductsTab({ isOwner }: { isOwner: boolean }) {
  return (
    <EmptyState
      icon="ShoppingBag"
      title="Products are stocked by WAWU"
      caption={
        isOwner
          ? "The marketplace is WAWU's own catalogue today, so there is nothing here to list yet. Your content, events and services are on the other tabs."
          : "The marketplace is WAWU's own catalogue. Browse it for equipment checked before it is stocked."
      }
      action="Browse the marketplace"
      actionHref="/shop"
    />
  );
}

function EventsTab({ view, isOwner }: { view: ProfileView; isOwner: boolean }) {
  const [events, setEvents] = useState<WawuEvent[] | null>(null);

  useEffect(() => {
    let alive = true;
    listMyEvents(view.wawuId, { perPage: 12 })
      .then((page) => alive && setEvents(page.events))
      .catch(() => alive && setEvents([]));
    return () => {
      alive = false;
    };
  }, [view.wawuId]);

  if (!events) {
    return (
      <div className="grid grid-cols-2 gap-[12px] sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-[200px] rounded-card" />
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <EmptyState
        icon="CalendarDays"
        title={isOwner ? "You are not hosting anything yet" : "No events hosted yet"}
        caption={
          isOwner
            ? "Submit an event and it appears here once an admin approves it."
            : "Nothing on the calendar from this host right now."
        }
        action={isOwner ? "Submit an event" : "Browse the calendar"}
        actionHref={isOwner ? "/events/new" : "/events"}
      />
    );
  }

  return (
    <div className="grid grid-cols-2 gap-[12px] sm:grid-cols-3">
      {events.map((e) => {
        const { month, day } = eventDateParts(e.startsAt);
        return (
          <MediaCard
            key={e.id}
            variant="stacked"
            href={`/events/${e.id}`}
            imageUrl={e.bannerUrl}
            aspect="aspect-[16/10]"
            fallback={<Icon name="CalendarDays" size={30} color="rgba(255,255,255,0.5)" />}
            badge={
              <span className="flex h-[42px] w-[38px] flex-col items-center justify-center rounded-[10px] bg-[var(--accent)] text-[var(--text-on-accent)]">
                <span className="text-[8.5px] font-bold uppercase tracking-[0.08em] opacity-85">{month}</span>
                <span className="text-[15px] font-bold leading-none">{day}</span>
              </span>
            }
            title={e.name}
            caption={e.location}
            tags={[EVENT_CATEGORY_LABEL[e.category], e.format === "online" ? "Online" : "In person"]}
          />
        );
      })}
    </div>
  );
}

function ServicesTab({ view, isOwner }: { view: ProfileView; isOwner: boolean }) {
  const [listings, setListings] = useState<ProfessionalListing[] | null>(null);

  useEffect(() => {
    let alive = true;
    listProfessionals()
      .then((rows) => alive && setListings(rows.filter((r) => r.wawuId === view.wawuId)))
      .catch(() => alive && setListings([]));
    return () => {
      alive = false;
    };
  }, [view.wawuId]);

  if (!listings) return <Skeleton variant="row" />;

  if (listings.length === 0) {
    return (
      <EmptyState
        icon="IdCard"
        title={isOwner ? "You are not listed as a professional yet" : "No services listed"}
        caption={
          isOwner
            ? "Get listed in your field and be paid for your time. A person reviews every application."
            : `${view.name.split(" ")[0]} does not offer professional services here.`
        }
        action={isOwner ? "Offer your services" : "Find a professional"}
        actionHref={isOwner ? "/professionals/apply" : "/professionals"}
      />
    );
  }

  return (
    <div className="flex flex-col gap-[10px]">
      {listings.map((p) => (
        <Link
          key={p.id}
          href={`/professionals/${p.id}`}
          className="flex items-center gap-[12px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[14px] no-underline transition-colors hover:border-strong hover:bg-surface-hover"
        >
          <span className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-[13px] bg-[var(--accent-tint)]">
            <Icon name="BriefcaseBusiness" size={18} color="var(--accent)" />
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-[2px]">
            <span className="truncate text-[14px] font-semibold text-[var(--text-primary)]">{p.headline}</span>
            <span className="truncate text-[12px] text-[var(--text-muted)]">{p.services.join(" · ")}</span>
          </span>
          {/* The price to start, which is what a buyer actually pays. Nothing
              at all where paid messaging is off: there is no default rate and
              quoting one for somebody would be inventing their price. */}
          {p.dmEnabled && p.dmPrice !== null ? (
            <span className="shrink-0 text-[12.5px] font-semibold text-[var(--accent)]">
              {formatNaira(p.dmPrice)}
            </span>
          ) : null}
        </Link>
      ))}
    </div>
  );
}

/* ----------------------------- side panel ------------------------------ */

function PanelCard({
  title,
  isOwner,
  children,
}: {
  title: string;
  isOwner: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-[11px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[16px]">
      <div className="flex items-center justify-between gap-3">
        <h2 className="m-0 text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--text-muted)]">
          {title}
        </h2>
        {isOwner ? (
          <Link
            href="/profile/edit"
            className="text-[12px] font-semibold text-[var(--accent)] no-underline hover:text-text-primary"
          >
            Edit
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function SocialLinksCard({ view, isOwner }: { view: ProfileView; isOwner: boolean }) {
  const links = socialLinks(view.socials);
  if (links.length === 0 && !isOwner) return null;
  return (
    <PanelCard title="Social links" isOwner={isOwner}>
      {links.length === 0 ? (
        <p className="m-0 text-[13px] text-[var(--text-muted)]">
          Nothing added yet. Where people can find you elsewhere goes here.
        </p>
      ) : (
        <div className="flex flex-wrap gap-[8px]">
          {links.map((s) => (
            <a
              key={s.label}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-[34px] items-center gap-[7px] rounded-full border border-[var(--border-hairline)] bg-[var(--surface-tag)] px-[12px] text-[12.5px] font-semibold text-[var(--text-secondary)] no-underline transition-colors hover:border-strong hover:text-text-primary"
            >
              <SocialIcon name={s.icon} size={14} brand />
              {s.label}
            </a>
          ))}
        </div>
      )}
    </PanelCard>
  );
}

function SkillsCard({ view, isOwner }: { view: ProfileView; isOwner: boolean }) {
  const specs = getSpecializations(view.specializations);
  const chips = specs.length > 0 ? specs.map((s) => s.label) : view.specializations;
  if (chips.length === 0 && !isOwner) return null;
  return (
    <PanelCard title="Skills and expertise" isOwner={isOwner}>
      {chips.length === 0 ? (
        <p className="m-0 text-[13px] text-[var(--text-muted)]">
          Nothing chosen yet. This is what people search and filter you by.
        </p>
      ) : (
        <div className="flex flex-wrap gap-[7px]">
          {chips.map((c) => (
            <span
              key={c}
              className="inline-flex h-[30px] items-center rounded-full border border-[var(--border-hairline)] bg-[var(--surface-tag)] px-[12px] text-[12.5px] font-medium text-[var(--text-secondary)]"
            >
              {c}
            </span>
          ))}
        </div>
      )}
    </PanelCard>
  );
}

function AboutCard({ view, isOwner }: { view: ProfileView; isOwner: boolean }) {
  if (!view.bio && !view.location && !view.memberSince && !isOwner) return null;
  return (
    <PanelCard title="About" isOwner={isOwner}>
      {view.bio ? (
        <p className="m-0 text-[13.5px] leading-[1.55] text-[var(--text-secondary)] [text-wrap:pretty]">
          {view.bio}
        </p>
      ) : (
        <p className="m-0 text-[13px] text-[var(--text-muted)]">
          No bio yet. A few lines about what you do helps people decide.
        </p>
      )}
      <div className="flex flex-col gap-[8px]">
        {view.location ? <MetaItem icon="MapPin" text={view.location} /> : null}
        {view.memberSince ? <MetaItem icon="Calendar" text={`On WAWU since ${view.memberSince}`} /> : null}
      </div>
    </PanelCard>
  );
}

/**
 * Turns stored handles into reachable links. Handles are stored bare, so the
 * platform prefix is added here; the link fields are already full URLs and
 * are used as given. A handle someone typed with a leading "@" still works.
 */
function socialLinks(socials: ProfileView["socials"]): { icon: SocialName; label: string; href: string }[] {
  const handle = (v: string) => v.trim().replace(/^@/, "");
  const url = (v: string) => (/^https?:\/\//i.test(v.trim()) ? v.trim() : `https://${v.trim()}`);
  const out: { icon: SocialName; label: string; href: string }[] = [];
  if (socials.instagram) out.push({ icon: "instagram", label: "Instagram", href: `https://instagram.com/${handle(socials.instagram)}` });
  if (socials.x) out.push({ icon: "x", label: "X", href: `https://x.com/${handle(socials.x)}` });
  if (socials.tiktok) out.push({ icon: "tiktok", label: "TikTok", href: `https://tiktok.com/@${handle(socials.tiktok)}` });
  if (socials.youtube) out.push({ icon: "youtube", label: "YouTube", href: url(socials.youtube) });
  if (socials.facebook) out.push({ icon: "facebook", label: "Facebook", href: url(socials.facebook) });
  if (socials.linkedin) out.push({ icon: "linkedin", label: "LinkedIn", href: url(socials.linkedin) });
  if (socials.whatsapp) out.push({ icon: "whatsapp", label: "WhatsApp", href: `https://wa.me/${socials.whatsapp.replace(/\D/g, "")}` });
  if (socials.website) out.push({ icon: "website", label: "Website", href: url(socials.website) });
  return out;
}
