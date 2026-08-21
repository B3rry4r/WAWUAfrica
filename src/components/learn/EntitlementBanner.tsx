import type { LearnEntitlement } from "@/types/learn";
import { TierBadge } from "@/components/ui/TierBadge";
import { Icon } from "@/components/ui/Icon";

/**
 * Free-course entitlement banner. "compact" is the landing-page row; "full" is
 * the bigger card on the all-courses screen with progress dots. Never a Naira
 * value — this is a subscription-tier perk (count of slots), not a purchase.
 */
export function EntitlementBanner({ entitlement, variant = "compact" }: { entitlement: LearnEntitlement; variant?: "compact" | "full" }) {
  const { freeCoursesTotal, freeCoursesRemaining, tier, isCreator } = entitlement;

  if (!isCreator || freeCoursesTotal === 0) {
    return (
      <div className="flex items-center gap-3 rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[13px]">
        <span className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-[12px] border border-[var(--border-hairline)] bg-[var(--surface-tag)]">
          <Icon name="GraduationCap" size={17} color="var(--text-muted)" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-[14.5px] font-semibold text-[var(--text-primary)]">No course claimed yet</span>
          <span className="text-[12.5px] text-[var(--text-secondary)]">Courses at no charge come with a creator subscription.</span>
        </div>
      </div>
    );
  }

  if (variant === "full") {
    return (
      <div className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-[var(--border-decor)] bg-[var(--surface-elevated)] p-4">
        <div className="flex items-center gap-2.5">
          <TierBadge tier={tier} />
          <span className="flex-1 text-[12.5px] text-[var(--text-muted)]">Your entitlement</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-[30px] font-bold tracking-[-0.03em] text-[var(--text-primary)] [font-feature-settings:var(--font-feature-tabular)]">
            {freeCoursesRemaining}
          </span>
          <span className="flex-1 text-[14px] text-[var(--text-secondary)]">
            of {freeCoursesTotal} included course{freeCoursesTotal === 1 ? "" : "s"} left
          </span>
        </div>
        <div className="flex gap-1.5">
          {Array.from({ length: freeCoursesTotal }).map((_, i) => (
            <span
              key={i}
              className={`h-1.5 flex-1 rounded-full ${i < freeCoursesTotal - freeCoursesRemaining ? "bg-[var(--surface-tag)]" : "bg-[var(--accent)]"}`}
            />
          ))}
        </div>
        <span className="text-[12.5px] text-[var(--text-muted)]">
          {tier === "pro"
            ? "Pick any course in the catalogue. They do not expire while Pro is active."
            : "Basic carries one, spend it on something you will finish."}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-[var(--radius-input)] border border-[var(--border-decor)] bg-[var(--decor-tint)] p-[13px_15px]">
      <Icon name="GraduationCap" size={17} color="var(--accent)" strokeWidth={2.2} />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-[14px] font-semibold text-[var(--text-primary)]">
          {freeCoursesRemaining} included course{freeCoursesRemaining === 1 ? "" : "s"} available
        </span>
        <span className="text-[12.5px] text-[var(--text-secondary)]">Comes with your {tier === "pro" ? "Pro" : "Basic"} tier</span>
      </div>
      <TierBadge tier={tier} />
    </div>
  );
}
