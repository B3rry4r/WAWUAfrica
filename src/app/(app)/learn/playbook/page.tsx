import { getPlaybook } from "@/lib/api/learn";
import { ProfileBackButton } from "@/components/profile/ProfileBackButton";
import { Icon } from "@/components/ui/Icon";
import { ErrorState } from "@/components/ui/ErrorState";
import { DownloadButton } from "@/components/learn/DownloadButton";

export default async function PlaybookPage() {
  let playbook;
  try {
    playbook = await getPlaybook();
  } catch (e) {
    const message = e instanceof Error ? e.message : undefined;
    return <ErrorState caption={message ?? "We couldn't load the playbook."} />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18, padding: "14px 16px 96px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <ProfileBackButton compact />
        <span style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--text-primary)" }}>
          The playbook
        </span>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
          padding: "26px 20px",
          borderRadius: "var(--radius-card)",
          background: "var(--surface-card)",
          border: "1px solid var(--border-hairline)",
          textAlign: "center",
        }}
      >
        <span
          style={{
            display: "grid",
            placeItems: "center",
            width: 76,
            height: 98,
            borderRadius: 12,
            background: "var(--accent)",
            color: "var(--text-on-accent)",
            fontWeight: 800,
            fontSize: 14,
            letterSpacing: "0.02em",
            textTransform: "uppercase",
            boxShadow: "var(--shadow-float)",
          }}
        >
          WAWU
        </span>
        <span style={{ fontSize: 21, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.25, color: "var(--text-primary)" }}>
          {playbook.title}
        </span>
        <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
          {playbook.pages} pages · {playbook.format} · Free
        </span>
      </div>

      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: "var(--text-secondary)" }}>{playbook.description}</p>

      <section style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>Inside</span>
        <div style={{ display: "flex", flexDirection: "column", borderRadius: "var(--radius-card)", background: "var(--surface-card)", border: "1px solid var(--border-hairline)", padding: 4 }}>
          {playbook.chapters.map((ch) => (
            <div key={ch.title} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 12px", borderRadius: "var(--radius-input)" }}>
              <Icon name="BookOpen" size={16} color="var(--accent)" stroke={2} />
              <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>{ch.title}</span>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Pages {ch.pages}</span>
            </div>
          ))}
        </div>
      </section>

      <DownloadButton title={playbook.title} />
    </div>
  );
}