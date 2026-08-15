import Link from "next/link";
import { getGuides } from "@/lib/api/learn";
import { ProfileBackButton } from "@/components/profile/ProfileBackButton";
import { Icon } from "@/components/ui/Icon";
import { ErrorState } from "@/components/ui/ErrorState";

export default async function GuidesPage() {
  let guides;
  try {
    guides = await getGuides();
  } catch (e) {
    const message = e instanceof Error ? e.message : undefined;
    return <ErrorState caption={message ?? "We couldn't load guides."} />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: "16px 16px 96px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <ProfileBackButton compact />
        <span style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--text-primary)" }}>
          Country guides
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", borderRadius: "var(--radius-card)", background: "var(--surface-card)", border: "1px solid var(--border-hairline)", padding: 4 }}>
        {guides.map((g) => (
          <Link key={g.id} href={`/learn/guides/${g.id}`} style={{ display: "flex", alignItems: "center", gap: 13, padding: "13px 14px", borderRadius: "var(--radius-input)", textDecoration: "none" }}>
            <span style={{ display: "grid", placeItems: "center", width: 40, height: 40, flexShrink: 0, borderRadius: 12, background: "var(--surface-tag)", border: "1px solid var(--border-hairline)" }}>
              <Icon name="Globe" size={18} color="var(--accent)" stroke={2} />
            </span>
            <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>{g.title}</span>
              <span style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
                {g.country} · {g.pages} pages · Free
              </span>
            </div>
            <Icon name="ChevronRight" size={17} color="var(--text-muted)" stroke={2} />
          </Link>
        ))}
      </div>
    </div>
  );
}