import Link from "next/link";
import { ProfileHeader } from "@/components/ui/ProfileHeader";
import { StatBlock } from "@/components/ui/StatBlock";
import { ListRow } from "@/components/ui/ListRow";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { StatusPill } from "@/components/ui/StatusPill";
import { currentSession } from "@/lib/api/mocks/session";
import { currentEarnings } from "@/lib/api/earnings";
import { currentMessaging } from "@/lib/api/messaging";
import { currentSubscription } from "@/lib/api/subscription";
import { AccountTypeToggle } from "@/components/layout/AccountTypeToggle";
import { getAccountType } from "@/lib/auth/session";
import { formatNaira } from "@/lib/format";

export const metadata = {
  title: "Profile · WAWUAfrica",
};

export default async function ProfilePage() {
  const accountType = await getAccountType();
  const creator = currentSession.creator;

  if (accountType === "user" || !creator) {
    return (
      <div>
        <div style={{ display: "flex", justifyContent: "center", padding: 16 }}>
          <AccountTypeToggle current={accountType} />
        </div>
        <ProfileHeader
          name={currentSession.name}
          handle={currentSession.handle}
          bio="Fan account. Switch to Creator to see the dashboard."
          stats={[
            { value: "12", label: "Pieces" },
            { value: "86", label: "EVG" },
            { value: "14", label: "Following" },
          ]}
        />
      </div>
    );
  }

  const kycPending = creator.kyc !== "approved";
  const held = kycPending;
  const tier = creator.tier;
  const earned = held ? currentEarnings.held : currentEarnings.payable + currentEarnings.held;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "center", padding: 16 }}>
        <AccountTypeToggle current={accountType} />
      </div>

      <ProfileHeader
        name={currentSession.name}
        handle={currentSession.handle}
        bio="I turn market traders into registered businesses. CAC, pricing, bookkeeping — plain and practical."
        tier="certified_professional"
        plan={tier}
        stats={[
          { value: "4", label: "Published" },
          { value: "1,240", label: "EVG" },
          { value: "86", label: "Unlocks" },
        ]}
        primaryAction="Edit profile"
      />

      <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
        <Link href="/creator" style={{ textDecoration: "none" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 14,
              padding: 18,
              borderRadius: "var(--radius-card)",
              background: "var(--surface-elevated)",
              border: "1px solid var(--border-accent)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
              <span style={{ display: "grid", placeItems: "center", width: 40, height: 40, borderRadius: 13, background: "var(--accent-tint)", border: "1px solid var(--border-accent)", flexShrink: 0 }}>
                <Icon name="ChartNoAxesColumn" size={18} color="var(--accent)" stroke={2} />
              </span>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)" }}>Creator dashboard</span>
                <span style={{ fontSize: 12.5, color: "var(--text-secondary)" }}>Earnings, content, inbox, tier</span>
              </div>
              <Icon name="ChevronRight" size={18} color="var(--accent)" stroke={2.2} />
            </div>
            <div style={{ display: "flex", gap: 10, paddingTop: 14, borderTop: "1px solid var(--border-hairline)" }}>
              <div style={{ flex: 1 }}>
                <StatBlock value={formatNaira(earned)} label="This month" align="start" size="sm" />
              </div>
              <div style={{ flex: 1 }}>
                <StatBlock value={String(currentMessaging.threads.filter((t) => !t.opened).length)} label="To reply" align="start" size="sm" />
              </div>
            </div>
          </div>
        </Link>

        {kycPending ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
              padding: 14,
              borderRadius: "var(--radius-card)",
              background: "var(--warning-tint)",
              border: "1px solid rgba(255,183,3,0.32)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Icon name="Clock" size={18} color="var(--warning)" stroke={2.2} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontSize: 14.5, fontWeight: 600, color: "var(--text-primary)" }}>
                  Finish verification to get paid
                </span>
                <span style={{ fontSize: 12.5, color: "var(--text-secondary)" }}>
                  Two steps left · takes 1 to 3 days
                </span>
              </div>
            </div>
            <Link href="/kyc" style={{ textDecoration: "none" }}>
              <Button full iconRight="ArrowRight" style={{ height: 48 }}>
                Complete verification
              </Button>
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex" }}>
            <StatusPill kind="success">Verified — payouts active</StatusPill>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", borderRadius: "var(--radius-card)", background: "var(--surface-card)", border: "1px solid var(--border-hairline)", padding: 4 }}>
          <Link href="/messages">
            <ListRow
              title="Paid messages"
              subtitle={`On · ${formatNaira(creator.dmPrice)} a message`}
              icon="MessageCircle"
              meta="Edit"
              showChevron={false}
            />
          </Link>
          <Link href="/subscription">
            <ListRow
              title="Subscription"
              subtitle={currentSubscription.state === "active" ? `Active · ${tier === "pro" ? "Pro" : "Basic"}` : "Renew to keep uploading"}
              icon="CreditCard"
              meta="Manage"
              showChevron={false}
            />
          </Link>
          <Link href="/earnings">
            <ListRow
              title="Earnings"
              subtitle="Record of everything you earned"
              icon="ChartNoAxesColumn"
              meta="View"
              showChevron={false}
            />
          </Link>
          <Link href="/create/library">
            <ListRow
              title="My content"
              subtitle="Uploads, reviews and sales"
              icon="LayoutTemplate"
              meta="Open"
              showChevron={false}
            />
          </Link>
        </div>
      </div>
    </div>
  );
}
