import { Fragment } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { TileCard } from "@/components/ui/TileCard";
import { orderedServices } from "@/lib/platform-services";
import { LandingAuthCta } from "./LandingAuthCta";
import type { IconName } from "@/components/ui/Icon";
import { formatNaira } from "@/lib/format";
import { EarningsCalculator } from "./EarningsCalculator";
import { FaqAccordion } from "./FaqAccordion";
import { HeroRotatingWord } from "./HeroRotatingWord";
import { SmartScheduler } from "./SmartScheduler";

/**
 * What the ecosystem gives access to. Rendered as the journey strip further
 * down, and again under Strategic Ally. The hero card that used to carry it
 * is gone — the hero rail is the two headline numbers and the services now.
 *
 * Two items from the requested list are held back deliberately, because
 * docs/01_SPEC.md forbids both by name and that doc is the tiebreaker:
 *   - "Jobs": spec line 120 cuts jobs/gigs/recruiting entirely, "including
 *     the word 'gigs' anywhere in copy".
 *   - "Wallets": spec section 3 exists specifically to keep Credits from
 *     drifting into wallet territory, and warns that the wallet problem tends
 *     to reappear "under a different name".
 * Both are one word away from going in if that call gets reversed.
 */
const PIPELINE = ["Training", "Payments", "Banking", "Healthcare", "Legal", "Travel"];

/**
 * Exemplary showcase cards for the hero collage. The database has no creators
 * or content yet, so these illustrated tiles are the visual fallback; when
 * real featured content exists, its title/creator/price replace the sample
 * copy while the illustration stays until content carries its own preview.
 */


/**
 * Quick Services — the white-labelled utilities that sit alongside the
 * creator product. Each is a real destination in the app; `soon` marks the
 * ones whose partner API has not landed yet, and those deliberately do not
 * link anywhere rather than opening a dead screen.
 */
/**
 * The services strip. Every icon shares one colour, Electric Lilac from the
 * brand sheet, rather than one colour per service: a row of seven different
 * colours competed with itself, and this is a directory, not a chart.
 */
/**
 * The services strip.
 *
 * Telemedicine is named but not yet openable. Grants and Travel are held back
 * entirely until they are ready to announce.
 *
 * Basket and Beauty are separate products with their own marks and brand
 * colours, so they carry a logo rather than an icon.
 */
/*
  The service rail reads PLATFORM_SERVICES (src/lib/platform-services.ts).

  The list used to live here, inline, which is why /services showed a
  different set with different names and different icons: two lists, one of
  them read by one page. Product owner, 21 Sep 2026: "services should carry
  only the services that shows in the landing page." That is only enforceable
  if there is one list, so this page no longer owns it.

  The landing makes no catalogue call, so the list's own `soon` flag decides
  what is open here. /services layers the live catalogue status on top.
*/
const ORDERED_QUICK_SERVICES = orderedServices();

/**
 * The two storefronts, as ordinary entries in the services directory.
 *
 * They used to get their own oversized row below — a gradient card each,
 * tinted in their brand colour, carrying a wordmark and a strip of category
 * tags. That made two of WAWU's smaller surfaces the loudest thing in the
 * hero, and it left the services grid above them sitting with empty cells.
 *
 * They are the same shape as everything else now: a chip, a name, one row.
 * The ONLY thing that stays branded is the mark inside the chip — Basket's
 * green and Beauty's pink are how somebody recognises them at a glance, and
 * they are the icon alone, not the logo lockup, because a wordmark cannot be
 * read at 22px and a second name beside the label is a stutter.
 */

/**
 * The mark, set between sections as a watermark.
 *
 * A quiet divider rather than decoration: it gives each section a beginning
 * without another rule across the page, and it is the icon alone — no
 * wordmark, because the name is already in the nav, the hero and the footer,
 * and a fourth reading of it is noise.
 *
 * Bigger and fainter on desktop: 80px at 6% rather than 36px at 14%. The two
 * move together on purpose — a watermark reads as a watermark through scale
 * and near-absence, and a small mark at 14% is just a small logo. Mobile
 * keeps 28px at 14%, because 80px on a 390px screen is not a watermark, it is
 * a section of its own.
 *
 * `aria-hidden` and no alt text: it separates, it does not say anything, and
 * a screen reader announcing "WAWU" eight times between sections is worse
 * than silence.
 */
function SectionMark() {
  return (
    <div className="flex justify-center py-2 dt:py-4" aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/wawu-icon-white.svg"
        alt=""
        className="h-7 w-auto opacity-[0.14] dt:h-20 dt:opacity-[0.06]"
      />
    </div>
  );
}

/**
 * The App Store and Play Store badges, marked coming soon.
 *
 * Deliberately NOT links. There is no app to download yet, so a badge that
 * navigated anywhere would either 404 or land somebody on a store page with
 * no WAWU on it — and a store badge is the most clickable thing on a page,
 * so it has to be honest about being inert. They are plain divs with a
 * "Coming soon" line, not anchors and not buttons.
 *
 * The Apple and Google marks are drawn as SVG paths rather than fetched from
 * either company's badge CDN: an external image here would be a third-party
 * request on the landing page, and both companies' badge assets carry usage
 * terms about not altering them, which a "coming soon" overlay would do.
 */
/**
 * The App Store and Google Play badges.
 *
 * Not links, and greyed. There is no app to download, so a badge that
 * navigated anywhere would 404 or land somebody on a store with no WAWU on
 * it — and a store badge is the most clickable thing on a page, so it has to
 * be honest about being inert. Greying them to the weight of the watermark
 * says "not yet" without a word.
 *
 * Two sizes because they appear twice, and the two placements want different
 * things: the standalone row is a moment on the page, the footer pair is a
 * detail beside the copyright. Same component either way — a second copy is
 * how the two drift apart.
 */
function StoreBadges({ size = "lg" }: { size?: "lg" | "sm" }) {
  const badges = [
    {
      name: "App Store",
      lead: "Download on the",
      // Apple's mark.
      path: "M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z",
    },
    {
      name: "Google Play",
      lead: "Get it on",
      // A simplified Play triangle.
      path: "M3.6 2.4c-.35.2-.6.6-.6 1.1v17c0 .5.25.9.6 1.1l9.5-9.6-9.5-9.6zM14.3 13.1l2.6 2.6-9.9 5.6 7.3-8.2zM17.7 10.4l2.9 1.6c.6.35.6 1.25 0 1.6l-2.9 1.6-2.9-2.4 2.9-2.4zM14.3 10.9L7 2.7l9.9 5.6-2.6 2.6z",
    },
  ];
  const sm = size === "sm";

  return (
    <div
      className={
        sm
          ? "flex items-stretch gap-2"
          : "mx-auto flex w-full max-w-[520px] items-stretch justify-center gap-3 px-5 py-8 dt:gap-4 dt:py-10"
      }
    >
      {badges.map((s) => (
        <div
          key={s.name}
          className={[
            // basis-0 grow so both are the SAME width whatever their label
            // says. Auto-width made "Google Play" wider than "App Store" and
            // wrapped them onto two rows on a phone.
            "flex basis-0 grow items-center justify-center rounded-[11px] border border-hairline bg-card opacity-40",
            sm ? "h-[42px] gap-1.5 px-2.5" : "h-[52px] gap-2 px-2.5 dt:h-[58px] dt:gap-2.5 dt:px-4",
          ].join(" ")}
        >
          <svg
            viewBox="0 0 24 24"
            className={`shrink-0 fill-text-secondary ${sm ? "h-4 w-4" : "h-5 w-5 dt:h-6 dt:w-6"}`}
            aria-hidden="true"
          >
            <path d={s.path} />
          </svg>
          <span className="flex min-w-0 flex-col leading-tight">
            <span className={`truncate uppercase tracking-[0.06em] text-text-muted ${sm ? "text-[7.5px]" : "text-[8.5px] dt:text-[9.5px]"}`}>
              {s.lead}
            </span>
            <span className={`truncate font-bold text-text-secondary ${sm ? "text-[11px]" : "text-[12.5px] dt:text-[14px]"}`}>
              {s.name}
            </span>
          </span>
        </div>
      ))}
    </div>
  );
}

