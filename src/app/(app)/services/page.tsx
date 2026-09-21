"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getServices, getOtherApplications } from "@/lib/api/services";
import type { PartnerService, ServiceApplication } from "@/types/services";
import { ProfileBackButton } from "@/components/profile/ProfileBackButton";
import { Button, ComingSoonPill, ErrorState, Icon, ListRow, TileCard, ICON_GRID } from "@/components/ui";
import { orderedServices, type PlatformService } from "@/lib/platform-services";
import type { IconName } from "@/components/ui/Icon";
import { FlowHeader } from "@/components/layout/FlowHeader";

const eyebrow = "px-[2px] text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--text-muted)]";

/**
 * One service, as a ROW.
 *
 * These were cards in an auto-fill grid: a bordered box each, an icon in its
 * own tile, a name, a tagline, a blurb and a full-width button — six elements
 * per service, reflowing into two or three columns depending on the width.
 * For a directory of eight things that is a lot of furniture around very
 * little information, and it read differently at every breakpoint.
 *
 * A row carries the same facts in reading order, and on desktop the rows sit
 * in TWO COLUMNS — one column of eight would be a long ribbon down the left
 * of a wide screen with the right half empty. The whole row is the target
 * rather than a button inside it: a larger tap area and one obvious thing to
 * press.
 */
/**
 * One service, as a card.
 *
 * The NAME is the only text on it, on the product owner's instruction (1 Sep
 * 2026). The tagline and the price/turnaround line were removed: on a grid of
 * cards the names are what somebody scans, and three lines per card turned
 * eight of them into a wall of prose. Price and turnaround still live on the
 * service's own screen, where somebody is actually deciding.
 *
 * "Coming soon" is not written on the card either — the grid is already split
 * under an "Open now" / "Coming soon" heading, so repeating it on every card
 * says the same thing twice.
 */
function ServiceCard({ s, open }: { s: PlatformService; open: boolean }) {
  // A service the catalogue carries always has a detail screen at
  // /services/<slug>, even when the list itself names no href. Without this,
  // a service the catalogue had switched on (Loans, Pensions) sorted into
  // "Open now" and then rendered dimmed and unclickable, which reads as
  // broken rather than as open.
  const href = s.href ?? (s.slug ? `/services/${s.slug}` : undefined);
  // Bare icon and title, no card: build brief A5 takes the multi-colour block
  // grid out of the app (the colour there was `index % 7` and never meant
  // anything), and the owner asked for the same treatment Bills Payment got,
  // "not big cards, just icons and the titles sitting proper".
  //
  // A service that is not open yet is deliberately NOT a link. A card that
  // navigates nowhere is worse than one that says so, and the dimming is what
  // says it now that the grid no longer captions each tile.
  return (
    <TileCard
      layout="stacked"
      size="sm"
      title={s.brand}
      icon={s.icon}
      iconImageSrc={s.iconImageSrc}
      {...(open && href ? { href } : { disabled: true })}
    />
  );
}

const TIMELINE_DOT: Record<"done" | "current" | "upcoming", string> = {
  done: "bg-[var(--success)]",
  current: "bg-[var(--warning)]",
  upcoming: "bg-[var(--surface-tag)]",
};

