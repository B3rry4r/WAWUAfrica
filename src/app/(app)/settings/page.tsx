import { getOwnProfile } from "@/lib/api/verification";
import { Avatar } from "@/components/ui/Avatar";
import { TierBadge } from "@/components/ui/TierBadge";
import { ListRow } from "@/components/ui/ListRow";
import { ErrorState } from "@/components/ui/ErrorState";
import type { IconName } from "@/components/ui/Icon";

interface Row {
  title: string;
  subtitle?: string;
  icon: IconName;
  href: string;
  meta?: string;
}

interface Group {
  title: string;
  rows: Row[];
}

export default async function SettingsPage() {
  let profile;
  try {
    profile = await getOwnProfile();
  } catch (e) {
    const message = e instanceof Error ? e.message : undefined;
    return <ErrorState title="Couldn't load settings" body={message} />;
  }

  const isCreator = profile.accountType === "creator";

  const groups: Group[] = [
    {
      title: "Account",
      rows: [
        { title: "Edit profile", subtitle: profile.handle ? `@${profile.handle}` : undefined, icon: "UserRound", href: "/profile/edit" },
        { title: "Verification", subtitle: "Badge and ladder", icon: "ShieldCheck", href: "/profile/verification" },
      ],
    },
    ...(isCreator
      ? [
          {
            title: "Creator",
            rows: [
              { title: "Paid messages", subtitle: "Reply within 24 hours", icon: "MessageCircle", href: "/settings" },
              { title: "Earnings", subtitle: "Payouts and history", icon: "Wallet", href: "/settings" },
            ],
          } satisfies Group,
        ]
      : []),
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
    <div className="flex flex-col gap-[18px] p-[14px_16px_96px]">
      <div className="flex items-center gap-[13px] p-[6px]">
        <Avatar initial={profile.name.charAt(0)} size={52} />
        <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
          <span className="text-[17px] font-bold tracking-[-0.01em] text-[var(--text-primary)]">{profile.name}</span>
          <span className="text-[12.5px] text-[var(--text-muted)]">{profile.email}</span>
        </div>
        <div className="flex flex-col items-end gap-[5px]">
          {isCreator && <TierBadge tier={profile.plan} />}
          <span className="text-[11.5px] text-[var(--text-muted)]">
            {isCreator ? "Creator" : "Member"} account
          </span>
        </div>
      </div>

      {groups.map((g) => (
        <section key={`${g.title}-${g.rows.length}`} className="flex flex-col gap-[8px]">
          <span className="px-[2px] text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--text-muted)]">
            {g.title}
          </span>
          <div className="flex flex-col rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[4px]">
            {g.rows.map((r) => (
              <ListRow key={r.title} title={r.title} subtitle={r.subtitle} icon={r.icon} href={r.href} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
