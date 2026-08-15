import { getMentor } from "@/lib/api/mentors";
import { ProfileBackButton } from "@/components/profile/ProfileBackButton";
import { Avatar } from "@/components/ui/Avatar";
import { VerificationBadge } from "@/components/ui/VerificationBadge";
import { Icon } from "@/components/ui/Icon";
import { ErrorState } from "@/components/ui/ErrorState";
import { MentorBookButton } from "@/components/services/MentorBookButton";

export default async function MentorDetailPage({ params }: { params: { id: string } }) {
  const mentor = await getMentor(params.id);

  if (!mentor) {
    return (
      <div style={{ padding: 16 }}>
        <ErrorState title="Mentor not found" caption="This mentor may be on a break." />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18, padding: "14px 16px 96px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <ProfileBackButton compact />
        <span style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--text-primary)" }}>
          Mentor
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "10px 0", textAlign: "center" }}>
        <Avatar initial={mentor.name.charAt(0)} size={72} accent />
        <span style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 21, fontWeight: 700, color: "var(--text-primary)" }}>
          {mentor.name}
          <VerificationBadge size={17} />
        </span>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--accent-hover)" }}>
          {mentor.field}
        </span>
        <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
          @{mentor.handle} · ★ {mentor.rating.toFixed(1)} · {mentor.sessions} sessions
        </span>
      </div>

      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: "var(--text-secondary)" }}>{mentor.bio}</p>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", borderRadius: "var(--radius-input)", background: "var(--surface-tag)", border: "1px solid var(--border-hairline)" }}>
          <Icon name="CalendarDays" size={16} color="var(--accent)" stroke={2} />
          <span style={{ fontSize: 13.5, color: "var(--text-primary)" }}>
            Available {mentor.availability}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", borderRadius: "var(--radius-input)", background: "var(--surface-tag)", border: "1px solid var(--border-hairline)" }}>
          <Icon name="Clock" size={16} color="var(--accent)" stroke={2} />
          <span style={{ fontSize: 13.5, color: "var(--text-primary)" }}>
            45-minute session · ₦{mentor.rate.toLocaleString("en-NG")}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", borderRadius: "var(--radius-input)", background: "var(--surface-tag)", border: "1px solid var(--border-hairline)" }}>
          <Icon name="Languages" size={16} color="var(--accent)" stroke={2} />
          <span style={{ fontSize: 13.5, color: "var(--text-primary)" }}>{mentor.languages.join(" · ")}</span>
        </div>
      </div>

      <MentorBookButton mentor={{ id: mentor.id, name: mentor.name, rate: mentor.rate }} />
    </div>
  );
}