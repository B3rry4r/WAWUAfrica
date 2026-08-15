"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import type { VerificationLevel } from "@/types/account";
import { submitVerification, resubmitVerification } from "@/lib/api/verification";
import { VERIFY_TIERS } from "@/components/ui/VerificationBadge";
import { ProfileBackButton } from "@/components/profile/ProfileBackButton";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { ErrorState } from "@/components/ui/ErrorState";

const REQUIREMENTS: Record<VerificationLevel, string[]> = {
  basic: ["A phone number and email on the account"],
  verified_user: [
    "A government-issued ID (Nigeria: BVN + NIN; elsewhere: the national-ID equivalent)",
    "A clear selfie to compare against the ID",
    "Your phone number on the account",
  ],
  verified_business: [
    "Business registration (CAC or equivalent)",
    "A website or an active public profile",
    "Your WAWU handle visible on that profile",
    "A trading name that matches your documents",
  ],
  certified_professional: [
    "A current professional certificate or practising licence",
    "A letter or link from the issuing body confirming it is still current",
    "Your WAWU handle on the certificate",
  ],
  trusted_partner: [
    "A signed WAWU partnership agreement",
    "A reference from your WAWU partnership manager",
  ],
};

export default function VerificationApplyPage() {
  const router = useRouter();
  const params = useParams();
  const tier = String(params?.tier ?? "") as VerificationLevel;

  const [uploaded, setUploaded] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string>();

  if (!(tier in REQUIREMENTS)) {
    return <ErrorState caption="That verification level doesn't exist." onRetry={() => router.push("/profile/verification")} />;
  }

  const t = VERIFY_TIERS[tier];
  const requirements = REQUIREMENTS[tier];
  const isResubmit = tier === "certified_professional";

  const addFile = () => {
    setUploaded((u) => [...u, `Document ${u.length + 1}.pdf`]);
  };

  const submit = async () => {
    if (uploaded.length === 0) return;
    setSubmitting(true);
    setError(undefined);
    try {
      await (isResubmit ? resubmitVerification(tier) : submitVerification(tier));
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18, padding: "72px 28px 96px", textAlign: "center" }}>
        <span
          style={{
            display: "grid",
            placeItems: "center",
            width: 72,
            height: 72,
            borderRadius: 999,
            background: "var(--success-tint)",
            border: "1px solid rgba(74,222,128,0.35)",
          }}
        >
          <Icon name="Check" size={34} color="var(--success)" stroke={2.6} />
        </span>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--text-primary)" }}>
            Application submitted
          </span>
          <span style={{ fontSize: 13.5, lineHeight: 1.5, color: "var(--text-secondary)" }}>
            We review every application by hand. This usually takes 2–5 working days — we’ll notify you here when it’s done.
          </span>
        </div>
        <Button full onClick={() => router.push("/profile/verification")} icon="ArrowRight">
          Back to verification
        </Button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, padding: "16px 16px 96px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <ProfileBackButton compact />
        <span style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--text-primary)" }}>
          {t.label}
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
          <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>Share who you are</span>
        </div>
        <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55, color: "var(--text-secondary)" }}>
          Our team reviews this by hand. Never send your BVN digits, passwords, or bank pins to anyone who asks for
          them — WAWU only ever asks here.
        </p>
      </div>

      <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>What you’ll need</span>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {requirements.map((req) => (
            <div
              key={req}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                padding: "12px 14px",
                borderRadius: "var(--radius-input)",
                background: "var(--surface-tag)",
                border: "1px solid var(--border-hairline)",
              }}
            >
              <Icon name="FileText" size={16} color="var(--accent)" stroke={2} style={{ marginTop: 1 }} />
              <span style={{ fontSize: 13.5, lineHeight: 1.45, color: "var(--text-primary)" }}>{req}</span>
            </div>
          ))}
        </div>
      </section>

      <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>Documents</span>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {uploaded.map((f) => (
            <div
              key={f}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "11px 14px",
                borderRadius: "var(--radius-input)",
                background: "var(--surface-card)",
                border: "1px solid var(--border-hairline)",
              }}
            >
              <Icon name="FileCheck" size={16} color="var(--success)" stroke={2} />
              <span style={{ flex: 1, fontSize: 13.5, color: "var(--text-primary)" }}>{f}</span>
              <button
                type="button"
                aria-label="Remove"
                onClick={() => setUploaded((u) => u.filter((x) => x !== f))}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}
              >
                <Icon name="X" size={15} color="var(--text-muted)" stroke={2} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addFile}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 9,
              height: 52,
              borderRadius: "var(--radius-input)",
              border: "1.5px dashed var(--border-strong)",
              background: "transparent",
              color: "var(--text-secondary)",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <Icon name="ImagePlus" size={18} color="var(--accent)" stroke={2} />
            Add files
          </button>
        </div>
        {error && (
          <span style={{ fontSize: 12.5, color: "var(--danger)", display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Icon name="CircleAlert" size={14} color="var(--danger)" />
            {error}
          </span>
        )}
      </section>

      <Button full disabled={uploaded.length === 0 || submitting} onClick={submit}>
        {submitting ? "Submitting…" : "Submit application"}
      </Button>
      <p style={{ margin: 0, fontSize: 11.5, lineHeight: 1.5, color: "var(--text-muted)", textAlign: "center", padding: "0 12px" }}>
        Usually reviewed within 2–5 working days.
      </p>
    </div>
  );
}