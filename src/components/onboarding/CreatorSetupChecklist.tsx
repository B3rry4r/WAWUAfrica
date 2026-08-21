"use client";

import Link from "next/link";
import { useCreatorSetup, type CreatorSetupStep } from "@/lib/auth/use-creator-setup";
import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";

/**
 * The dashboard's entry into setup. Compact by design — the dashboard is not
 * where the checklist lives, it is where a creator is reminded it exists.
 *
 * It renders whether or not setup is finished: the finished form is one quiet
 * row rather than nothing at all, because a creator who wants to change their
 * DM price or start a second community needs the door to still be there.
 */
export function CreatorSetupCard() {
  const { requiredDone, requiredTotal, complete, next, ready } = useCreatorSetup();

  if (!ready) return <Skeleton variant="row" className="h-[84px]" />;

  if (complete) {
    return (
      <Link
        href="/creator/setup"
        className="flex items-center gap-[11px] rounded-card border border-hairline bg-card px-[16px] py-[13px] no-underline transition-colors hover:bg-surface-hover active:bg-surface-press"
      >
        <Icon name="Check" size={16} strokeWidth={2.6} color="var(--success)" />
        <span className="flex-1 text-[13.5px] font-semibold text-text-primary">Your account is fully set up</span>
        <span className="text-[12.5px] font-bold text-text-muted">Review</span>
        <Icon name="ChevronRight" size={15} strokeWidth={2.2} color="var(--text-muted)" />
      </Link>
    );
  }

  const pct = requiredTotal === 0 ? 0 : Math.round((requiredDone / requiredTotal) * 100);

  return (
    <Link
      href="/creator/setup"
      className="flex flex-col gap-[11px] rounded-card border border-accent bg-elevated p-[16px] no-underline transition-colors hover:bg-surface-hover active:bg-surface-press"
    >
      <div className="flex items-center gap-[11px]">
        <span className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-[11px] border border-decor bg-[var(--decor-tint)]">
          <Icon name="ListChecks" size={17} strokeWidth={2.2} color="var(--accent)" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-[2px]">
          <span className="text-[14.5px] font-semibold text-text-primary">Finish setting up</span>
          <span className="truncate text-[12.5px] text-text-secondary">
            {next ? `Next: ${next.title.toLowerCase()}` : "A couple of things left"}
          </span>
        </span>
        <span className="text-[13px] font-bold text-text-secondary [font-feature-settings:var(--font-feature-tabular)]">
          {requiredDone}/{requiredTotal}
        </span>
        <Icon name="ChevronRight" size={16} strokeWidth={2.2} color="var(--accent)" />
      </div>
      <span className="h-[5px] overflow-hidden rounded-full bg-tag">
        {/* Live value — cannot be a static Tailwind class. */}
        <span
          className="block h-full rounded-full bg-[linear-gradient(90deg,var(--wawu-purple-deep),var(--accent))]"
          style={{ width: `${pct}%` }}
        />
      </span>
    </Link>
  );
}

/** The tick, the clock, or the step's own icon — one glance tells you where you are. */
function StepMark({ step }: { step: CreatorSetupStep }) {
  if (step.state === "done") {
    return (
      <span className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-[12px] border border-[rgba(184,232,62,0.28)] bg-[var(--success-tint)]">
        <Icon name="Check" size={18} strokeWidth={2.6} color="var(--success)" />
      </span>
    );
  }
  if (step.state === "waiting") {
    return (
      <span className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-[12px] border border-[rgba(255,183,3,0.3)] bg-[var(--warning-tint)]">
        <Icon name="Clock" size={18} strokeWidth={2.4} color="var(--warning)" />
      </span>
    );
  }
  return (
    <span className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-[12px] border border-decor bg-[var(--decor-tint)]">
      <Icon name={step.icon} size={18} strokeWidth={2.1} color="var(--accent)" />
    </span>
  );
}

