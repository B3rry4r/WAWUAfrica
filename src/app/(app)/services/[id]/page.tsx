"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { PartnerService } from "@/types/services";
import { getService, notifyComingSoon } from "@/lib/api/services";
import { ProfileBackButton } from "@/components/profile/ProfileBackButton";
import { ComingSoonPill } from "@/components/ui/ComingSoonPill";
import { TierBadge } from "@/components/ui/TierBadge";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { ErrorState } from "@/components/ui/ErrorState";

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
      <div style={{ padding: 16 }}>
        <ErrorState title="Service not found" caption="This service may have been removed." />
      </div>
    );
  }

  if (!service) {
    return (
      <div style={{ padding: 16 }}>
        <ProfileBackButton compact />
        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 16 }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ height: 60, borderRadius: "var(--radius-card)", background: "var(--surface-tag)" }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18, padding: "14px 16px 96px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <ProfileBackButton compact />
        <span style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--text-primary)" }}>
          {service.name}
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <span style={{ display: "grid", placeItems: "center", width: 56, height: 56, borderRadius: 16, background: "var(--surface-tag)", border: "1px solid var(--border-hairline)" }}>
          <Icon name={service.icon} size={24} color="var(--text-muted)" stroke={2} />
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.025em", color: "var(--text-primary)" }}>
            {service.name}
          </span>
          <ComingSoonPill />
        </div>
        <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text-secondary)" }}>{service.tagline}</span>
      </div>

      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: "var(--text-secondary)" }}>{service.blurb}</p>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: 14,
          borderRadius: "var(--radius-card)",
          background: "var(--surface-elevated)",
          border: "1px solid var(--border-accent)",
        }}
      >
        <span style={{ display: "grid", placeItems: "center", width: 40, height: 40, flexShrink: 0, borderRadius: 12, background: "var(--accent-tint)", border: "1px solid var(--border-accent)" }}>
          <Icon name="Crown" size={18} color="var(--brand-yellow)" stroke={2} fill="var(--brand-yellow)" />
        </span>
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
            Pro members first
            <TierBadge tier="pro" size="sm" />
          </span>
          <span style={{ fontSize: 12.5, color: "var(--text-secondary)" }}>{service.comingNote}</span>
        </div>
      </div>

      {notified ? (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: 14, borderRadius: "var(--radius-input)", background: "var(--success-tint)", border: "1px solid rgba(184,232,62,0.32)" }}>
          <Icon name="Check" size={17} color="var(--success)" stroke={2.6} />
          <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-primary)" }}>
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