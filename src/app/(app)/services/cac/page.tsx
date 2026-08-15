import Link from "next/link";
import { getCacTimeline, getService } from "@/lib/api/services";
import { ProfileBackButton } from "@/components/profile/ProfileBackButton";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { StatusPill } from "@/components/ui/StatusPill";
import { ErrorState } from "@/components/ui/ErrorState";

export default async function CacServicePage() {
  const [service, timeline] = await Promise.all([getService("cac"), getCacTimeline()]);

  if (!service) {
    return (
      <div style={{ padding: 16 }}>
        <ErrorState title="Service not found" />
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
        <span style={{ display: "grid", placeItems: "center", width: 56, height: 56, borderRadius: 16, background: "var(--accent-tint)", border: "1px solid var(--border-accent)" }}>
          <Icon name={service.icon} size={24} color="var(--accent)" stroke={2} />
        </span>
        <span style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.025em", color: "var(--text-primary)" }}>
          {service.name}
        </span>
        <span style={{ fontSize: 13.5, color: "var(--text-muted)" }}>
          {service.priceFrom} · {service.turnaround} · filed with {service.partner}
        </span>
      </div>

      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: "var(--text-secondary)" }}>{service.blurb}</p>

      <section style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>What happens next</span>
        <div style={{ display: "flex", flexDirection: "column", gap: 0, borderRadius: "var(--radius-card)", background: "var(--surface-card)", border: "1px solid var(--border-hairline)", padding: 4 }}>
          {timeline.map((t, i) => (
            <div key={t.stage} style={{ display: "flex", gap: 12, padding: "12px 12px", borderRadius: "var(--radius-input)" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                <span
                  style={{
                    display: "grid",
                    placeItems: "center",
                    width: 22,
                    height: 22,
                    borderRadius: 999,
                    background: t.status === "done" ? "var(--accent)" : t.status === "current" ? "var(--accent-tint)" : "var(--surface-tag)",
                    border: `1px solid ${t.status === "done" || t.status === "current" ? "var(--border-accent)" : "var(--border-hairline)"}`,
                  }}
                >
                  {t.status === "done" ? (
                    <Icon name="Check" size={11} color="#fff" stroke={3} />
                  ) : t.status === "current" ? (
                    <span style={{ width: 8, height: 8, borderRadius: 999, background: "var(--accent)" }} />
                  ) : (
                    <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)" }}>{i + 1}</span>
                  )}
                </span>
                {i < timeline.length - 1 && <span style={{ width: 2, flex: 1, minHeight: 12, background: t.status === "done" ? "var(--border-accent)" : "var(--border-hairline)" }} />}
              </div>
              <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2, paddingBottom: i < timeline.length - 1 ? 14 : 0 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
                  {t.stage}
                  {t.status === "current" && <StatusPill kind="info" style={{ padding: "2px 8px", fontSize: 10.5 }}>In progress</StatusPill>}
                </span>
                <span style={{ fontSize: 12.5, color: "var(--text-muted)", lineHeight: 1.4 }}>{t.note}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Link href="/services/cac/apply" style={{ textDecoration: "none", display: "block" }}>
        <Button full size="lg">
          Apply now
        </Button>
      </Link>
    </div>
  );
}