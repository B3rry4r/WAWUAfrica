"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import type { VerificationLevel } from "@/types/account";
import { submitVerification, resubmitVerification } from "@/lib/api/verification";
import { VERIFY_TIER_LABELS } from "@/types/verification";
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
    return <ErrorState title="That verification level doesn't exist." onRetry={() => router.push("/profile/verification")} />;
  }

  const t = VERIFY_TIER_LABELS[tier];
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
      <div className="flex flex-col items-center gap-[18px] px-7 pb-24 pt-[72px] text-center">
        <span className="grid h-[72px] w-[72px] place-items-center rounded-full border border-[rgba(74,222,128,0.35)] bg-[var(--success-tint)]">
          <Icon name="Check" size={34} color="var(--success)" strokeWidth={2.6} />
        </span>
        <div className="flex flex-col gap-[6px]">
          <span className="text-[20px] font-bold tracking-[-0.02em] text-text-primary">
            Application submitted
          </span>
          <span className="text-[13.5px] leading-[1.5] text-text-secondary">
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
    <div className="flex flex-col gap-5 px-4 pb-24 pt-4">
      <div className="flex items-center gap-[10px]">
        <ProfileBackButton compact />
        <span className="text-[18px] font-semibold tracking-[-0.02em] text-text-primary">
          {t}
        </span>
      </div>

      <div className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-hairline bg-card p-4">
        <div className="flex items-center gap-[10px]">
          <Icon name="ShieldCheck" size={20} color="var(--accent)" strokeWidth={2} />
          <span className="text-[15px] font-semibold text-text-primary">Share who you are</span>
        </div>
        <p className="m-0 text-[13.5px] leading-[1.55] text-text-secondary">
          Our team reviews this by hand. Never send your BVN digits, passwords, or bank pins to anyone who asks for
          them — WAWU only ever asks here.
        </p>
      </div>

      <section className="flex flex-col gap-[10px]">
        <span className="text-[13px] font-semibold text-text-secondary">What you’ll need</span>
        <div className="flex flex-col gap-2">
          {requirements.map((req) => (
            <div
              key={req}
              className="flex items-start gap-[10px] rounded-[var(--radius-input)] border border-hairline bg-tag px-[14px] py-3"
            >
              <Icon name="FileText" size={16} color="var(--accent)" strokeWidth={2} className="mt-px" />
              <span className="text-[13.5px] leading-[1.45] text-text-primary">{req}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-[10px]">
        <span className="text-[13px] font-semibold text-text-secondary">Documents</span>
        <div className="flex flex-col gap-2">
          {uploaded.map((f) => (
            <div
              key={f}
              className="flex items-center gap-[10px] rounded-[var(--radius-input)] border border-hairline bg-card px-[14px] py-[11px]"
            >
              <Icon name="FileCheck" size={16} color="var(--success)" strokeWidth={2} />
              <span className="flex-1 text-[13.5px] text-text-primary">{f}</span>
              <button
                type="button"
                aria-label="Remove"
                onClick={() => setUploaded((u) => u.filter((x) => x !== f))}
                className="cursor-pointer border-none bg-transparent p-[2px]"
              >
                <Icon name="X" size={15} color="var(--text-muted)" strokeWidth={2} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addFile}
            className="flex h-[52px] cursor-pointer items-center justify-center gap-[9px] rounded-[var(--radius-input)] border-[1.5px] border-dashed border-strong bg-transparent text-[14px] font-semibold text-text-secondary"
          >
            <Icon name="ImagePlus" size={18} color="var(--accent)" strokeWidth={2} />
            Add files
          </button>
        </div>
        {error && (
          <span className="inline-flex items-center gap-[6px] text-[12.5px] text-[var(--danger)]">
            <Icon name="CircleAlert" size={14} color="var(--danger)" />
            {error}
          </span>
        )}
      </section>

      <Button full disabled={uploaded.length === 0 || submitting} onClick={submit}>
        {submitting ? "Submitting…" : "Submit application"}
      </Button>
      <p className="m-0 px-3 text-center text-[11.5px] leading-[1.5] text-text-muted">
        Usually reviewed within 2–5 working days.
      </p>
    </div>
  );
}
