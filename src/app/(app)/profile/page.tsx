"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { StatusPill } from "@/components/ui/StatusPill";
import { Button } from "@/components/ui/Button";
import { useSession } from "@/lib/auth/session-provider";
import { formatCredits } from "@/lib/format";

/**
 * Minimal Profile shell for frontend-only testing — Dev C owns the real one.
 * Gives the test run a place to see the signed-in account and to sign out
 * (otherwise there is no way back to the landing page). Not the final design.
 */
export default function ProfilePage() {
  const router = useRouter();
  const { user, accountType, signOut } = useSession();

  if (!user) {
    return (
      <div className="flex flex-col gap-4 px-4 pb-8 pt-10 text-center">
        <span className="mx-auto grid h-[64px] w-[64px] place-items-center rounded-button bg-tag text-text-muted">
          <Icon name="CircleUser" size={28} />
        </span>
        <p className="m-0 text-[15px] font-semibold">Not signed in</p>
        <p className="m-0 text-[13.5px] text-text-secondary">Sign in to see your profile and purchases.</p>
        <div className="mx-auto w-full max-w-[280px]">
          <Button full size="lg" href="/sign-in">
            Sign in
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 px-4 pb-8 pt-2">
      <h1 className="m-0 text-[22px] font-bold tracking-[-0.02em]">Profile</h1>

      <div className="flex items-center gap-3.5 rounded-card border border-hairline bg-card p-4">
        <span className="grid h-[52px] w-[52px] shrink-0 place-items-center rounded-full bg-accent-tint text-[19px] font-semibold text-accent-hover">
          {user.fullName?.charAt(0)?.toUpperCase() ?? "W"}
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-[16px] font-semibold">{user.fullName}</span>
          <span className="truncate text-[13px] text-text-muted">{user.email}</span>
        </span>
        <StatusPill kind={accountType === "creator" ? "info" : "neutral"}>
          {accountType === "creator" ? "Creator" : "User"}
        </StatusPill>
      </div>

      <div className="flex flex-col gap-2.5">
        <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-text-muted">Test account</span>
        <div className="flex items-center justify-between rounded-card border border-hairline bg-card px-4 py-3.5">
          <span className="text-[14px] text-text-secondary">WAWU Credits</span>
          <span className="text-[14px] font-semibold" style={{ fontFeatureSettings: "var(--font-feature-tabular)" }}>
            {formatCredits(48)}
          </span>
        </div>
        <Link
          href="/purchases"
          className="flex items-center gap-3 rounded-card border border-hairline bg-card px-4 py-3.5 text-[14px] font-semibold"
        >
          <Icon name="PackageOpen" size={17} color="var(--text-muted)" />
          <span className="flex-1">My purchases</span>
          <Icon name="ChevronRight" size={16} color="var(--text-muted)" />
        </Link>
        <span className="text-[12px] leading-relaxed text-text-muted">
          This is a placeholder shell so the frontend can be tested without a backend. The real profile (KYC status, tiers, settings) is built by Dev C.
        </span>
      </div>

      <div className="mt-auto">
        <Button
          full
          variant="secondary"
          icon="LogOut"
          onClick={() => {
            signOut();
            router.push("/");
          }}
        >
          Sign out
        </Button>
      </div>
    </div>
  );
}