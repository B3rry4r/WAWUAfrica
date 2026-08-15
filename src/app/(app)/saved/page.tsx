import { getSavedItems } from "@/lib/api/settings";
import { ProfileBackButton } from "@/components/profile/ProfileBackButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";

export default async function SavedPage() {
  let items;
  try {
    items = await getSavedItems();
  } catch (e) {
    const message = e instanceof Error ? e.message : undefined;
    return <ErrorState caption={message ?? "We couldn't load your saved items."} />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: "14px 16px 96px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <ProfileBackButton compact />
        <span style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--text-primary)" }}>
          Saved
        </span>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon="Bookmark"
          title="Nothing saved yet"
          caption="Bookmark courses, playbooks and posts and they'll line up here."
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {items.map((item) => (
            <div key={item.id} style={{ display: "flex", flexDirection: "column", gap: 6, padding: "14px 16px", borderRadius: "var(--radius-card)", background: "var(--surface-card)", border: "1px solid var(--border-hairline)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.3 }}>{item.title}</span>
                <span style={{ fontSize: 11.5, color: "var(--text-muted)", whiteSpace: "nowrap" }}>{item.savedAt}</span>
              </div>
              <span style={{ fontSize: 12.5, color: "var(--accent-hover)" }}>{item.kindLabel}</span>
              <span style={{ fontSize: 12.5, color: "var(--text-muted)" }}>by {item.creator}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}