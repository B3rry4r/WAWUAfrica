import Link from "next/link";
import { ProfileHeader } from "@/components/ui/ProfileHeader";
import { StatBlock } from "@/components/ui/StatBlock";
import { ListRow } from "@/components/ui/ListRow";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { StatusPill } from "@/components/ui/StatusPill";
import { currentSession } from "@/lib/api/mocks/session";
import { creatorGates } from "@/lib/auth/gates";
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
        <div className="flex justify-center p-[16px]">
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

  const gates = creatorGates(currentSession);
  const kycPending = !gates.canEarn;
  const held = kycPending;
  const tier = gates.tier ?? creator.tier;
  const earned = held ? currentEarnings.held : currentEarnings.payable + currentEarnings.held;

  return (
    <div>
      <div className="flex justify-center p-[16px]">
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

      <div className="py-[16px] px-[20px] flex flex-col gap-[14px]">
        <Link href="/creator" className="no-underline">
          <div
            className="flex flex-col gap-[14px] p-[18px] rounded-[var(--radius-card)] bg-[var(--surface-elevated)] border border-[var(--border-accent)]"
          >
            <div className="flex items-center gap-[11px]">
              <span className="grid place-items-center w-[40px] h-[40px] rounded-[13] bg-[var(--accent-tint)] border border-[var(--border-accent)] shrink-0">
                <Icon name="ChartNoAxesColumn" size={18} color="var(--accent)" stroke={2} />
              </span>
              <div className="flex-1 flex flex-col gap-[2px]">
                <span className="text-[16px] font-semibold text-[var(--text-primary)]">Creator dashboard</span>
                <span className="text-[12.5px] text-[var(--text-secondary)]">Earnings, content, inbox, tier</span>
              </div>
              <Icon name="ChevronRight" size={18} color="var(--accent)" stroke={2.2} />
            </div>
            <div className="flex gap-[10px] pt-[14px] border-t border-t-[var(--border-hairline)]">
              <div className="flex-1">
                <StatBlock value={formatNaira(earned)} label="This month" align="start" size="sm" />
              </div>
              <div className="flex-1">
                <StatBlock value={String(currentMessaging.threads.filter((t) => !t.opened).length)} label="To reply" align="start" size="sm" />
              </div>
            </div>
          </div>
        </Link>

        {kycPending ? (
          <div
            className="flex flex-col gap-[12px] p-[14px] rounded-[var(--radius-card)] bg-[var(--warning-tint)] border border-[rgba(255,183,3,0.32)]"
          >
            <div className="flex items-center gap-[12px]">
              <Icon name="Clock" size={18} color="var(--warning)" stroke={2.2} />
              <div className="flex-1 flex flex-col gap-[2px]">
                <span className="text-[14.5px] font-semibold text-[var(--text-primary)]">
                  Finish verification to get paid
                </span>
                <span className="text-[12.5px] text-[var(--text-secondary)]">
                  Two steps left · takes 1 to 3 days
                </span>
              </div>
            </div>
            <Link href="/kyc" className="no-underline">
              <Button full iconRight="ArrowRight" className="h-[48px]">
                Complete verification
              </Button>
            </Link>
          </div>
        ) : (
          <div className="flex">
            <StatusPill kind="success">Verified — payouts active</StatusPill>
          </div>
        )}

        <div className="flex flex-col rounded-[var(--radius-card)] bg-[var(--surface-card)] border border-[var(--border-hairline)] p-[4px]">
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