const STREAMS: { icon: IconName; title: string; blurb: string }[] = [
  { icon: "Palette", title: "Creative Works", blurb: "Sell what you make" },
  { icon: "BriefcaseBusiness", title: "Professionals", blurb: "Book verified lawyers, doctors and more" },
  { icon: "MessageCircle", title: "Premium Messaging", blurb: "Cash in on your WOW" },
  { icon: "UserRoundSearch", title: "Training & Consultations", blurb: "Turn expertise into income" },
  { icon: "Landmark", title: "Lifestyle Services", blurb: "Legal, health, payments and more" },
  { icon: "Users", title: "Group Chats", blurb: "Earn on every message" },
];

interface CompareRow {
  feature: string;
  wawu: string | boolean;
  others: (string | boolean)[];
}

const COMPARE_ROWS: CompareRow[] = [
  { feature: "Platform Fees", wawu: "15% (you keep 85%)", others: ["10-20% + /txn", "20%", "20%"] },
  { feature: "Training & Upskilling", wawu: "Training included for members", others: [false, false, false] },
  { feature: "Government Partnerships", wawu: "Federal Government-approved", others: [false, false, false] },
  { feature: "Device & Equipment Financing", wawu: "Partnerships", others: [false, false, false] },
  { feature: "Faith & Community Approach", wawu: true, others: [false, false, false] },
  { feature: "Content Types", wawu: "Videos, Articles, Audio, Courses, Products", others: ["Videos (up to 10GB), Photos, Audio, PDFs", "Videos, Photos, Audio, PDFs", "Videos & Photos"] },
  /*
    Two rows were removed here, both because they claimed a feature WAWU
    does not have. A comparison table is the most load-bearing copy on the
    site: it is read as a promise, and a tick in the WAWU column against
    something that does not exist is the `unbacked_promises` defect in its
    purest form.

      "Lifetime Memberships"           - memberships went with subscriptions.
                                         Nothing is sold on a recurring basis
                                         and there is no membership to hold
                                         for a lifetime.
      "Membership Trials & Promo Codes" - the 7-day WAWU Credits trial was
                                         removed on 21 Sep 2026, and the
                                         promo/referral codes that discounted
                                         subscriptions went with the plans
                                         they discounted.

    Restore either row only alongside the feature it describes.
  */
  { feature: "Paid DMs", wawu: true, others: [true, false, true] },
  { feature: "1-on-1 Calls", wawu: true, others: [true, false, false] },
  { feature: "Group Chats", wawu: true, others: [true, false, false] },
  { feature: "Analytics per post & message", wawu: true, others: [true, false, false] },
  { feature: "Smart Vault", wawu: true, others: [true, false, false] },
  { feature: "Instant Payouts", wawu: true, others: [true, false, false] },
  { feature: "Scheduler", wawu: true, others: [true, false, false] },
  { feature: "No fee to join or list", wawu: true, others: [false, false, false] },
];

const FAQ = [
  { q: "What % of earnings does the platform take?", a: "WAWUAfrica takes 15% as standard. You keep 85% of everything you earn: content unlocks, paid DMs, tips and storefront sales. There is no listing fee, no monthly platform fee and no subscription." },
  { q: "Do I need to be verified to publish?", a: "No. Creator is an account type, pick it at signup or switch to it later, and publishing costs nothing. KYC is separate and only gates when you can receive payouts." },
  { q: "How quickly can I get paid out?", a: "Earnings are paid to your own bank account once KYC clears, never held in a platform wallet. No stories." },
  { q: "Is there a minimum follower count to join?", a: "No. Whether you are just starting or an established creator ready to scale, you can join today and start publishing. Your first piece goes out at no charge, you price everything after that." },
  { q: "What happens if a creator never replies to a paid DM?", a: "The sender is refunded in full after 24 hours and WAWU takes no fee on that refund. Creators who repeatedly miss the window have DMs switched off automatically." },
  { q: "What are WAWU Credits?", a: "Prepaid message units for open communities, one credit sends one message. They are a count, not a cash balance, and they are never converted back to naira." },
];

function CaptionPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex h-[32px] items-center gap-2 rounded-full border border-hairline bg-[rgba(255,255,255,0.05)] px-4 text-[11.5px] font-bold uppercase tracking-[0.12em] text-text-primary">
      <span className="h-1.5 w-1.5 rounded-full bg-accent" />
      {children}
    </span>
  );
}

function WhitePill({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex h-[54px] items-center gap-2 rounded-button bg-white px-8 text-[15px] font-semibold text-on-light shadow-float transition-transform duration-200 hover:scale-[1.03]"
    >
      {children}
      <Icon name="ArrowRight" size={16} color="var(--text-on-light)" strokeWidth={2.2} />
    </Link>
  );
}

function CheckOrX({ value, accent }: { value: string | boolean; accent?: boolean }) {
  if (typeof value === "boolean") {
    return value ? (
      <Icon name="Check" size={17} color="var(--success)" strokeWidth={2.6} />
    ) : (
      <Icon name="X" size={16} color={accent ? "var(--text-secondary)" : "var(--danger)"} strokeWidth={2.2} />
    );
  }
  return <span className={`text-[13px] leading-snug ${accent ? "font-semibold text-text-primary" : "text-text-secondary"}`}>{value}</span>;
}

