"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { VerificationLevel } from "@/types/account";
import { submitVerification, resubmitVerification } from "@/lib/api/verification";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { FilePicker } from "@/components/ui/FilePicker";
import type { UploadedFile } from "@/lib/api/uploads";

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

/**
 * Requirements + document upload + submit for one verification level.
 * Shared by the mobile drill-down route (`/profile/verification/[tier]`,
 * design's own-screen apply flow) and the desktop inline expand on the main
 * ladder page (design D16 — all five levels on one page, no drilling in).
 * One form, two shells around it — not a fork.
 */
export function VerificationApplyForm({ tier, onDone }: { tier: VerificationLevel; onDone?: () => void }) {
  const router = useRouter();
  const [uploaded, setUploaded] = useState<UploadedFile[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string>();

  const requirements = REQUIREMENTS[tier];
  const isResubmit = tier === "certified_professional";

  // Real uploads. This used to append the literal string "Document N.pdf"
  // with no file dialog and no upload, then submit `documents: []`, which the
  // backend rejects (ArrayNotEmpty) — applicants believed they had attached
  // their ID and the submission either 400'd or landed empty.
  const addFile = (file: UploadedFile) => {
    setUploaded((u) => [...u, file]);
  };

  const finish = () => {
    if (onDone) onDone();
    else router.push("/profile/verification");
  };

  const submit = async () => {
    if (uploaded.length === 0) return;
    setSubmitting(true);
    setError(undefined);
    try {
      const documents = uploaded.map((f) => f.fileUrl);
      await (isResubmit ? resubmitVerification(tier, documents) : submitVerification(tier, documents));
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="flex flex-col items-center gap-[18px] px-7 py-10 text-center">
        <span className="grid h-[72px] w-[72px] place-items-center rounded-full border border-[rgba(74,222,128,0.35)] bg-[var(--success-tint)]">
          <Icon name="Check" size={34} color="var(--success)" strokeWidth={2.6} />
        </span>
        <div className="flex flex-col gap-[6px]">
          <span className="text-[20px] font-bold tracking-[-0.02em] text-text-primary">Application submitted</span>
          <span className="text-[13.5px] leading-[1.5] text-text-secondary">
            We review every application by hand. This usually takes 2–5 working days. We’ll notify you here when
            it’s done.
          </span>
        </div>
        <Button full onClick={finish} icon="ArrowRight">
          Back to verification
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-hairline bg-card p-4">
        <div className="flex items-center gap-[10px]">
          <Icon name="ShieldCheck" size={20} color="var(--accent)" strokeWidth={2} />
          <span className="text-[15px] font-semibold text-text-primary">Share who you are</span>
        </div>
        <p className="m-0 text-[13.5px] leading-[1.55] text-text-secondary">
          Our team reviews this by hand. Never send your BVN digits, passwords, or bank pins to anyone who asks for
          them. WAWU only ever asks here.
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
              key={f.key}
              className="flex items-center gap-[10px] rounded-[var(--radius-input)] border border-hairline bg-card px-[14px] py-[11px]"
            >
              <Icon name="FileCheck" size={16} color="var(--success)" strokeWidth={2} />
              <span className="flex-1 truncate text-[13.5px] text-text-primary">{f.name}</span>
              <button
                type="button"
                aria-label={`Remove ${f.name}`}
                onClick={() => setUploaded((u) => u.filter((x) => x !== f))}
                className="cursor-pointer border-none bg-transparent p-[2px] hover:bg-state-hover active:bg-state-press"
              >
                <Icon name="X" size={15} color="var(--text-muted)" strokeWidth={2} />
              </button>
            </div>
          ))}
          <FilePicker
            folder="service-application/document"
            accept="image/png,image/jpeg,application/pdf"
            label="Add a supporting document"
            hint="PDF, JPG or PNG. Add one at a time."
            onUploaded={addFile}
          />
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
