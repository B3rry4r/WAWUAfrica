import Link from "next/link";
import type { VerificationLevelEntry, VerificationSubmission } from "@/types/verification";
import { getVerificationLadder, getVerificationSubmissions } from "@/lib/api/verification";
import { getOwnProfile } from "@/lib/api/verification";
import { ProfileBackButton } from "@/components/profile/ProfileBackButton";
import { VerificationBadge, VERIFY_TIERS } from "@/components/ui/VerificationBadge";
import { StatusPill } from "@/components/ui/StatusPill";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { ErrorState } from "@/components/ui/ErrorState";

export default async function VerificationPage() {
  let ladder: VerificationLevelEntry[];
  let submissions: VerificationSubmission[];
  try {
    [ladder, submissions] = await Promise.all([getVerificationLadder(), getVerificationSubmissions()]);
  } catch (e) {
    const message = e instanceof Error ? e.message : undefined;
    return <ErrorState caption={message ?? "We couldn't load your verification."} />;
  }
  const own = await getOwnProfile();

  const current = ladder.find((l) => l.status === "yours");
  const next = ladder.find((l) => l.status === "next");
  const nextTier = next?.tier ?? "verified_business";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, padding: "16px 16px 96px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <ProfileBackButton compact />
        <span style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--text-primary)" }}>
          Verification
        </span>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          padding: 16,
          borderRadius: "var(--radius-card)",
          background: "var(--surface-card)",
          border: "1px solid var(--border-hairline)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Icon name="ShieldCheck" size={20} color="var(--accent)" stroke={2} />
          <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>Manual verification</span>
        </div>
        <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55, color: "var(--text-secondary)" }}>
          Every badge on WAWU is reviewed by a real person. We never charge for verification, and we never send links
          you have to click to “verify” yourself. If someone does, it isn’t us.
        </p>
      </div>

      {current && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 13,
            padding: 14,
            borderRadius: "var(--radius-card)",
            background: "var(--surface-elevated)",
            border: "1px solid var(--border-accent)",
          }}
        >
          <VerificationBadge tier={current.tier} size={34} />
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontSize: 15.5, fontWeight: 600, color: "var(--text-primary)" }}>
              {current.tier === "basic" ? "Basic profile" : VERIFY_TIERS[current.tier].label}
            </span>
            <span style={{ fontSize: 12.5, color: "var(--text-secondary)" }}>
              {current.tier === "basic"
                ? "Verify to show buyers you're real"
                : "Reviewed and approved by hand"}
            </span>
          </div>
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--accent)" }}>Current</span>
        </div>
      )}

      <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-muted)", padding: "0 2px" }}>
          The ladder
        </span>
        <div style={{ display: "flex", flexDirection: "column", borderRadius: "var(--radius-card)", background: "var(--surface-card)", border: "1px solid var(--border-hairline)", padding: 4 }}>
          {ladder.map((level, i) => {
            const t = VERIFY_TIERS[level.tier];
            const isNext = level.status === "next";
            const isYours = level.status === "yours";
            return (
              <div
                key={level.tier}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 13,
                  padding: "12px 12px",
                  borderRadius: "var(--radius-input)",
                  background: isNext ? "var(--accent-tint)" : "transparent",
                  border: `1px solid ${isNext ? "var(--border-accent)" : "transparent"}`,
                  opacity: level.status === "locked" ? 0.55 : 1,
                }}
              >
                {level.status === "done" ? (
                  <span
                    style={{
                      display: "grid",
                      placeItems: "center",
                      width: 34,
                      height: 34,
                      flexShrink: 0,
                      borderRadius: 999,
                      background: "var(--accent)",
                    }}
                  >
                    <Icon name="Check" size={15} color="#fff" stroke={2.6} />
                  </span>
                ) : level.status === "locked" ? (
                  <span
                    style={{
                      display: "grid",
                      placeItems: "center",
                      width: 34,
                      height: 34,
                      flexShrink: 0,
                      borderRadius: 999,
                      background: "var(--surface-tag)",
                      border: "1px solid var(--border-hairline)",
                    }}
                  >
                    <Icon name="Lock" size={14} color="var(--text-muted)" stroke={2} />
                  </span>
                ) : (
                  <VerificationBadge tier={level.tier} size={34} />
                )}
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{ fontSize: 14.5, fontWeight: 600, color: "var(--text-primary)" }}>
                    {level.tier === "basic" ? "Basic" : t.label}
                  </span>
                  <span style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.4 }}>{level.copy}</span>
                </div>
                {isNext && (
                  <Link href={`/profile/verification/${nextTier}`} style={{ textDecoration: "none" }}>
                    <Button size="sm">Start</Button>
                  </Link>
                )}
                {isYours && <StatusPill kind="info">You&apos;re here</StatusPill>}
              </div>
            );
          })}
        </div>
        <p style={{ margin: 0, fontSize: 11.5, lineHeight: 1.5, color: "var(--text-muted)", padding: "0 4px" }}>
          Verification is separate from your paid plan and your KYC status — the three are independent.
        </p>
      </section>

      <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-muted)", padding: "0 2px" }}>
          Recent
        </span>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {submissions.map((s, idx) => {
            const t = VERIFY_TIERS[s.tier];
            return (
              <div
                key={`${s.tier}-${idx}`}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  padding: 14,
                  borderRadius: "var(--radius-card)",
                  background: "var(--surface-card)",
                  border: "1px solid var(--border-hairline)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                  <VerificationBadge tier={s.tier} size={28} />
                  <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 1 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{t.label}</span>
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      Submitted {s.submittedAt}
                      {s.reviewedAt ? ` · Reviewed ${s.reviewedAt}` : ""}
                    </span>
                  </div>
                  {s.status === "in_review" && <StatusPill kind="warning">In review</StatusPill>}
                  {s.status === "approved" && <StatusPill kind="success">Approved</StatusPill>}
                  {s.status === "rejected" && <StatusPill kind="error">Needs changes</StatusPill>}
                </div>
                {s.reason && (
                  <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5, color: "var(--text-secondary)", padding: "10px 12px", borderRadius: "var(--radius-input)", background: "var(--surface-tag)" }}>
                    {s.reason}
                  </p>
                )}
                {s.status === "rejected" && (
                  <Link href={`/profile/verification/${s.tier}`} style={{ textDecoration: "none" }}>
                    <Button size="sm" variant="secondary" icon="RefreshCw" full>
                      Resubmit
                    </Button>
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}