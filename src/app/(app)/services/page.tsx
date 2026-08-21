"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getServices, getOtherApplications } from "@/lib/api/services";
import type { PartnerService, ServiceApplication } from "@/types/services";
import { ProfileBackButton } from "@/components/profile/ProfileBackButton";
import { Button, ComingSoonPill, ErrorState, Icon, ListRow, TierBadge } from "@/components/ui";
import type { IconName } from "@/components/ui/Icon";

const eyebrow = "px-[2px] text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--text-muted)]";

/** D13 desktop card: live and coming-soon services rendered as equal-status cards, honest about which is which via border/badge rather than a separate section. */
/**
 * One service, on desktop.
 *
 * The previous card put the name, the turnaround and the price all on one
 * header row with the price pushed right. With real copy in it ("Grants and
 * funding", "Consultations from NGN 25,000") that row wrapped in three
 * different places depending on the service, so no two cards lined up.
 *
 * Everything is stacked in a fixed order now, the meta line is one row of
 * small text, and the button is pinned to the bottom with `mt-auto` so the
 * action sits on the same line across the whole grid regardless of how long
 * a blurb runs.
 */
function DesktopServiceCard({ s }: { s: PartnerService }) {
  const live = s.status === "live";
  const meta = [s.priceFrom, s.turnaround].filter(Boolean).join(" · ");
  return (
    <div
      className={`flex h-full flex-col rounded-[var(--radius-card)] border bg-[var(--surface-card)] p-[20px] ${
        live ? "border-[var(--border-accent)]" : "border-[var(--border-hairline)]"
      }`}
    >
      <div className="flex items-center gap-[10px]">
        <span
          className={`grid h-[38px] w-[38px] shrink-0 place-items-center rounded-[12px] border ${
            live
              ? "border-[var(--border-accent)] bg-[var(--accent-tint)]"
              : "border-[var(--border-hairline)] bg-[var(--surface-elevated)]"
          }`}
        >
          <Icon
            name={s.icon as IconName}
            size={18}
            color={live ? "var(--accent)" : "var(--text-secondary)"}
            strokeWidth={live ? 2.2 : 2}
          />
        </span>
        {!live && <ComingSoonPill>Coming soon</ComingSoonPill>}
      </div>

      <span className="mt-[13px] text-[16.5px] font-semibold leading-tight tracking-[-0.01em] text-[var(--text-primary)]">
        {s.name}
      </span>
      <span className="mt-[3px] text-[12.5px] leading-snug text-[var(--text-muted)]">{s.tagline}</span>

      <span className="mt-[10px] text-[13px] leading-[1.5] text-[var(--text-secondary)]">{s.blurb}</span>

      {live && meta ? (
        <span className="mt-[12px] text-[12px] font-medium text-[var(--text-muted)]">{meta}</span>
      ) : null}

      <div className="mt-auto pt-[16px]">
        {live ? (
          <Button full size="sm" iconRight="ArrowRight" href={s.cta?.href ?? `/services/${s.slug ?? s.id}`}>
            {s.cta?.label ?? "Open"}
          </Button>
        ) : (
          <Button full size="sm" variant="secondary" icon="Bell" href={`/services/${s.slug ?? s.id}`}>
            Notify me
          </Button>
        )}
      </div>
    </div>
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
              <Link key={s.id} href={`/services/${s.slug ?? s.id}`} className="flex gap-[13px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[14px] no-underline">
                <span className="grid h-[46px] w-[46px] shrink-0 place-items-center rounded-[14px] border border-[var(--border-accent)] bg-[var(--accent-tint)]">
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
            <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--text-muted)]">Coming with Pro</span>
            <TierBadge tier="pro" />
          </div>
          <div className="flex flex-col gap-[10px]">
            {coming.map((s) => (
              <Link key={s.id} href={`/services/${s.slug ?? s.id}`} className="flex gap-[13px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[14px] opacity-[0.82] no-underline">
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
        <div
          className="sticky top-0 z-20 flex h-[68px] shrink-0 items-center gap-4 border-b border-hairline bg-[rgba(19,19,22,0.86)] px-[26px] backdrop-blur"
          style={{ backdropFilter: "var(--blur-chrome)" }}
        >
          <span className="text-[19px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">Services</span>
          <span className="flex-1" />
          <span className="text-[13.5px] text-[var(--text-muted)]">
            {live.length} open{coming.length ? ` · ${coming.length} coming` : ""}
          </span>
        </div>

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
            <div className="grid grid-cols-[repeat(auto-fill,minmax(255px,1fr))] gap-[18px]">
              {live.map((s) => (
                <DesktopServiceCard key={s.id} s={s} />
              ))}
            </div>
          </div>

          {coming.length ? (
            <div className="flex flex-col gap-[14px]">
              <span className={eyebrow}>Coming soon</span>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(255px,1fr))] gap-[18px]">
                {coming.map((s) => (
                  <DesktopServiceCard key={s.id} s={s} />
                ))}
              </div>
            </div>
          ) : null}

          <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-[18px]">
            <div className="flex flex-col gap-[12px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[22px]">
              <span className={eyebrow}>Included with any account</span>
              <ListRow title="Mentors" subtitle="Book time with people who have done it · free" icon="UserRoundSearch" href="/services/mentors" />
              <ListRow title="Business playbook" subtitle="The full guide, free to download" icon="BookOpen" href="/learn/playbook" />
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
                  <Link href={`/services/applications/${featured.id}`} className="text-[12.5px] font-semibold text-[var(--accent)] no-underline">
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
