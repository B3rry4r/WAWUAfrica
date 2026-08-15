import Link from "next/link";
import { getServices } from "@/lib/api/services";
import { Icon } from "@/components/ui/Icon";
import { ComingSoonPill } from "@/components/ui/ComingSoonPill";
import { TierBadge } from "@/components/ui/TierBadge";
import { ErrorState } from "@/components/ui/ErrorState";

const eyebrow = { fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-muted)", padding: "0 2px" } as const;

export default async function ServicesPage() {
  let services;
  try {
    services = await getServices();
  } catch (e) {
    const message = e instanceof Error ? e.message : undefined;
    return <ErrorState caption={message ?? "We couldn't load services."} />;
  }

  const live = services.filter((s) => s.status === "live");
  const coming = services.filter((s) => s.status === "coming");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <section style={{ display: "flex", flexDirection: "column", gap: 11 }}>
        <span style={eyebrow}>Open now</span>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {live.map((s) => (
            <Link key={s.id} href={`/services/${s.id}`} style={{ display: "flex", gap: 13, padding: 14, borderRadius: "var(--radius-card)", background: "var(--surface-card)", border: "1px solid var(--border-hairline)", textDecoration: "none" }}>
              <span style={{ display: "grid", placeItems: "center", width: 46, height: 46, flexShrink: 0, borderRadius: 14, background: "var(--accent-tint)", border: "1px solid var(--border-accent)" }}>
                <Icon name={s.icon} size={20} color="var(--accent)" stroke={2} />
              </span>
              <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 15.5, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
                  {s.name}
                  <TierBadge tier="basic" size="sm" label="Live" />
                </span>
                <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{s.tagline}</span>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  {s.priceFrom} · {s.turnaround}
                </span>
              </div>
              <Icon name="ChevronRight" size={17} color="var(--text-muted)" stroke={2} style={{ alignSelf: "center" }} />
            </Link>
          ))}
        </div>
      </section>

      <section style={{ display: "flex", flexDirection: "column", gap: 11 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 2px" }}>
          <span style={{ flex: 1, ...eyebrow, padding: 0 }}>Coming with Pro</span>
          <TierBadge tier="pro" size="sm" />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {coming.map((s) => (
            <Link key={s.id} href={`/services/${s.id}`} style={{ display: "flex", gap: 13, padding: 14, borderRadius: "var(--radius-card)", background: "var(--surface-card)", border: "1px solid var(--border-hairline)", textDecoration: "none", opacity: 0.82 }}>
              <span style={{ display: "grid", placeItems: "center", width: 46, height: 46, flexShrink: 0, borderRadius: 14, background: "var(--surface-tag)", border: "1px solid var(--border-hairline)" }}>
                <Icon name={s.icon} size={20} color="var(--text-muted)" stroke={2} />
              </span>
              <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 15.5, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
                  {s.name}
                  <ComingSoonPill />
                </span>
                <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{s.tagline}</span>
              </div>
              <Icon name="ChevronRight" size={17} color="var(--text-muted)" stroke={2} style={{ alignSelf: "center" }} />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}