"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
  const [notifyError, setNotifyError] = useState<string | null>(null);
  const [notifying, setNotifying] = useState(false);

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
    setNotifying(true);
    setNotifyError(null);
    try {
      // The resolved record's own id, not the route param — the route may be
      // a slug (see getService's slug resolution) and the endpoint is keyed
      // by the real service id.
      await notifyComingSoon(service?.id ?? id);
      setNotified(true);
    } catch (e) {
      setNotifyError(e instanceof Error ? e.message : "Couldn't add you to the list. Try again.");
    } finally {
      setNotifying(false);
    }
  };

  if (error) {
    return (
      <div className="p-[16px] xl:p-[26px]">
        <ErrorState title="Service not found" body="This service may have been removed." />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="p-[16px] xl:p-0">
        <div className="xl:hidden">
          <ProfileBackButton compact />
        </div>
        <div
          className="hidden h-[68px] shrink-0 items-center gap-4 border-b border-[var(--border-hairline)] bg-[rgba(19,19,22,0.86)] px-[26px] backdrop-blur xl:flex"
          style={{ backdropFilter: "var(--blur-chrome)" }}
        >
          <Link href="/services" className="flex items-center gap-[9px] text-[14px] font-semibold text-[var(--text-secondary)] no-underline">
            <Icon name="ArrowLeft" size={18} color="var(--text-secondary)" />
            Services
          </Link>
        </div>
        <div className="mt-[16px] flex flex-col gap-[16px] xl:mx-auto xl:mt-0 xl:max-w-[560px] xl:p-[26px]">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-[60px] rounded-[var(--radius-card)] bg-[var(--surface-tag)] xl:h-[80px]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-[18px] p-[14px_16px_96px] xl:hidden">
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
              You&apos;re on the list, we&apos;ll tell you the moment it launches.
            </span>
          </div>
        ) : (
          <>
            {notifyError ? (
              <div className="flex items-center gap-[10px] rounded-[var(--radius-input)] border border-[rgba(255,90,90,0.32)] bg-[var(--danger-tint)] p-[14px]">
                <Icon name="TriangleAlert" size={17} color="var(--danger)" />
                <span className="text-[13px] font-medium text-[var(--text-primary)]">{notifyError}</span>
              </div>
            ) : null}
            <Button full size="lg" onClick={notify} disabled={notifying}>
              {notifying ? "Adding you…" : "Notify me when it launches"}
            </Button>
          </>
        )}
      </div>

      {/* Coming-soon detail is intentionally simple (icon, name, messaging, one CTA) —
          the xl treatment widens spacing and centers the card rather than restructuring it. */}
      <div className="hidden xl:flex xl:h-full xl:min-h-0 xl:flex-1 xl:flex-col">
        <div
          className="sticky top-0 z-20 flex h-[68px] shrink-0 items-center gap-4 border-b border-[var(--border-hairline)] bg-[rgba(19,19,22,0.86)] px-[26px] backdrop-blur"
          style={{ backdropFilter: "var(--blur-chrome)" }}
        >
          <Link href="/services" className="flex items-center gap-[9px] text-[14px] font-semibold text-[var(--text-secondary)] no-underline">
            <Icon name="ArrowLeft" size={18} color="var(--text-secondary)" />
            Services
          </Link>
          <span className="ml-[10px] text-[19px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">{service.name}</span>
        </div>

        <div className="mx-auto flex w-full max-w-[600px] flex-col items-center gap-[22px] p-[64px_26px_48px] text-center">
          <span className="grid h-[84px] w-[84px] place-items-center rounded-[22px] border border-[var(--border-hairline)] bg-[var(--surface-tag)]">
            <Icon name={service.icon as IconName} size={34} color="var(--text-muted)" />
          </span>
          <div className="flex flex-col items-center gap-[10px]">
            <div className="flex flex-wrap items-center justify-center gap-[10px]">
              <span className="text-[32px] font-extrabold tracking-[-0.03em] text-[var(--text-primary)]">
                {service.name}
              </span>
              <ComingSoonPill>Coming soon</ComingSoonPill>
            </div>
            <span className="text-[17px] font-semibold text-[var(--text-secondary)]">{service.tagline}</span>
          </div>

          <p className="m-0 max-w-[440px] text-[15px] leading-[1.6] text-[var(--text-secondary)]">{service.blurb}</p>

          <div className="flex w-full max-w-[440px] items-center gap-[14px] rounded-[var(--radius-card)] border border-[var(--border-accent)] bg-[var(--surface-elevated)] p-[18px]">
            <span className="grid h-[46px] w-[46px] shrink-0 place-items-center rounded-[13px] border border-[var(--border-accent)] bg-[var(--accent-tint)]">
              <Icon name="Crown" size={20} color="var(--brand-yellow)" fill="var(--brand-yellow)" />
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-[3px] text-left">
              <span className="flex items-center gap-[7px] text-[14.5px] font-semibold text-[var(--text-primary)]">
                Pro members first
                <TierBadge tier="pro" />
              </span>
              <span className="text-[13px] text-[var(--text-secondary)]">{service.comingNote}</span>
            </div>
          </div>

          {notified ? (
            <div className="flex w-full max-w-[440px] items-center gap-[10px] rounded-[var(--radius-input)] border border-[rgba(184,232,62,0.32)] bg-[var(--success-tint)] p-[16px]">
              <Icon name="Check" size={18} color="var(--success)" strokeWidth={2.6} />
              <span className="text-[14px] font-semibold text-[var(--text-primary)]">
                You&apos;re on the list, we&apos;ll tell you the moment it launches.
              </span>
            </div>
          ) : (
            <>
              {notifyError ? (
                <div className="flex w-full max-w-[440px] items-center gap-[10px] rounded-[var(--radius-input)] border border-[rgba(255,90,90,0.32)] bg-[var(--danger-tint)] p-[16px]">
                  <Icon name="TriangleAlert" size={18} color="var(--danger)" />
                  <span className="text-[14px] font-medium text-[var(--text-primary)]">{notifyError}</span>
                </div>
              ) : null}
              <Button size="lg" className="w-full max-w-[440px]" onClick={notify} disabled={notifying}>
                {notifying ? "Adding you…" : "Notify me when it launches"}
              </Button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