function StepRow({ step }: { step: CreatorSetupStep }) {
  return (
    <Link
      href={step.href}
      className={`flex gap-[13px] rounded-card border p-[15px] no-underline transition-colors hover:bg-surface-hover active:bg-surface-press ${
        step.state === "done" ? "border-hairline bg-card opacity-[0.72]" : "border-hairline bg-card"
      }`}
    >
      <StepMark step={step} />
      <span className="flex min-w-0 flex-1 flex-col gap-[4px]">
        <span className="flex flex-wrap items-center gap-[8px]">
          <span className="text-[15px] font-semibold tracking-[-0.01em] text-text-primary">{step.title}</span>
          {step.optional ? (
            <span className="inline-flex h-[19px] items-center rounded-full bg-tag px-[7px] text-[10.5px] font-bold uppercase tracking-[0.05em] text-text-muted">
              Skippable
            </span>
          ) : null}
        </span>
        {step.state === "done" ? null : (
          <span className="text-[12.5px] leading-[1.5] text-text-secondary">{step.body}</span>
        )}
        <span
          className={`text-[12px] font-semibold ${
            step.state === "done"
              ? "text-[var(--success)]"
              : step.state === "waiting"
                ? "text-[var(--warning)]"
                : "text-text-muted"
          }`}
        >
          {step.detail}
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-[4px] self-center text-[12.5px] font-bold text-accent">
        {step.cta}
        <Icon name="ChevronRight" size={15} strokeWidth={2.4} color="var(--accent)" />
      </span>
    </Link>
  );
}

/**
 * The creator setup checklist.
 *
 * Every row's state is read live (see useCreatorSetup) — there is no local
 * "I did this" flag anywhere in here, so it is resumable by construction:
 * leave halfway through, come back on another device, and it picks up exactly
 * where the account actually is.
 *
 * It is never a wall. Nothing on this screen blocks anything; the creator can
 * ignore it entirely and every one of these surfaces still works. Verification
 * carries its own "skippable" mark because it genuinely is — it gates payouts,
 * not publishing (CLAUDE.md's two-independent-gates rule).
 *
 * `variant="panel"` is the compact form the dashboard embeds; the default is
 * the full page at /creator/setup.
 */
export function CreatorSetupChecklist({ variant = "page" }: { variant?: "page" | "panel" }) {
  const { steps, requiredDone, requiredTotal, complete, next, ready, error, reload } = useCreatorSetup();

  if (!ready) {
    return (
      <div className="flex flex-col gap-[10px]">
        <Skeleton variant="row" className="h-[64px]" />
        <Skeleton variant="row" className="h-[64px]" />
        <Skeleton variant="row" className="h-[64px]" />
      </div>
    );
  }

  const pct = requiredTotal === 0 ? 0 : Math.round((requiredDone / requiredTotal) * 100);
  const outstanding = steps.filter((s) => s.state === "todo");
  const settled = steps.filter((s) => s.state !== "todo");

  return (
    <div className="flex flex-col gap-[16px]">
      <div className="flex flex-col gap-[12px] rounded-card border border-hairline bg-card p-[18px]">
        <div className="flex items-baseline gap-[10px]">
          <span className="flex-1 text-[11px] font-bold uppercase tracking-[0.06em] text-text-muted">
            Setting up
          </span>
          <span className="text-[13px] font-semibold text-text-secondary [font-feature-settings:var(--font-feature-tabular)]">
            {requiredDone} of {requiredTotal}
          </span>
        </div>
        <div className="h-[6px] overflow-hidden rounded-full bg-tag">
          {/* A live percentage cannot be a static Tailwind class — same
              treatment as the dashboard's earnings bars. */}
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,var(--wawu-purple-deep),var(--accent))]"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-[13px] leading-[1.5] text-text-secondary">
          {complete
            ? "That is everything set up. Nothing below is blocking you — come back any time you want to change a price or start another room."
            : next
              ? `Next: ${next.title.toLowerCase()}. Nothing here is a wall — you can publish and sell before any of it is finished.`
              : "Work through these in any order. None of them blocks the others."}
        </span>
        {error ? (
          <button
            type="button"
            onClick={reload}
            className="self-start text-[12.5px] font-semibold text-danger underline underline-offset-2"
          >
            Some of this could not be checked. Try again.
          </button>
        ) : null}
      </div>

      {outstanding.length > 0 ? (
        <div className="flex flex-col gap-[10px]">
          {variant === "page" ? (
            <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-text-muted">Still to do</span>
          ) : null}
          {outstanding.map((s) => (
            <StepRow key={s.id} step={s} />
          ))}
        </div>
      ) : null}

      {settled.length > 0 ? (
        <div className="flex flex-col gap-[10px]">
          {variant === "page" ? (
            <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-text-muted">Sorted</span>
          ) : null}
          {settled.map((s) => (
            <StepRow key={s.id} step={s} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
