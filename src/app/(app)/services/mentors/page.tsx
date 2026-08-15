import Link from "next/link";
import { getMentors } from "@/lib/api/mentors";
import { ProfileBackButton } from "@/components/profile/ProfileBackButton";
import { Avatar } from "@/components/ui/Avatar";
import { VerificationBadge } from "@/components/ui/VerificationBadge";
import { Icon } from "@/components/ui/Icon";
import { ErrorState } from "@/components/ui/ErrorState";

export default async function MentorsPage() {
  let mentors;
  try {
    mentors = await getMentors();
  } catch (e) {
    const message = e instanceof Error ? e.message : undefined;
    return <ErrorState caption={message ?? "We couldn't load mentors."} />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: "14px 16px 96px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <ProfileBackButton compact />
        <span style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--text-primary)" }}>
          Mentors
        </span>
      </div>

      <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.5, color: "var(--text-secondary)" }}>
        45-minute sessions with creators who have already done what you&apos;re trying to do.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {mentors.map((m) => (
          <Link key={m.id} href={`/services/mentors/${m.id}`} style={{ display: "flex", gap: 13, padding: 14, borderRadius: "var(--radius-card)", background: "var(--surface-card)", border: "1px solid var(--border-hairline)", textDecoration: "none" }}>
            <Avatar initial={m.name.charAt(0)} size={48} accent />
            <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 3 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 15, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
                {m.name}
                <VerificationBadge size={14} />
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--accent-hover)" }}>
                {m.field}
              </span>
              <span style={{ fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.4 }}>{m.tagline}</span>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                ★ {m.rating.toFixed(1)} · {m.sessions} sessions · {m.availability}
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", justifyContent: "space-between", flexShrink: 0 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", fontFeatureSettings: "var(--font-feature-tabular)" }}>
                ₦{m.rate.toLocaleString("en-NG")}
              </span>
              <Icon name="ChevronRight" size={16} color="var(--text-muted)" stroke={2} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}