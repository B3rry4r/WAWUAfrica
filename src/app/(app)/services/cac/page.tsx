"use client";

import { useEffect, useState } from "react";
import { getCacTimeline, getService } from "@/lib/api/services";
import type { PartnerService, ServiceApplicationTimeline } from "@/types/services";
import { ProfileBackButton } from "@/components/profile/ProfileBackButton";
import { Button, ErrorState, Icon, StatusPill } from "@/components/ui";
import type { IconName } from "@/components/ui/Icon";

export default function CacServicePage() {
  const [service, setService] = useState<PartnerService | null>(null);
  const [timeline, setTimeline] = useState<ServiceApplicationTimeline[]>([]);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([getService("cac"), getCacTimeline()])
      .then(([s, t]) => {
        if (!active) return;
        if (!s) setError(true);
        else {
          setService(s);
          setTimeline(t);
        }
      })
      .catch(() => active && setError(true))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  if (error) {
    return (
      <div className="p-[16px]">
        <ErrorState title="Service not found" />
      </div>
    );
  }

  if (loading || !service) {
    return (
      <div className="flex flex-col gap-[12px] p-[14px_16px_96px] xl:mx-auto xl:w-full xl:max-w-[860px] xl:p-[30px_28px_64px]">
        <div className="h-[56px] w-[56px] rounded-[16px] bg-[var(--surface-tag)]" />
        <div className="h-[120px] rounded-[var(--radius-card)] bg-[var(--surface-tag)]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[18px] p-[14px_16px_96px]">
      <div className="flex items-center gap-[10px]">
        <ProfileBackButton compact />
        <span className="text-[18px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
          {service.name}
        </span>
      </div>

      <div className="flex flex-col gap-[12px]">
        <span className="grid h-[56px] w-[56px] place-items-center rounded-[16px] border border-[var(--border-decor)] bg-[var(--decor-tint)]">
          <Icon name={service.icon as IconName} size={24} color="var(--accent)" />
        </span>
        <span className="text-[24px] font-extrabold tracking-[-0.025em] text-[var(--text-primary)]">
          {service.name}
        </span>
        <span className="text-[13.5px] text-[var(--text-muted)]">
          {service.priceFrom} · {service.turnaround} · filed with {service.partner}
        </span>
      </div>

      <p className="m-0 text-[14px] leading-[1.55] text-[var(--text-secondary)]">{service.blurb}</p>

      <section className="flex flex-col gap-[8px]">
        <span className="text-[13px] font-semibold text-[var(--text-secondary)]">What happens next</span>
        <div className="flex flex-col gap-0 rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[4px]">
          {timeline.map((t, i) => (
            <div key={t.stage} className="flex gap-[12px] rounded-[var(--radius-input)] p-[12px]">
              <div className="flex shrink-0 flex-col items-center">
                <span
                  className={[
                    "grid h-[22px] w-[22px] place-items-center rounded-full",
                    t.status === "done"
                      ? "border border-[var(--border-selected)] bg-[var(--accent)]"
                      : t.status === "current"
                        ? "border border-[var(--border-selected)] bg-[var(--selected-tint)]"
                        : "border border-[var(--border-hairline)] bg-[var(--surface-tag)]",
                  ].join(" ")}
                >
                  {t.status === "done" ? (
                    <Icon name="Check" size={11} color="var(--text-on-accent)" strokeWidth={3} />
                  ) : t.status === "current" ? (
                    <span className="h-[8px] w-[8px] rounded-full bg-[var(--accent)]" />
                  ) : (
                    <span className="text-[11px] font-bold text-[var(--text-muted)]">{i + 1}</span>
                  )}
                </span>
                {i < timeline.length - 1 && <span className={["w-[2px] min-h-[12px] flex-1", t.status === "done" ? "bg-[var(--border-selected)]" : "bg-[var(--border-hairline)]"].join(" ")} />}
              </div>
              <div className={["flex min-w-0 flex-1 flex-col gap-[2px]", i < timeline.length - 1 ? "pb-[14px]" : ""].join(" ")}>
                <span className="flex items-center gap-[8px] text-[14px] font-semibold text-[var(--text-primary)]">
                  {t.stage}
                  {t.status === "current" && <StatusPill kind="info">In progress</StatusPill>}
                </span>
                <span className="text-[12.5px] leading-[1.4] text-[var(--text-muted)]">{t.note}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Button full size="lg" href="/services/cac/apply">
        Apply now
      </Button>
    </div>
  );
}