export default function ServicesPage() {
  const [services, setServices] = useState<PartnerService[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  // SEAM: no dedicated "list my applications" endpoint exists yet — getOtherApplications("")
  // with a non-matching id returns the full mock set. Swap for GET /api/hub/services/applications.
  const [applications, setApplications] = useState<ServiceApplication[]>([]);

  useEffect(() => {
    let active = true;
    setError(null);
    getServices()
      .then((res) => {
        if (active) setServices(res);
      })
      .catch((e) => {
        if (active) setError(e instanceof Error ? e.message : "We couldn't load services.");
      });
    getOtherApplications("")
      .then((res) => {
        if (active) setApplications(res);
      })
      .catch(() => {
        if (active) setApplications([]);
      });
    return () => {
      active = false;
    };
  }, []);

  if (error) {
    return <ErrorState title="We couldn't load services." body={error} />;
  }

  if (!services) {
    return (
      <div className="flex flex-col gap-[12px] p-[14px_16px_96px]">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-[76px] rounded-[var(--radius-card)] bg-[var(--surface-tag)]" />
        ))}
      </div>
    );
  }

  /*
    What exists comes from PLATFORM_SERVICES; whether it is OPEN comes from
    the catalogue.

    The two used to be the same thing, and the result was that /services and
    the landing page disagreed about what WAWU offers: the landing listed
    eight, the catalogue returned five, and Events and Shop appeared on one
    surface and not the other. Product owner, 21 Sep 2026: "services should
    carry only the services that shows in the landing page."

    A service the catalogue does not carry (Events, Shop, BNPL are WAWU's own
    surfaces, not partner services) keeps the list's own `soon` flag.
  */
  const statusOf = (slug?: string) =>
    slug ? services.find((c) => (c.slug ?? c.id) === slug)?.status : undefined;
  const isOpen = (s: PlatformService) => {
    /*
      `soon` WINS. The catalogue can CLOSE a service, never open one.

      This had it backwards and the bug was visible: PLATFORM_SERVICES marks
      Pensions and Loans `soon: true`, the partner catalogue returns both as
      `live`, and because the catalogue was consulted first they rendered as
      open and tappable on /services while the landing page and Explore, which
      read `soon` directly, still showed them as coming soon. Three surfaces,
      two answers, from the one list that exists to stop exactly that.

      The two flags are not the same question. `soon` is OUR product decision
      about whether a service is launched at all; catalogue `status` is the
      PARTNER's answer about whether their side is up right now. A partner
      being ready cannot launch a product we have not launched, so `soon` is
      checked first and short-circuits.
    */
    if (s.soon) return false;
    const catalogue = statusOf(s.slug);
    return catalogue ? catalogue === "live" : true;
  };
  const ordered = orderedServices(isOpen);
  const live = ordered.filter(isOpen);
  const coming = ordered.filter((s) => !isOpen(s));
  const featured = applications.find((a) => a.status === "under_review" || a.status === "pending") ?? applications[0] ?? null;

  return (
    <>
      <div className="flex flex-col gap-[20px] p-[14px_16px_96px] xl:hidden">
        <div className="flex items-center gap-[10px]">
          <ProfileBackButton compact />
          <span className="text-[18px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">Services</span>
        </div>

        <p className="m-0 text-[14px] leading-[1.5] text-[var(--text-secondary)]">
          Get registered, get trained, get covered, without leaving the app.
        </p>

        {/*
          The same icon grid as the landing page and the desktop pane, not a
          third rendering of the same eight services. Price and turnaround
          live on each service's own screen, where somebody is actually
          deciding; here they made every row three lines tall and turned
          eight services into a page and a half of scrolling.
        */}
        <section className="flex flex-col gap-[14px]">
          <span className={eyebrow}>Open now</span>
          <div className={ICON_GRID}>
            {live.map((s) => (
              <ServiceCard key={s.brand} s={s} open />
            ))}
          </div>
        </section>

        {coming.length ? (
          <section className="flex flex-col gap-[14px]">
            <span className={eyebrow}>Coming soon</span>
            <div className={ICON_GRID}>
              {coming.map((s) => (
                <ServiceCard key={s.brand} s={s} open={false} />
              ))}
            </div>
          </section>
        ) : null}
      </div>

      {/* D13 frame 1 — live and coming-soon sit as equals in one grid; the applications tracker moves alongside instead of onto its own screen. */}
      <div className="hidden xl:flex xl:h-full xl:min-h-0 xl:flex-1 xl:flex-col">
        {/* Shared bar — see FlowHeader. */}
        <FlowHeader
          title="Services"
          back={false}
          sticky
          right={
            <span className="text-[13.5px] text-text-muted">
              {live.length} open{coming.length ? ` · ${coming.length} coming` : ""}
            </span>
          }
        />

        {/*
          A flat two-column dump of every service read as one long wall. The
          grid is three-up on a wide screen and split by whether a service can
          actually be used today, so the ones that are open are not buried
          among the ones that are not.
        */}
        <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-[26px] p-[26px]">
          <div className="flex flex-col gap-[8px]">
            <h1 className="m-0 text-[28px] font-bold tracking-[-0.025em] text-[var(--text-primary)]">
              Everything else WAWU can do for you
            </h1>
            <p className="m-0 max-w-[620px] text-[14.5px] leading-[1.55] text-[var(--text-secondary)]">
              Get registered, get covered, get funded, and pay your bills, without leaving the app.
            </p>
          </div>

          <div className="flex flex-col gap-[14px]">
            <span className={eyebrow}>Open now</span>
            <div className={ICON_GRID}>
              {live.map((s) => (
                <ServiceCard key={s.brand} s={s} open />
              ))}
            </div>
          </div>

          {coming.length ? (
            <div className="flex flex-col gap-[14px]">
              <span className={eyebrow}>Coming soon</span>
              <div className={ICON_GRID}>
                {coming.map((s) => (
                  <ServiceCard key={s.brand} s={s} open={false} />
                ))}
              </div>
            </div>
          ) : null}

          <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-[18px]">
            <div className="flex flex-col gap-[12px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[22px]">
              <span className={eyebrow}>Included with any account</span>
              <ListRow title="Business playbook" subtitle="The full guide, yours to download" icon="BookOpen" href="/learn/playbook" />
            </div>

            <div className="flex flex-col gap-[12px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[22px]">
              <span className={eyebrow}>Your applications</span>
              {featured ? (
                <>
                  <div className="flex flex-col gap-[11px]">
                    {featured.timeline.map((t) => (
                      <div key={t.stage} className="flex items-center gap-[11px]">
                        <span className={`h-[9px] w-[9px] shrink-0 rounded-full ${TIMELINE_DOT[t.status]}`} />
                        <span className={`text-[13.5px] ${t.status === "upcoming" ? "text-[var(--text-muted)]" : "text-[var(--text-secondary)]"}`}>
                          {t.stage}
                          {t.date ? ` · ${t.date}` : ""}
                        </span>
                        {t.status === "current" && (
                          <span className="ml-auto whitespace-nowrap text-[12.5px] text-[var(--text-muted)] [font-feature-settings:var(--font-feature-tabular)]">
                            reference {featured.reference}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                  <span className="pt-[4px] text-[12.5px] leading-[1.5] text-[var(--text-muted)]">
                    Rejected applications are refunded in full.
                  </span>
                  <Link href={`/services/applications/${featured.id}`} className="text-[12.5px] font-semibold text-[var(--accent)] no-underline hover:text-text-primary">
                    View full tracking →
                  </Link>
                </>
              ) : (
                <span className="text-[13px] leading-[1.5] text-[var(--text-muted)]">You haven&apos;t started an application yet.</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
