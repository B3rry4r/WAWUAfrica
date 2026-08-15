import Link from "next/link";
import { getService } from "@/lib/api/services";
import { ProfileBackButton } from "@/components/profile/ProfileBackButton";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { ErrorState } from "@/components/ui/ErrorState";

const STEPS = [
  { title: "Tell us what you make", note: "A few lines about your product or service." },
  { title: "Share where you sell", note: "Your WAWU profile and any storefronts." },
  { title: "Talk to the export desk", note: "An agent matches you to the right NEPC desk." },
];

export default async function NepcServicePage() {
  const service = await getService("nepc");

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
        <span style={{ fontSize: 13.5, color: "var(--text-muted)" }}>{service.priceFrom} · {service.turnaround}</span>
      </div>

      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: "var(--text-secondary)" }}>{service.blurb}</p>

      <section style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>How it works</span>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {STEPS.map((s, i) => (
            <div key={s.title} style={{ display: "flex", gap: 12, padding: "12px 14px", borderRadius: "var(--radius-input)", background: "var(--surface-tag)", border: "1px solid var(--border-hairline)" }}>
              <span style={{ display: "grid", placeItems: "center", width: 26, height: 26, flexShrink: 0, borderRadius: 999, background: "var(--accent-tint)", border: "1px solid var(--border-accent)", fontSize: 13, fontWeight: 700, color: "var(--accent)" }}>
                {i + 1}
              </span>
              <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{s.title}</span>
                <span style={{ fontSize: 12.5, color: "var(--text-muted)", lineHeight: 1.4 }}>{s.note}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Link href="/services/nepc/apply" style={{ textDecoration: "none", display: "block" }}>
        <Button full size="lg">
          Start now · Free
        </Button>
      </Link>
    </div>
  );
}