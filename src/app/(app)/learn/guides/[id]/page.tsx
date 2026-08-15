import { getGuides } from "@/lib/api/learn";
import { ProfileBackButton } from "@/components/profile/ProfileBackButton";
import { Icon } from "@/components/ui/Icon";
import { ErrorState } from "@/components/ui/ErrorState";
import { DownloadButton } from "@/components/learn/DownloadButton";

export default async function GuideDetailPage({ params }: { params: { id: string } }) {
  const guides = await getGuides();
  const guide = guides.find((g) => g.id === params.id);

  if (!guide) {
    return (
      <div style={{ padding: 16 }}>
        <ErrorState title="Guide not found" caption="This guide may have been removed." />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18, padding: "14px 16px 96px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <ProfileBackButton compact />
        <span style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--text-primary)" }}>
          Guide
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--text-muted)" }}>
          {guide.country} · {guide.pages} pages · Free
        </span>
        <span style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.025em", lineHeight: 1.2, color: "var(--text-primary)" }}>
          {guide.title}
        </span>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: "var(--text-secondary)" }}>
          The plain-language version of the WAWU Business Playbook for creators based in {guide.country} — payments,
          verification, taxes and what to watch out for locally.
        </p>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: 14,
          borderRadius: "var(--radius-card)",
          background: "var(--surface-card)",
          border: "1px solid var(--border-hairline)",
        }}
      >
        <span style={{ display: "grid", placeItems: "center", width: 42, height: 42, flexShrink: 0, borderRadius: 12, background: "var(--accent-tint)", border: "1px solid var(--border-accent)" }}>
          <Icon name="FileText" size={18} color="var(--accent)" stroke={2} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 14.5, fontWeight: 600, color: "var(--text-primary)" }}>{guide.title}</span>
        </div>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--success)" }}>Free</span>
      </div>

      <DownloadButton title={guide.title} />
    </div>
  );
}