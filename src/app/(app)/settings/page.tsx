import { fetchCurrentUser } from "@/lib/api/session";
import { Avatar } from "@/components/ui/Avatar";
import { TierBadge } from "@/components/ui/TierBadge";
import { ListRow } from "@/components/ui/ListRow";
import { ErrorState } from "@/components/ui/ErrorState";

export default async function SettingsPage() {
  let user;
  try {
    user = await fetchCurrentUser();
  } catch (e) {
    const message = e instanceof Error ? e.message : undefined;
    return <ErrorState caption={message ?? "We couldn't load settings."} />;
  }

  const groups = [
    {
      title: "Account",
      rows: [
        { title: "Edit profile", subtitle: user.handle ? `@${user.handle}` : undefined, icon: "UserRound", href: "/profile/edit" },
        { title: "Verification", subtitle: "Badge and ladder", icon: "ShieldCheck", href: "/profile/verification" },
      ],
    },
    {
      title: "App",
      rows: [
        { title: "Notifications", icon: "Bell", href: "/settings/notifications" },
        { title: "Privacy", icon: "Lock", href: "/privacy" },
        { title: "Saved", subtitle: "Your saved content", icon: "Bookmark", href: "/saved" },
      ],
    },
    {
      title: "About",
      rows: [
        { title: "About WAWU", icon: "Info", href: "/about" },
        { title: "Partners", icon: "Handshake", href: "/partners" },
      ],
    },
    {
      title: "Account",
      rows: [{ title: "Delete account", icon: "Trash2", href: "/settings/delete-account" }],
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18, padding: "14px 16px 96px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 13, padding: 6 }}>
        <Avatar initial={user.name.charAt(0)} size={52} accent />
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>{user.name}</span>
          <span style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
            {user.email}
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 5, alignItems: "flex-end" }}>
          <TierBadge tier={user.creatorTier ?? "basic"} size="sm" />
          <span style={{ fontSize: 11.5, color: "var(--text-muted)" }}>
            {user.accountType === "creator" ? "Creator" : "Member"} account
          </span>
        </div>
      </div>

      {groups.map((g, gi) => (
        <section key={g.title} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-muted)", padding: "0 2px" }}>
            {g.title}
          </span>
          <div style={{ display: "flex", flexDirection: "column", borderRadius: "var(--radius-card)", background: "var(--surface-card)", border: "1px solid var(--border-hairline)", padding: 4 }}>
            {g.rows.map((r) => (
              <ListRow key={r.title} title={r.title} subtitle={r.subtitle} icon={r.icon} href={r.href} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}