export async function LandingContent() {
  return (
    <div className="relative min-h-screen overflow-x-clip bg-page">
      <div className="wawu-gridlines" aria-hidden="true" />

      {/* Floating pill nav */}
      <header className="fixed left-1/2 top-3.5 z-50 flex w-[min(1240px,calc(100%-24px))] -translate-x-1/2 items-center gap-2 rounded-full border border-hairline bg-[rgba(19,19,22,0.78)] py-2 pl-5 pr-2 backdrop-blur-xl dt:top-5 dt:gap-8 dt:py-2.5 dt:pl-7 dt:pr-2.5">
        <img src="/wawu-logo-white.png" alt="WAWU" className="h-[22px] w-auto object-contain dt:h-[24px]" />
        <nav className="hidden items-center gap-7 dt:flex" aria-label="Marketing">
          <a href="/explore" className="text-[14px] font-medium text-text-secondary hover:text-text-primary">Creators</a>
          <a href="/learn" className="text-[14px] font-medium text-text-secondary hover:text-text-primary">Resources</a>
        </nav>
        <span className="flex-1" />
        <LandingAuthCta />
      </header>

      <main className="relative z-10">
        {/* ============ HERO ============ */}
        <section className="relative px-5 pb-6 pt-[120px] dt:pb-8 dt:pt-[190px]">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-[560px] bg-[radial-gradient(ellipse_55%_45%_at_50%_18%,var(--accent-tint-strong),transparent_70%)]"
            aria-hidden="true"
          />
          <div className="relative mx-auto flex max-w-[1080px] flex-col items-center text-center">
            <span className="inline-flex min-h-[34px] items-center gap-2.5 rounded-full border border-accent bg-[rgba(11,10,13,0.6)] px-4 py-1.5 text-[10.5px] font-bold uppercase tracking-[0.1em] text-accent-hover shadow-[0_0_24px_var(--accent-tint-strong)] dt:px-5 dt:text-[12px] dt:tracking-[0.14em]">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              <span className="dt:hidden">Keep 85% of what you earn</span>
              <span className="hidden dt:inline">Keep 85% of everything you earn, best in Africa</span>
            </span>
            <h1 className="m-0 mt-7 text-[46px] font-bold leading-[1.02] tracking-[-0.04em] text-text-primary dt:text-[88px]">
              Turn Your WOW
              <br />
              <HeroRotatingWord className="text-accent-hover [text-shadow:0_0_60px_var(--accent-tint-strong)]" />
            </h1>
            <p className="m-0 mt-6 max-w-[540px] text-[17px] leading-relaxed text-text-secondary dt:text-[19px]">
              Build. Earn. Grow. Thrive. All in one place.
            </p>
          </div>

          {/*
            The hero art: two images (creators, professionals) crossfading on
            a loop, asked for once WAWU had a shot for each and wanted both
            shown rather than picking one. Each image still gets its own
            mobile portrait cut and desktop wide cut exactly as before — the
            crossfade and the mobile/desktop swap are two INDEPENDENT axes,
            not four images to pick from by hand. Concretely: one `<picture>`
            per subject, each still carrying its own `source media` breakpoint
            switch, and the two `<picture>`s stacked on top of each other via
            `absolute inset-0` with opposite-phase opacity animations
            (`wawuHeroFadeA` / `wawuHeroFadeB`, tokens.css) so at every moment
            exactly one is fully opaque. `aspect-[...]` on the wrapper (not a
            height driven by the `<img>`, which is now positioned out of
            flow) is what keeps the space reserved at both breakpoints so
            nothing collapses. `motion-safe:` gates the animation entirely;
            under `prefers-reduced-motion` the creators cut is what's shown,
            static, and the professionals layer's own base `opacity-0` simply
            never gets an animation to override it.
          */}
          <div className="relative mx-auto mt-12 aspect-[1024/1536] w-full max-w-[360px] dt:mt-14 dt:aspect-[1536/1024] dt:max-w-[1020px]">
            <picture className="absolute inset-0 flex items-center justify-center motion-safe:animate-[wawuHeroFadeA_10s_ease-in-out_infinite]">
              <source media="(min-width: 1024px)" srcSet="/wawu-hero-desktop-creators.png" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/wawu-hero-mobile-creators.png"
                alt="WAWU creators on the app."
                className="h-full w-full object-contain"
                loading="eager"
                decoding="async"
              />
            </picture>
            <picture className="absolute inset-0 flex items-center justify-center opacity-0 motion-safe:animate-[wawuHeroFadeB_10s_ease-in-out_infinite]">
              <source media="(min-width: 1024px)" srcSet="/wawu-hero-desktop-professionals.png" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/wawu-hero-mobile-professionals.png"
                alt="WAWU professionals on the app."
                className="h-full w-full object-contain"
                loading="eager"
                decoding="async"
              />
            </picture>
          </div>

          {/*
            The services as a fixed grid, not a rail.

            Was a sliding/auto-scrolling marquee; the product owner called
            that "just bad" and asked for it gone outright ("it's no more a
            slider"), titles only (no subtitle line), a not-yet-open service
            shown as visually disabled rather than captioned "Coming soon",
            and a layout that is 4-per-row over two lines on mobile and one
            straight line on desktop. Mobile stays `grid-cols-4` (2 rows,
            each tile filling its column) but desktop is a centered flex row,
            not `grid-cols-8`: eight equal-width columns spread across the
            full content width put far more air between tiles than between
            an icon and its own label, reading as scattered rather than as
            one row. Flex with a fixed gap sizes each tile to its own content
            instead, so the row reads as a group.

            No card, no outer panel: bare icons, close together. A boxed
            version of this (per-icon border, plus a panel around the whole
            grid) was tried and asked back out — "remove the containers,
            just icons and text... let them be close, not spaced between".

            The grid itself is capped at the same 360px the hero art uses on
            mobile, not left to `mx-auto` alone. Below the 1024px `dt:`
            cutoff a tablet-width viewport still gets this 4-column grid (the
            flex row is a desktop-only swap), and with no cap the columns
            stretch to fill the tablet's much wider content area, scattering
            the icons across the row ("tablet mode has grave spaces"). The
            cap keeps the grid tile-sized at every width until `dt:` hands it
            off to the flex row, which is free to use the full desktop width.
          */}
          <div className="mx-auto mt-4 grid max-w-[360px] grid-cols-4 place-items-center gap-0 dt:mt-4 dt:flex dt:max-w-none dt:flex-row dt:flex-wrap dt:justify-center dt:gap-0">
            {ORDERED_QUICK_SERVICES.map((service) => (
              <TileCard
                key={service.brand}
                layout="stacked"
                size="sm"
                title={service.brand}
                icon={service.icon}
                iconImageSrc={service.iconImageSrc}
                // Not yet openable, so deliberately not a link: a card
                // that navigates nowhere is worse than one saying so.
                // Also the "visually disabled" signal now that there is no
                // "Coming soon" caption to say it in words.
                {...(service.href && !service.soon ? { href: service.href } : { disabled: true })}
              />
            ))}
          </div>
        </section>

        {/* The badges stand alone here: no SectionMark above them, so the
            row itself is the break between sections rather than a logo and
            then a second thing. */}
        <StoreBadges />

        {/* ============ WOW EXPERIENCE BENTO (dashboard) ============ */}
        <section className="px-5 py-14 dt:py-24">
          <div className="mx-auto max-w-[1240px]">
            <div className="flex flex-col items-center text-center">
              <span className="text-[12px] font-bold uppercase tracking-[0.14em] text-text-primary">Giving the WOW Experience</span>
              <h2 className="m-0 mt-3 text-[36px] font-bold leading-[1.06] tracking-[-0.03em] text-text-primary dt:text-[58px]">
                YES, You Too Can <span className="text-accent-hover">Make It Big.</span>
              </h2>
              <p className="m-0 mt-4 max-w-[520px] text-[15.5px] leading-relaxed text-text-secondary dt:text-[17px]">
                Treat your WOW like a business and get paid when you give value.
              </p>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-5 dt:mt-14 dt:grid-cols-[380px_1fr]">
              {/* Mass Messaging panel */}
              <div className="flex flex-col overflow-hidden rounded-card border border-[rgba(255,255,255,0.12)] bg-[linear-gradient(165deg,var(--accent),var(--accent-deep))] p-6 dt:p-7">
                <div className="grid min-h-[170px] flex-1 place-items-center py-6" aria-hidden="true">
                  <span className="animate-[wawuFloat_6.5s_ease-in-out_infinite]">
                    <Icon name="Send" size={84} color="rgba(255,255,255,0.9)" strokeWidth={1.1} className="drop-shadow-[0_0_30px_rgba(255,255,255,0.35)]" />
                  </span>
                </div>
                <span className="text-[19px] font-bold text-white">Mass Messaging</span>
                <p className="m-0 mt-1.5 text-[13.5px] leading-normal text-[rgba(255,255,255,0.78)]">
                  Reach thousands of followers instantly with targeted messages and promotions.
                </p>
              </div>

              {/* Real-Time Earnings panel with animated notifications */}
              <div className="flex flex-col gap-5 overflow-hidden rounded-card border border-[rgba(255,255,255,0.12)] bg-[linear-gradient(160deg,color-mix(in_srgb,var(--accent)_38%,var(--wawu-ink)),var(--wawu-ink))] p-6 dt:flex-row dt:items-center dt:p-8">
                <div className="dt:flex-1">
                  <span className="grid h-11 w-11 place-items-center rounded-[13px] bg-[rgba(255,255,255,0.14)]">
                    <Icon name="Zap" size={19} color="var(--text-on-accent)" strokeWidth={2} />
                  </span>
                  <span className="mt-4 block text-[21px] font-bold text-white">Real-Time Earnings</span>
                  <p className="m-0 mt-2 max-w-[340px] text-[14px] leading-normal text-[rgba(255,255,255,0.78)]">
                    Watch your income grow with content sales, tips, paid messages, commerce, and more.
                  </p>
                </div>
                <div className="flex w-full flex-col gap-2.5 dt:w-[340px]">
                  {[
                    { icon: "Crown" as IconName, label: "Course Sold", meta: "Lemuel bought your course", amount: "+₦4,999", delay: "0s" },
                    { icon: "UserPlus" as IconName, label: "Paid Message", meta: "Ella asked a question", amount: "+₦999", delay: "1.3s" },
                    { icon: "Lock" as IconName, label: "PPV Unlocked", meta: "Exclusive content", amount: "+₦2,000", delay: "2.6s" },
                    { icon: "HandCoins" as IconName, label: "Tip Received", meta: "Marcus sent a tip", amount: "+₦500", delay: "3.9s" },
                  ].map((n) => (
                    <div
                      key={n.label}
                      className="flex items-center gap-3 rounded-input border border-[rgba(255,255,255,0.14)] bg-[rgba(11,10,13,0.45)] px-3.5 py-2.5 backdrop-blur animate-[wawuNotifPulse_5.2s_ease-in-out_infinite]"
                      style={{ animationDelay: n.delay }}
                    >
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[rgba(255,255,255,0.12)]">
                        <Icon name={n.icon} size={14} color="var(--text-on-accent)" strokeWidth={2.1} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[12.5px] font-semibold text-white">{n.label}</span>
                        <span className="block truncate text-[11px] text-[rgba(255,255,255,0.6)]">{n.meta}</span>
                      </span>
                      <span className="shrink-0 text-[13px] font-bold text-success [font-feature-settings:var(--font-feature-tabular)]">{n.amount}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* WOW Vault panel */}
              <div className="flex flex-col rounded-card border border-[rgba(255,255,255,0.12)] bg-[linear-gradient(160deg,color-mix(in_srgb,var(--accent)_38%,var(--wawu-ink)),var(--wawu-ink))] p-6 dt:col-span-1 dt:p-7">
                <span className="flex items-center gap-2.5 text-[19px] font-bold text-white">
                  <Icon name="Vault" size={19} color="var(--text-on-accent)" strokeWidth={2} />
                  WOW Vault
                </span>
                <p className="m-0 mt-2 text-[13.5px] leading-normal text-[rgba(255,255,255,0.78)]">
                  Organize, schedule, and monetize your content, products, and services. Set prices, lock exclusives, and release steadily to keep your audience engaged.
                </p>
                <div className="mt-5 grid grid-cols-2 gap-2.5">
                  {[
                    { label: "PPV", icon: "Lock" as IconName },
                    { label: "Scheduled", icon: "Clock" as IconName },
                    { label: "Audience Favorite", icon: "Heart" as IconName },
                    { label: "Exclusive Behind-the-Scenes", icon: "Clapperboard" as IconName },
                  ].map((chip) => (
                    <span
                      key={chip.label}
                      className="flex flex-col items-center gap-2 rounded-media border border-[rgba(255,255,255,0.16)] bg-[rgba(255,255,255,0.09)] px-3 py-4 text-center text-[11.5px] font-semibold text-white backdrop-blur"
                    >
                      <Icon name={chip.icon} size={18} color="var(--text-on-accent)" strokeWidth={2} />
                      {chip.label}
                    </span>
                  ))}
                </div>
              </div>

              {/* Smart Scheduler panel: the real, interactive widget */}
              <div className="rounded-card border border-[rgba(255,255,255,0.12)] bg-[linear-gradient(160deg,color-mix(in_srgb,var(--accent)_38%,var(--wawu-ink)),var(--wawu-ink))] p-6 dt:p-7">
                <SmartScheduler />
              </div>
            </div>
          </div>
        </section>

        <SectionMark />

        {/* ============ WOW REVENUE STREAMS ============ */}
        <section className="px-5 py-14 dt:py-24">
          <div className="mx-auto max-w-[1240px]">
            <div className="flex flex-col items-center text-center">
              <span className="text-[12px] font-bold uppercase tracking-[0.14em] text-text-primary">WOW Revenue Streams</span>
              <h2 className="m-0 mt-3 text-[36px] font-bold leading-[1.06] tracking-[-0.03em] text-text-primary dt:text-[58px]">
                Monetize The WOW <span className="text-accent-hover">About You</span>
              </h2>
              <p className="m-0 mt-4 max-w-[640px] text-[15.5px] leading-relaxed text-text-secondary dt:text-[17px]">
                God has given you everything that pertains to Life. Stop leaving Greatness in Your Neighborhood. The world wants more ways to support you.
              </p>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-4 dt:mt-14 dt:grid-cols-[420px_1fr] dt:gap-5">
              {/* Featured: Membership */}
              <div className="relative flex flex-col overflow-hidden rounded-card border border-hairline bg-card p-7">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_50%_38%,var(--accent-tint-strong),transparent_72%)]" aria-hidden="true" />
                <div className="relative grid min-h-[220px] flex-1 place-items-center py-8 dt:min-h-0">
                  <span className="animate-[wawuFloat_6.5s_ease-in-out_infinite]" aria-hidden="true">
                    <Icon name="Ticket" size={130} color="var(--accent-hover)" strokeWidth={1.1} className="drop-shadow-[0_0_34px_var(--accent)]" />
                  </span>
                </div>
                <div className="relative">
                  <span className="text-[11.5px] font-bold uppercase tracking-[0.1em] text-text-secondary">● Events</span>
                  <span className="mt-2 block text-[24px] font-bold tracking-[-0.02em] text-text-primary">Fill a room, and keep what it makes</span>
                  <p className="m-0 mt-2 text-[14px] leading-normal text-text-secondary">
                    List an event, gather the people who already follow you, and sell from the same profile.
                  </p>
                </div>
              </div>

              {/* Icon tile grid */}
              <div className="grid grid-cols-2 gap-4 dt:grid-cols-3 dt:gap-5">
                {STREAMS.map((s) => (
                  <div key={s.title} className="group flex flex-col rounded-card border border-hairline bg-card p-4 transition-colors duration-200 hover:border-strong dt:p-5">
                    <span className="grid aspect-[4/3] place-items-center rounded-media bg-[radial-gradient(ellipse_at_center,var(--accent-tint),transparent_75%)]">
                      <Icon
                        name={s.icon}
                        size={44}
                        color="var(--accent-hover)"
                        strokeWidth={1.4}
                        className="drop-shadow-[0_0_20px_var(--accent)] transition-transform duration-300 group-hover:scale-110"
                      />
                    </span>
                    <span className="mt-3 text-[15px] font-bold leading-snug text-text-primary">{s.title}</span>
                    <span className="mt-1 text-[12.5px] text-text-muted">{s.blurb}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-1 gap-y-2" aria-label="The WAWU pipeline">
              {PIPELINE.map((step, i) => (
                <span key={step} className="flex items-center">
                  <span className="inline-flex h-8 items-center rounded-full border border-hairline bg-tag px-3 text-[12px] font-medium text-text-secondary">{step}</span>
                  {i < PIPELINE.length - 1 ? <Icon name="ChevronRight" size={14} color="var(--text-muted)" /> : null}
                </span>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-3.5">
              <WhitePill href="/sign-up?type=creator">Cash in on your WOW</WhitePill>
              <Button size="lg" variant="secondary" href="#pricing">See what it costs</Button>
            </div>
          </div>
        </section>

        <SectionMark />

        {/* ============ EARNING POTENTIAL ============ */}
        <section className="px-5 py-14 dt:py-24">
          <div className="mx-auto grid max-w-[1240px] grid-cols-1 items-center gap-10 rounded-[28px] border border-hairline bg-[linear-gradient(150deg,var(--surface-card),rgba(71,20,113,0.28))] p-6 dt:grid-cols-2 dt:gap-14 dt:p-12">
            <div className="flex flex-col items-start">
              <CaptionPill>Creator Earnings</CaptionPill>
              <h2 className="m-0 mt-5 text-[36px] font-bold leading-[1.05] tracking-[-0.03em] text-text-primary dt:text-[54px]">
                See Your
                <br />
                <span className="text-accent-hover">Earning Potential</span>
              </h2>
              <p className="m-0 mt-4 max-w-[420px] text-[15px] leading-relaxed text-text-secondary">
                Calculate how much you could earn on WAWU with your audience.
              </p>
              <div className="mt-8 flex flex-wrap gap-x-10 gap-y-5">
                {[
                  { big: "85%", small: "You Keep" },
                  { big: "No Hassle", small: "Payouts" },
                  { big: "No Hidden", small: "Fees" },
                ].map((s) => (
                  <span key={s.small} className="flex flex-col">
                    <span className="text-[22px] font-bold tracking-[-0.02em] text-text-primary">{s.big}</span>
                    <span className="text-[12.5px] text-text-muted">{s.small}</span>
                  </span>
                ))}
              </div>
              <div className="mt-9">
                <WhitePill href="/sign-up?type=creator">Start monetizing today</WhitePill>
              </div>
            </div>
            <EarningsCalculator />
          </div>
        </section>

        <SectionMark />

        {/* ============ WHAT IT COSTS ============ */}
        {/*
          This was the CREATOR TIERS section: three PLANS cards (Basic, Pro,
          Pro Max) with yearly prices and a "Go Pro" button. Subscriptions were
          removed from the product, so there are no plans to render.

          The section itself stays, and keeps `id="pricing"`, because the
          footer and a hero button both link to `#pricing` — deleting it would
          have left two controls scrolling to nothing. What somebody clicking
          "what does this cost" needs to read is now the honest answer.
        */}
        <section id="pricing" className="relative px-5 py-14 dt:py-20">
          <div className="relative mx-auto max-w-[1240px]">
            <div className="flex flex-col items-center text-center">
              <span className="text-[12px] font-bold uppercase tracking-[0.14em] text-text-primary">What it costs</span>
              <h2 className="m-0 mt-3 text-[34px] font-bold leading-[1.06] tracking-[-0.03em] text-text-primary dt:text-[48px]">
                Join at no charge, <span className="text-accent-hover">list at no charge</span>
              </h2>
              <p className="m-0 mt-4 max-w-[560px] text-[15px] leading-normal text-text-secondary">
                There is no subscription and no monthly platform fee. Creating your account, building your profile
                and listing your work cost nothing.
              </p>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-4 dt:grid-cols-3 dt:gap-5">
              <div className="flex flex-col gap-4 rounded-card border border-accent bg-elevated p-6 shadow-[0_0_60px_var(--accent-tint)]">
                <span className="text-[16px] font-semibold text-text-primary">Joining</span>
                <span className="text-[34px] font-bold tracking-[-0.03em] [font-feature-settings:var(--font-feature-tabular)]">
                  {formatNaira(0)}
                </span>
                <div className="flex flex-col gap-2.5">
                  {[
                    "Create your account and profile",
                    "List up to 5 products, pieces or services",
                    "Turn on paid messages",
                    "Host a community",
                    "Browse, buy and message",
                  ].map((perk) => (
                    <span key={perk} className="flex items-start gap-2.5 text-[13.5px] leading-[1.4] text-text-secondary">
                      <Icon name="Check" size={15} color="var(--accent)" strokeWidth={2.4} className="mt-[2px] shrink-0" />
                      {perk}
                    </span>
                  ))}
                </div>
                <Button full href="/sign-up?type=creator" className="mt-auto">Start at no charge</Button>
              </div>

              <div className="flex flex-col gap-4 rounded-card border border-hairline bg-card p-6">
                <span className="text-[16px] font-semibold text-text-primary">When you sell</span>
                <span className="text-[34px] font-bold tracking-[-0.03em] [font-feature-settings:var(--font-feature-tabular)]">
                  85/15
                </span>
                <p className="m-0 text-[13.5px] leading-[1.45] text-text-secondary">
                  You keep 85% of everything you earn: content unlocks, paid messages, tips and storefront sales.
                  Nothing is taken until something sells.
                </p>
                <span className="text-[12.5px] leading-[1.45] text-text-muted">
                  Community credits pay the host on the same 85%.
                </span>
              </div>

              <div className="flex flex-col gap-4 rounded-card border border-hairline bg-card p-6">
                <span className="text-[16px] font-semibold text-text-primary">Optional extras</span>
                <span className="text-[13.5px] leading-[1.45] text-text-secondary">
                  Pay only for the things you choose to add:
                </span>
                <div className="flex flex-col gap-2.5">
                  {[
                    "Verification, reviewed by a person",
                    "Featuring your listing",
                    "Advertising on the platform",
                    "WAWU Credits for community chat",
                  ].map((perk) => (
                    <span key={perk} className="flex items-start gap-2.5 text-[13.5px] leading-[1.4] text-text-secondary">
                      <Icon name="Check" size={15} color="var(--accent)" strokeWidth={2.4} className="mt-[2px] shrink-0" />
                      {perk}
                    </span>
                  ))}
                </div>
                <Button full variant="secondary" href="/sign-up" className="mt-auto">Join now</Button>
              </div>
            </div>
          </div>
        </section>

        <SectionMark />

        {/* ============ WOW FRAMEWORK: insights + chart ============ */}
        <section className="px-5 py-14 dt:py-24">
          <div className="mx-auto grid max-w-[1240px] grid-cols-1 items-center gap-10 dt:grid-cols-[1fr_1.1fr] dt:gap-16">
            <div className="flex flex-col items-start">
              <CaptionPill>Your WOW Framework</CaptionPill>
              <h2 className="m-0 mt-5 text-[36px] font-bold leading-[1.05] tracking-[-0.03em] text-text-primary dt:text-[54px]">
                M&amp;E Insights.
                <br />
                <span className="text-accent-hover">Instant Payouts.</span>
              </h2>
              <p className="m-0 mt-4 max-w-[440px] text-[15px] leading-relaxed text-text-secondary">
                Know exactly which WOW about you drives revenue. Get paid when you want with instant payouts. No stories.
              </p>
              <div className="mt-9 flex gap-12">
                <span className="flex flex-col">
                  <span className="text-[30px] font-bold tracking-[-0.02em] text-text-primary [font-feature-settings:var(--font-feature-tabular)]">₦2.4M</span>
                  <span className="mt-1 text-[11px] font-bold uppercase tracking-[0.08em] text-text-muted">Avg Monthly Revenue</span>
                </span>
                <span className="flex flex-col">
                  <span className="text-[30px] font-bold tracking-[-0.02em] text-text-primary [font-feature-settings:var(--font-feature-tabular)]">₦860k</span>
                  <span className="mt-1 text-[11px] font-bold uppercase tracking-[0.08em] text-text-muted">Last Instant Payout</span>
                </span>
              </div>
            </div>

            <div className="rounded-card border border-hairline bg-card p-5 dt:p-7">
              <div className="flex items-start justify-between">
                <span className="flex flex-col">
                  <span className="text-[15.5px] font-semibold text-text-primary">Monthly Revenue</span>
                  <span className="text-[12.5px] text-text-muted">Real-time Growth</span>
                </span>
                <span className="inline-flex h-[26px] items-center gap-1.5 rounded-full border border-[rgba(184,232,62,0.4)] bg-success-tint px-2.5 text-[12px] font-bold text-success">
                  <Icon name="TrendingUp" size={12} color="var(--success)" strokeWidth={2.4} />
                  +124% YoY
                </span>
              </div>
              <svg viewBox="0 0 480 230" className="mt-4 w-full" role="img" aria-label="Monthly revenue growth chart, up 124% year on year">
                <defs>
                  <linearGradient id="wawuArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {[0, 1, 2, 3].map((i) => (
                  <line key={i} x1="36" x2="480" y1={30 + i * 50} y2={30 + i * 50} stroke="var(--border-hairline)" strokeWidth="1" />
                ))}
                {["₦16M", "₦12M", "₦8M", "₦4M"].map((label, i) => (
                  <text key={label} x="0" y={34 + i * 50} fill="var(--text-muted)" fontSize="10" fontFamily="var(--font-sans)">
                    {label}
                  </text>
                ))}
                <path
                  d="M36,196 C80,190 110,184 148,172 C186,160 214,152 252,134 C290,116 318,108 356,86 C394,64 428,46 480,24 L480,214 L36,214 Z"
                  fill="url(#wawuArea)"
                />
                <path
                  d="M36,196 C80,190 110,184 148,172 C186,160 214,152 252,134 C290,116 318,108 356,86 C394,64 428,46 480,24"
                  fill="none"
                  stroke="var(--accent-hover)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"].map((m, i) => (
                  <text key={m} x={40 + i * 60} y="228" fill="var(--text-muted)" fontSize="10" fontFamily="var(--font-sans)">
                    {m}
                  </text>
                ))}
              </svg>
            </div>
          </div>
        </section>

        <SectionMark />

        {/* ============ COMPARE BANNER ============ */}
        <section className="px-5 py-10 dt:py-14">
          {/*
            The "Every Industry. One Profile." line used to head a marquee of
            eleven industry cards of its own. That marquee is gone — the card
            treatment moved to the services, which are destinations rather
            than decoration — but the CLAIM is still the argument this section
            makes, so it introduces the comparison instead of sitting above a
            wall of tiles that only restated it.
          */}
          <div className="mx-auto mb-8 max-w-[1240px] text-center dt:mb-10">
            <span className="text-[12px] font-bold uppercase tracking-[0.14em] text-text-primary">One profile, every industry</span>
            <h2 className="m-0 mt-3 text-[38px] font-bold leading-[1.05] tracking-[-0.03em] text-text-primary dt:text-[64px]">
              Every Industry.
              <br />
              <span className="text-accent-hover">One Profile.</span>
            </h2>
          </div>
          <div className="mx-auto flex max-w-[1240px] flex-col items-start gap-6 rounded-[28px] bg-[linear-gradient(120deg,var(--accent-deep),var(--accent))] p-8 dt:flex-row dt:items-center dt:justify-between dt:p-12">
            <div>
              <h2 className="m-0 text-[28px] font-bold tracking-[-0.02em] text-white dt:text-[34px]">See How We WOW You</h2>
              <p className="m-0 mt-2 max-w-[560px] text-[14.5px] leading-normal text-[rgba(255,255,255,0.82)]">
                See why switching to WAWU makes absolute sense for a creator.
              </p>
            </div>
            <a
              href="#comparison"
              className="inline-flex h-[52px] shrink-0 items-center rounded-button bg-white px-8 text-[15px] font-semibold text-on-light transition-transform duration-200 hover:scale-[1.03]"
            >
              See the difference
            </a>
          </div>
        </section>

        <SectionMark />

        {/* ============ WOW COMPARISON ============ */}
        <section id="comparison" className="px-5 py-14 dt:py-24">
          <div className="mx-auto max-w-[1240px]">
            <div className="flex flex-col items-center text-center">
              <span className="text-[12px] font-bold uppercase tracking-[0.14em] text-text-primary">WOW Comparison</span>
              <h2 className="m-0 mt-3 text-[34px] font-bold leading-[1.08] tracking-[-0.03em] text-text-primary dt:text-[52px]">
                Choosing between <span className="text-accent-hover">WAWU</span>
                <br className="hidden dt:block" /> and the neighborhood
              </h2>
              <p className="m-0 mt-4 max-w-[560px] text-[15px] leading-relaxed text-text-secondary">
                See how WAWU stacks up, and find out why creators are switching.
              </p>
              <div className="mt-7 flex flex-wrap justify-center gap-3.5">
                <WhitePill href="/sign-up?type=creator">Get access</WhitePill>
                <Button size="lg" variant="secondary" href="/learn">Learn more</Button>
              </div>
            </div>

            <div className="wawu-no-scrollbar mt-12 overflow-x-auto rounded-card border border-hairline bg-card">
              <div className="grid min-w-[960px] grid-cols-[220px_1.25fr_1fr_1fr_1fr]">
                {/* Header */}
                <div className="border-b border-hairline p-4 text-[11.5px] font-bold uppercase tracking-[0.06em] text-text-muted">Feature</div>
                <div className="relative border-b border-l border-hairline bg-accent-tint-strong p-4">
                  <span className="block text-[14px] font-bold text-text-primary">WAWUAfrica</span>
                  <span className="mt-0.5 inline-flex h-[18px] items-center rounded-full bg-accent px-2 text-[9.5px] font-bold uppercase tracking-[0.04em] text-on-accent">
                    Best in Africa
                  </span>
                </div>
                {["The Neighborhood", "The Neighborhood", "The Neighborhood"].map((n, i) => (
                  <div key={i} className="border-b border-l border-hairline p-4 text-[13px] font-semibold text-text-muted">
                    {n}
                  </div>
                ))}
                {/* Rows */}
                {COMPARE_ROWS.map((row, ri) => (
                  <div key={row.feature} className="contents">
                    <div className={`flex items-center p-4 text-[13.5px] font-medium text-text-primary ${ri > 0 ? "border-t border-hairline" : ""}`}>
                      {row.feature}
                    </div>
                    <div className={`flex items-center border-l border-hairline bg-accent-tint p-4 ${ri > 0 ? "border-t" : ""}`}>
                      <CheckOrX value={row.wawu} accent />
                    </div>
                    {row.others.map((val, ci) => (
                      <div key={ci} className={`flex items-center border-l border-hairline p-4 ${ri > 0 ? "border-t" : ""}`}>
                        <CheckOrX value={val} />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
            {/* Ecosystem, partnerships, unique advantages */}
            {/*
              Two cards, capped and centred rather than stretched across the
              full comparison-table width. This row used to hold three; with
              the fabricated reach figures gone it holds two, and letting them
              fill a 1240px container gave each one ~600px of width for five
              short lines — a lot of empty card. The cap keeps them the size
              the content actually is.
            */}
            <div className="mx-auto mt-8 grid max-w-[820px] grid-cols-1 gap-4 dt:grid-cols-2 dt:gap-5">
              <div className="rounded-card border border-hairline bg-card p-6">
                <span className="text-[12px] font-bold uppercase tracking-[0.08em] text-accent">Partnerships &amp; Endorsements</span>
                <div className="mt-4 flex flex-col gap-2.5">
                  {["Governments across Africa", "International Bodies", "Nigerian Federal Ministries", "Professional Bodies", "Device Financing"].map((p) => (
                    <span key={p} className="flex items-center gap-2.5 text-[13.5px] text-text-secondary">
                      <Icon name="Check" size={15} color="var(--success)" strokeWidth={2.4} />
                      {p}
                    </span>
                  ))}
                </div>
              </div>
              <div className="rounded-card border border-hairline bg-card p-6">
                <span className="text-[12px] font-bold uppercase tracking-[0.08em] text-accent">Unique Advantages</span>
                <div className="mt-4 flex flex-col gap-2.5">
                  {[
                    "Integrated ecosystem: learn, earn, grow, collaborate",
                    "Skills development: training included",
                    "Financial inclusion: device financing",
                    "Faith-based approach",
                    "Pan-African focus: designed for Africa & global",
                    "85% revenue share, best in Africa",
                  ].map((p) => (
                    <span key={p} className="flex items-center gap-2.5 text-[13.5px] text-text-secondary">
                      <Icon name="Check" size={15} color="var(--success)" strokeWidth={2.4} />
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <SectionMark />

        {/* ============ MAKE THE SWITCH ============ */}
        <section className="px-5 py-14 dt:py-20">
          <div className="relative mx-auto max-w-[1240px] overflow-hidden rounded-[28px] border border-hairline bg-card px-6 py-14 text-center dt:py-20">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_70%_at_50%_0%,var(--accent-tint-strong),transparent_70%)]" aria-hidden="true" />
            <div className="relative mx-auto flex max-w-[720px] flex-col items-center">
              <CaptionPill>Own Your WOW. Join WAWUAfrica.</CaptionPill>
              <h2 className="m-0 mt-5 text-[34px] font-bold leading-[1.08] tracking-[-0.03em] text-text-primary dt:text-[52px]">
                Ready to Build Something Real?
              </h2>
              <p className="m-0 mt-4 text-[15px] leading-relaxed text-text-secondary">
                Join a growing community of Professionals, Entrepreneurs, Artisans, Creators and start earning more with lower fees, better tools, instant payouts, and training included all on WAWUAfrica.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-x-7 gap-y-2.5">
                {["85% revenue share, best in Africa", "More features + Training + Financial Inclusion + Government partnerships", "Instant payouts"].map((b) => (
                  <span key={b} className="flex items-center gap-2 text-[13px] text-text-secondary">
                    <Icon name="Check" size={14} color="var(--success)" strokeWidth={2.6} />
                    {b}
                  </span>
                ))}
              </div>
              <div className="mt-9 flex flex-wrap justify-center gap-3.5">
                <WhitePill href="/sign-up?type=creator">Join the Movement</WhitePill>
                <Button size="lg" variant="secondary" href="/learn">Learn more</Button>
              </div>
            </div>
          </div>
        </section>

        <SectionMark />

        {/* ============ THE COMMUNITY ============ */}
        <section className="px-5 py-14 dt:py-24">
          <div className="mx-auto max-w-[1240px]">
            <div className="flex flex-col items-center text-center">
              <span className="text-[12px] font-bold uppercase tracking-[0.14em] text-text-primary">The Community</span>
              <h2 className="m-0 mt-3 text-[34px] font-bold leading-[1.08] tracking-[-0.03em] text-text-primary dt:text-[52px]">
                Professionals, Entrepreneurs,
                <br className="hidden dt:block" /> Artisans and <span className="text-accent-hover">Creatives</span>
              </h2>
              <p className="m-0 mt-4 max-w-[520px] text-[15px] leading-relaxed text-text-secondary">
                Join Millions who are building for socioeconomic impact and real communities on WAWUAfrica.
              </p>
            </div>
            <div className="mt-12 grid grid-cols-1 gap-4 dt:grid-cols-3 dt:gap-5">
              {[
                { handle: "@adaeze.biz", quote: "I was answering the same business questions for nothing on WhatsApp for years. Now the answers are a course and they pay for my rent.", name: "Adaeze Okonkwo", meta: "Business Strategist, Enugu" },
                { handle: "@ifeanyi.stitches", quote: "The paid DM changed everything. People are serious when they pay ₦300 to ask, and I reply the same day.", name: "Ifeanyi Nwosu", meta: "Fashion Designer, Aba" },
                { handle: "@zainab.agro", quote: "I got my CAC certificate and sold my first training pack in the same week, on the same app. That is the difference.", name: "Zainab Bello", meta: "Agribusiness Trainer, Kano" },
              ].map((t) => (
                <div key={t.name} className="flex flex-col gap-5 rounded-card border border-hairline bg-card p-6 transition-colors duration-200 hover:border-strong">
                  <p className="m-0 text-[15.5px] leading-relaxed text-text-primary">&ldquo;{t.quote}&rdquo;</p>
                  <div className="mt-auto flex items-center gap-3">
                    <span className="grid h-[42px] w-[42px] place-items-center rounded-full bg-accent-tint text-[16px] font-bold text-accent-hover">
                      {t.name.charAt(0)}
                    </span>
                    <span className="flex flex-col gap-0.5">
                      <span className="text-[14px] font-semibold text-text-primary">{t.name} <span className="font-normal text-text-muted">{t.handle}</span></span>
                      <span className="text-[12.5px] text-text-muted">{t.meta}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <SectionMark />

        {/* ============ STRATEGIC ALLY ============ */}
        <section className="px-5 py-14 dt:py-24">
          <div className="mx-auto grid max-w-[1240px] grid-cols-1 items-center gap-10 dt:grid-cols-[420px_1fr] dt:gap-16">
            <div className="rounded-card border border-hairline bg-card p-6 shadow-[0_0_90px_var(--accent-tint)] dt:p-7">
              <div className="grid grid-cols-[1fr_72px_72px] items-center gap-y-4">
                <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-text-muted">Feature</span>
                <span className="text-center text-[11px] font-bold uppercase tracking-[0.08em] text-accent">WAWU</span>
                <span className="text-center text-[11px] font-bold uppercase tracking-[0.08em] text-text-muted">Others</span>
                {[
                  "Discover creators",
                  "Unlock premium content",
                  "Earn from your work",
                  "Open to everyone",
                ].map((f) => (
                  <div key={f} className="contents">
                    <span className="border-t border-hairline pt-4 text-[14px] font-semibold text-text-primary">{f}</span>
                    <span className="grid place-items-center border-t border-hairline pt-4">
                      <Icon name="Check" size={17} color="var(--success)" strokeWidth={2.6} />
                    </span>
                    <span className="grid place-items-center border-t border-hairline pt-4">
                      <Icon name="X" size={15} color="var(--text-muted)" strokeWidth={2.2} />
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col items-start">
              <CaptionPill>Your Strategic Ally</CaptionPill>
              <h2 className="m-0 mt-5 text-[34px] font-bold leading-[1.06] tracking-[-0.03em] text-text-primary dt:text-[50px]">
                We WOW You Every
                <br />
                <span className="text-accent-hover">Step of the Way.</span>
              </h2>
              <div className="mt-5 flex flex-wrap items-center gap-y-2">
                {PIPELINE.map((step, i) => (
                  <span key={step} className="flex items-center">
                    <span className="inline-flex h-[30px] items-center rounded-full border border-hairline bg-tag px-3 text-[12px] font-medium text-text-secondary">{step}</span>
                    {i < PIPELINE.length - 1 ? <Icon name="ChevronRight" size={13} color="var(--text-muted)" /> : null}
                  </span>
                ))}
              </div>
              <div className="mt-8 flex flex-wrap gap-3.5">
                <WhitePill href="/sign-up?type=creator">Join the Movement</WhitePill>
                <Button size="lg" variant="secondary" href="#comparison">See the difference</Button>
              </div>
            </div>
          </div>
        </section>

        <SectionMark />

        {/* ============ FAQ ============ */}
        <section className="px-5 py-14 dt:py-24">
          <div className="mx-auto max-w-[820px]">
            <div className="flex flex-col items-center text-center">
              <CaptionPill>Got questions?</CaptionPill>
              <h2 className="m-0 mt-5 text-[34px] font-bold leading-[1.06] tracking-[-0.03em] text-text-primary dt:text-[56px]">
                Frequently Asked Questions
              </h2>
              <p className="m-0 mt-4 text-[15px] leading-relaxed text-text-secondary">
                Everything you need to know about joining WAWUAfrica.
              </p>
            </div>
            <div className="mt-10">
              <FaqAccordion items={FAQ} />
            </div>
          </div>
        </section>

        <SectionMark />

        {/* ============ FINAL CTA ============ */}
        <section className="px-5 pb-20 pt-10 dt:pb-28">
          <div className="relative mx-auto max-w-[1240px] overflow-hidden rounded-[28px] border border-hairline bg-[linear-gradient(170deg,var(--surface-card),var(--accent-deep))] px-6 py-16 text-center dt:py-24">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_60%_at_50%_100%,var(--accent-tint-strong),transparent_70%)]" aria-hidden="true" />
            <div className="relative mx-auto flex max-w-[760px] flex-col items-center">
              <CaptionPill>Make the Move</CaptionPill>
              <span className="mt-6 text-[13px] font-bold uppercase tracking-[0.2em] text-accent-hover dt:text-[15px]">
                Build. Earn. Grow. Thrive.
              </span>
              <h2 className="m-0 mt-3 text-[44px] font-bold leading-[1.02] tracking-[-0.035em] text-text-primary dt:text-[76px]">
                Own Your WOW
              </h2>
              <div className="mt-9 flex flex-wrap justify-center gap-3.5">
                <WhitePill href="/sign-up?type=creator">Join WAWU</WhitePill>
                <Button size="lg" variant="secondary" href="/learn">Learn more</Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 flex flex-col gap-7 border-t border-hairline px-5 pb-12 pt-9 dt:mx-auto dt:max-w-[1240px] dt:px-0">
        <img src="/wawu-logo-white.png" alt="WAWU" className="h-[20px] w-auto self-start object-contain opacity-80" />
        <div className="grid grid-cols-2 gap-x-5 gap-y-7 dt:grid-cols-4">
          {[
            { label: "Creators", links: [["Sign in", "/sign-in"], ["Sign up", "/sign-up"], ["Join the Movement", "/sign-up?type=creator"], ["What it costs", "#pricing"]] },
            { label: "Resources", links: [["Explore", "/explore"], ["Learn", "/learn"], ["Services", "/services"]] },
            { label: "Company", links: [["Terms and privacy", "/terms"]] },
          ].map((col) => (
            <div key={col.label} className="flex flex-col gap-3">
              <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-text-muted">{col.label}</span>
              {col.links.map(([label, href]) => (
                <Link key={label} href={href} className="text-[13.5px] text-text-secondary hover:text-text-primary">
                  {label}
                </Link>
              ))}
            </div>
          ))}
        </div>
        {/*
          Copyright left, store badges right, on the same rule.

          They stack on a phone, where two 42px badges beside a copyright line
          would leave neither enough width to read. `w-[220px]` on the pair
          keeps them from stretching across a 1240px footer, which is what a
          bare flex row would do to them.
        */}
        <div className="flex flex-col gap-4 border-t border-hairline pt-5 sm:flex-row sm:items-center sm:gap-3.5">
          <span className="flex-1 text-[12px] text-text-muted">© 2026 WAWUAfrica</span>
          <div className="w-[220px] shrink-0">
            <StoreBadges size="sm" />
          </div>
        </div>
      </footer>
    </div>
  );
}
