"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getServices, getOtherApplications } from "@/lib/api/services";
import type { PartnerService, ServiceApplication } from "@/types/services";
import { ProfileBackButton } from "@/components/profile/ProfileBackButton";
import { Button, ComingSoonPill, ErrorState, Icon, ListRow, TileCard } from "@/components/ui";
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
function ServiceCard({ s, index }: { s: PartnerService; index: number }) {
  const live = s.status === "live";
  const href = live ? (s.cta?.href ?? `/services/${s.slug ?? s.id}`) : `/services/${s.slug ?? s.id}`;

  return <TileCard index={index} title={s.name} icon={s.icon as IconName} href={href} />;
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

  const live = services.filter((s) => s.status === "live");
  const coming = services.filter((s) => s.status === "coming");
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

        <section className="flex flex-col gap-[11px]">
          <span className={eyebrow}>Open now</span>
          <div className="flex flex-col gap-[10px]">
            {live.map((s) => (
              <Link key={s.id} href={`/services/${s.slug ?? s.id}`} className="flex gap-[13px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[14px] no-underline hover:bg-surface-hover active:bg-surface-press">
                <span className="grid h-[46px] w-[46px] shrink-0 place-items-center rounded-[14px] border border-[var(--border-decor)] bg-[var(--decor-tint)]">
                  <Icon name={s.icon as IconName} size={20} color="var(--accent)" />
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-[4px]">
                  <span className="flex items-center gap-[8px] text-[15.5px] font-bold tracking-[-0.01em] text-[var(--text-primary)]">
                    {s.name}
                  </span>
                  <span className="text-[13px] text-[var(--text-secondary)]">{s.tagline}</span>
                  <span className="text-[12px] text-[var(--text-muted)]">
                    {s.priceFrom} · {s.turnaround}
                  </span>
                </div>
                <Icon name="ChevronRight" size={17} color="var(--text-muted)" className="self-center" />
              </Link>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-[11px]">
          <div className="flex items-center gap-[8px] px-[2px]">
            <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--text-muted)]">Coming soon</span>
          </div>
          <div className="flex flex-col gap-[10px]">
            {coming.map((s) => (
              <Link key={s.id} href={`/services/${s.slug ?? s.id}`} className="flex gap-[13px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[14px] opacity-[0.82] no-underline hover:bg-surface-hover active:bg-surface-press">
                <span className="grid h-[46px] w-[46px] shrink-0 place-items-center rounded-[14px] border border-[var(--border-hairline)] bg-[var(--surface-tag)]">
                  <Icon name={s.icon as IconName} size={20} color="var(--text-muted)" />
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-[4px]">
                  <span className="flex items-center gap-[8px] text-[15.5px] font-bold tracking-[-0.01em] text-[var(--text-primary)]">
                    {s.name}
                    <ComingSoonPill>Coming soon</ComingSoonPill>
                  </span>
                  <span className="text-[13px] text-[var(--text-secondary)]">{s.tagline}</span>
                </div>
                <Icon name="ChevronRight" size={17} color="var(--text-muted)" className="self-center" />
              </Link>
            ))}
          </div>
        </section>
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
            <div className="grid grid-cols-2 gap-[10px] sm:grid-cols-3 xl:grid-cols-4">
              {live.map((s, i) => (
                <ServiceCard key={s.id} s={s} index={i} />
              ))}
            </div>
          </div>

          {coming.length ? (
            <div className="flex flex-col gap-[14px]">
              <span className={eyebrow}>Coming soon</span>
              <div className="grid grid-cols-2 gap-[10px] sm:grid-cols-3 xl:grid-cols-4">
                {coming.map((s, i) => (
                  // Offset so the "coming soon" block does not repeat the
                  // exact colour sequence the block above it just used.
                  <ServiceCard key={s.id} s={s} index={i + live.length} />
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
