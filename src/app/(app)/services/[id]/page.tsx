"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { PartnerService } from "@/types/services";
import { getService, notifyComingSoon } from "@/lib/api/services";
import { ProfileBackButton } from "@/components/profile/ProfileBackButton";
import { Button, ComingSoonPill, ErrorState, Icon, TierBadge } from "@/components/ui";
import type { IconName } from "@/components/ui/Icon";

export default function ComingSoonServicePage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params?.id ?? "");
  const [service, setService] = useState<PartnerService | null>(null);
  const [notified, setNotified] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    getService(id)
      .then((s) => {
        if (!active) return;
        if (!s) setError(true);
        else setService(s);
      })
      .catch(() => active && setError(true));
    return () => {
      active = false;
    };
  }, [id]);

  const notify = async () => {
    await notifyComingSoon(id);
    setNotified(true);
  };

  if (error) {
    return (
      <div className="p-[16px]">
        <ErrorState title="Service not found" body="This service may have been removed." />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="p-[16px]">
        <ProfileBackButton compact />
        <div className="mt-[16px] flex flex-col gap-[16px]">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-[60px] rounded-[var(--radius-card)] bg-[var(--surface-tag)]" />
          ))}
        </div>
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
        <span className="grid h-[56px] w-[56px] place-items-center rounded-[16px] border border-[var(--border-hairline)] bg-[var(--surface-tag)]">
          <Icon name={service.icon as IconName} size={24} color="var(--text-muted)" />
        </span>
        <div className="flex flex-wrap items-center gap-[8px]">
          <span className="text-[24px] font-extrabold tracking-[-0.025em] text-[var(--text-primary)]">
            {service.name}
          </span>
          <ComingSoonPill>Coming soon</ComingSoonPill>
        </div>
        <span className="text-[15px] font-semibold text-[var(--text-secondary)]">{service.tagline}</span>
      </div>

      <p className="m-0 text-[14px] leading-[1.55] text-[var(--text-secondary)]">{service.blurb}</p>

      <div className="flex items-center gap-[12px] rounded-[var(--radius-card)] border border-[var(--border-accent)] bg-[var(--surface-elevated)] p-[14px]">
        <span className="grid h-[40px] w-[40px] shrink-0 place-items-center rounded-[12px] border border-[var(--border-accent)] bg-[var(--accent-tint)]">
          <Icon name="Crown" size={18} color="var(--brand-yellow)" fill="var(--brand-yellow)" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
          <span className="flex items-center gap-[7px] text-[14px] font-semibold text-[var(--text-primary)]">
            Pro members first
            <TierBadge tier="pro" />
          </span>
          <span className="text-[12.5px] text-[var(--text-secondary)]">{service.comingNote}</span>
        </div>
      </div>

      {notified ? (
        <div className="flex items-center gap-[10px] rounded-[var(--radius-input)] border border-[rgba(184,232,62,0.32)] bg-[var(--success-tint)] p-[14px]">
          <Icon name="Check" size={17} color="var(--success)" strokeWidth={2.6} />
          <span className="text-[13.5px] font-semibold text-[var(--text-primary)]">
            You&apos;re on the list — we&apos;ll tell you the moment it launches.
          </span>
        </div>
      ) : (
        <Button full size="lg" onClick={notify}>
          Notify me when it launches
        </Button>
      )}
    </div>
  );
}
