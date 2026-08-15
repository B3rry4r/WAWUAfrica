"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { ApplicationStatus, ServiceApplication } from "@/types/services";
import { getApplication, getOtherApplications } from "@/lib/api/services";
import { ProfileBackButton } from "@/components/profile/ProfileBackButton";
import { ErrorState, Icon, ListRow, StatusPill } from "@/components/ui";
import type { StatusKind } from "@/components/ui/StatusPill";
import type { IconName } from "@/components/ui/Icon";
import { formatNaira } from "@/lib/format";

const STATUS_KIND: Record<ApplicationStatus, StatusKind> = {
  under_review: "info",
  approved: "success",
  pending: "warning",
  rejected: "danger",
};

const KIND_ICON: Record<ServiceApplication["kind"], IconName> = {
  cac: "Stamp",
  nepc: "Ship",
  mentor: "Users",
};

export default function ApplicationTrackingPage() {
  const params = useParams();
  const id = String(params?.id ?? "");

  const [application, setApplication] = useState<ServiceApplication | null>(null);
  const [others, setOthers] = useState<ServiceApplication[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  const load = () => {
    setState("loading");
    Promise.all([getApplication(id), getOtherApplications(id)])
      .then(([app, otherApps]) => {
        if (!app) {
          setState("error");
          return;
        }
        setApplication(app);
        setOthers(otherApps);
        setState("ready");
      })
      .catch(() => setState("error"));
  };

  useEffect(() => {
    let active = true;
    Promise.all([getApplication(id), getOtherApplications(id)])
      .then(([app, otherApps]) => {
        if (!active) return;
        if (!app) {
          setState("error");
          return;
        }
        setApplication(app);
        setOthers(otherApps);
        setState("ready");
      })
      .catch(() => active && setState("error"));
    return () => {
      active = false;
    };
  }, [id]);

  if (state === "loading") {
    return (
      <div className="flex flex-col gap-[18px] p-[14px_16px_96px]">
        <div className="flex items-center gap-[10px]">
          <ProfileBackButton compact />
          <div className="h-[18px] w-[140px] animate-pulse rounded-full bg-[var(--surface-tag)]" />
        </div>
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-[64px] animate-pulse rounded-[var(--radius-card)] bg-[var(--surface-tag)]" />
        ))}
      </div>
    );
  }

  if (state === "error" || !application) {
    return (
      <div className="p-[16px]">
        <ErrorState title="Application not found" body="This reference may be wrong, or the application was removed." onRetry={load} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[18px] p-[14px_16px_96px]">
      <div className="flex items-center gap-[10px]">
        <ProfileBackButton compact />
        <span className="text-[18px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">{application.title}</span>
      </div>

      <div className="flex flex-col gap-[10px]">
        <div className="flex items-center gap-[12px]">
          <span className="grid h-[48px] w-[48px] shrink-0 place-items-center rounded-[14px] border border-[var(--border-accent)] bg-[var(--accent-tint)]">
            <Icon name={KIND_ICON[application.kind]} size={20} color="var(--accent)" />
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
            <span className="text-[13.5px] font-bold [font-feature-settings:var(--font-feature-tabular)]">{application.reference}</span>
            <span className="text-[12.5px] text-[var(--text-muted)]">Applied {application.appliedDate}</span>
          </div>
          <StatusPill kind={STATUS_KIND[application.status]}>{application.statusLabel}</StatusPill>
        </div>
        {application.subtitle && <span className="text-[13px] text-[var(--text-secondary)]">{application.subtitle}</span>}
      </div>

      {application.rejection && (
        <div className="flex items-start gap-[10px] rounded-[var(--radius-input)] border border-[rgba(255,92,92,0.32)] bg-[var(--danger-tint)] p-[14px]">
          <Icon name="CircleAlert" size={16} color="var(--danger)" strokeWidth={2.2} className="mt-[1px]" />
          <span className="flex-1 text-[13.5px] leading-[1.5] text-[var(--danger)]">
            This attempt was rejected. {application.rejection.note}{" "}
            {application.rejection.refunded ? "You were not charged — refunded in full." : "You were not charged."}
          </span>
        </div>
      )}

      {(application.amountPaid != null || application.certificateExpectedBy) && (
        <div className="flex flex-col gap-[10px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[16px]">
          {application.amountPaid != null && (
            <div className="flex items-center gap-[10px]">
              <span className="flex-1 text-[13px] text-[var(--text-secondary)]">Paid</span>
              <span className="text-[13.5px] font-semibold [font-feature-settings:var(--font-feature-tabular)]">{formatNaira(application.amountPaid)}</span>
            </div>
          )}
          {application.certificateExpectedBy && (
            <div className="flex items-center gap-[10px]">
              <span className="flex-1 text-[13px] text-[var(--text-secondary)]">Certificate expected</span>
              <span className="text-[13.5px] font-semibold [font-feature-settings:var(--font-feature-tabular)]">By {application.certificateExpectedBy}</span>
            </div>
          )}
        </div>
      )}

      <section className="flex flex-col gap-[8px]">
        <span className="text-[13px] font-semibold text-[var(--text-secondary)]">Timeline</span>
        <div className="flex flex-col gap-0 rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[4px]">
          {application.timeline.map((t, i) => (
            <div key={t.stage} className="flex gap-[12px] rounded-[var(--radius-input)] p-[12px]">
              <div className="flex shrink-0 flex-col items-center">
                <span
                  className={[
                    "grid h-[22px] w-[22px] place-items-center rounded-full",
                    t.status === "done"
                      ? "border border-[var(--border-accent)] bg-[var(--accent)]"
                      : t.status === "current"
                        ? "border border-[var(--border-accent)] bg-[var(--accent-tint)]"
                        : "border border-[var(--border-hairline)] bg-[var(--surface-tag)]",
                  ].join(" ")}
                >
                  {t.status === "done" ? (
                    <Icon name="Check" size={11} color="#fff" strokeWidth={3} />
                  ) : t.status === "current" ? (
                    <span className="h-[8px] w-[8px] rounded-full bg-[var(--accent)]" />
                  ) : (
                    <span className="text-[11px] font-bold text-[var(--text-muted)]">{i + 1}</span>
                  )}
                </span>
                {i < application.timeline.length - 1 && (
                  <span className={["w-[2px] min-h-[12px] flex-1", t.status === "done" ? "bg-[var(--border-accent)]" : "bg-[var(--border-hairline)]"].join(" ")} />
                )}
              </div>
              <div className={["flex min-w-0 flex-1 flex-col gap-[2px]", i < application.timeline.length - 1 ? "pb-[14px]" : ""].join(" ")}>
                <span className="flex items-center gap-[8px] text-[14px] font-semibold text-[var(--text-primary)]">
                  {t.stage}
                  {t.date && <span className="text-[12px] font-medium text-[var(--text-muted)] [font-feature-settings:var(--font-feature-tabular)]">· {t.date}</span>}
                </span>
                <span className="text-[12.5px] leading-[1.4] text-[var(--text-muted)]">{t.note}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {others.length > 0 && (
        <section className="flex flex-col gap-[8px]">
          <span className="text-[13px] font-semibold text-[var(--text-secondary)]">Your other applications</span>
          <div className="flex flex-col divide-y divide-[var(--border-hairline)] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)]">
            {others.map((a) => (
              <ListRow
                key={a.id}
                href={`/services/applications/${a.id}`}
                icon={KIND_ICON[a.kind]}
                title={a.title}
                subtitle={`${a.reference} · ${a.statusLabel}`}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
