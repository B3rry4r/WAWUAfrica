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
function DesktopServiceCard({ s }: { s: PartnerService }) {
  const live = s.status === "live";
  return (
    <div
      className={`flex flex-col gap-[14px] rounded-[var(--radius-card)] border bg-[var(--surface-card)] p-[24px] ${
        live ? "border-[var(--border-accent)]" : "border-[var(--border-hairline)]"
      }`}
    >
      <div className="flex items-center gap-[12px]">
        <span
          className={`grid h-[44px] w-[44px] shrink-0 place-items-center rounded-[14px] border ${
            live ? "border-[var(--border-accent)] bg-[var(--accent-tint)]" : "border-[var(--border-hairline)] bg-[var(--surface-elevated)]"
          }`}
        >
          <Icon name={s.icon as IconName} size={20} color={live ? "var(--accent)" : "var(--text-secondary)"} strokeWidth={live ? 2.2 : 2} />
        </span>
        <div className="flex min-w-0 flex-col gap-[3px]">
          <span className="text-[18px] font-semibold text-[var(--text-primary)]">{s.name}</span>
          {live ? (
            <span className="text-[12.5px] text-[var(--text-muted)]">Open now{s.turnaround ? ` · ${s.turnaround}` : ""}</span>
          ) : (
            <ComingSoonPill>Coming soon</ComingSoonPill>
          )}
        </div>
        {live && s.priceFrom && (
          <span className="ml-auto whitespace-nowrap text-[18px] font-bold [font-feature-settings:var(--font-feature-tabular)] text-[var(--text-primary)]">
            {s.priceFrom}
          </span>
        )}
      </div>
      <span className="text-[13.5px] leading-[1.55] text-[var(--text-secondary)]">{s.blurb}</span>
      {live ? (
        <Button full size="md" iconRight="ArrowRight" href={s.cta?.href ?? `/services/${s.id}`}>
          {s.cta?.label ?? "Apply"}
        </Button>
      ) : (
        <Button full size="md" variant="secondary" icon="Bell" href={`/services/${s.id}`}>
          Notify me when it opens
        </Button>
      )}
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
          Get registered, get trained, get covered — without leaving the app.
        </p>

        <section className="flex flex-col gap-[11px]">
          <span className={eyebrow}>Open now</span>
          <div className="flex flex-col gap-[10px]">
            {live.map((s) => (
              <Link key={s.id} href={`/services/${s.id}`} className="flex gap-[13px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[14px] no-underline">
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
              <Link key={s.id} href={`/services/${s.id}`} className="flex gap-[13px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[14px] opacity-[0.82] no-underline">
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
          <span className="text-[13.5px] text-[var(--text-muted)]">Coming-soon services are named, not hidden</span>
        </div>

        <div className="flex flex-col gap-[22px] p-[26px]">
          <div className="grid grid-cols-2 gap-[20px]">
            {services.map((s) => (
              <DesktopServiceCard key={s.id} s={s} />
            ))}
          </div>

          <div className="grid grid-cols-2 gap-[20px]">
            <div className="flex flex-col gap-[12px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[22px]">
              <span className={eyebrow}>Free with any account</span>
              <ListRow title="Mentors" subtitle="Book time with people who have done it · free" icon="UserRoundSearch" href="/services/mentors" />
              <ListRow title="Business playbook" subtitle="The full guide, free to download" icon="BookOpen" trailing="none" />
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
