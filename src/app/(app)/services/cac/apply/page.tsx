"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ProfileBackButton } from "@/components/profile/ProfileBackButton";
import { Button, Icon, Input } from "@/components/ui";

type Step = 1 | 2 | 3;
const STEP_LABELS = ["Details", "Documents", "Review"];
const BUSINESS_TYPES = ["Sole proprietorship", "Partnership", "Limited"];

const DOC_TYPES = ["Government-issued ID", "Passport photo", "Proof of address"];

export default function CacApplyPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [name, setName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState("");
  const [docs, setDocs] = useState<string[]>([]);
  const [error, setError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const canContinue = (s: Step) => {
    if (s === 1) return !!(name.trim() && businessType && ownerName.trim() && phone.trim());
    if (s === 2) return docs.length > 0;
    return true;
  };

  const next = () => {
    setError(undefined);
    if (!canContinue(step)) {
      setError(step === 1 ? "Fill in every field to continue." : "Add at least one document.");
      return;
    }
    setStep((s) => (s + 1) as Step);
  };

  const submit = async () => {
    setSubmitting(true);
    setError(undefined);
    await new Promise((r) => setTimeout(r, 700));
    setSubmitting(false);
    setDone(true);
  };

  if (done) {
    return (
      <div className="flex flex-col items-center gap-[18px] p-[64px_28px_96px] text-center">
        <span className="grid h-[72px] w-[72px] place-items-center rounded-full border border-[rgba(184,232,62,0.35)] bg-[var(--success-tint)]">
          <Icon name="Check" size={34} color="var(--success)" strokeWidth={2.6} />
        </span>
        <div className="flex flex-col gap-[6px]">
          <span className="text-[20px] font-bold tracking-[-0.02em] text-[var(--text-primary)]">
            Application submitted
          </span>
          <span className="text-[13.5px] leading-[1.5] text-[var(--text-secondary)]">
            Your details are with the CAC agent. Expect review within 7–14 days — we&apos;ll update you here.
          </span>
        </div>
        <Button full onClick={() => router.push("/services/cac")}>
          Back to CAC registration
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[18px] p-[14px_16px_96px]">
      <div className="flex items-center gap-[10px]">
        <ProfileBackButton compact />
        <span className="text-[18px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
          CAC registration
        </span>
      </div>

      <div className="flex gap-[6px]">
        {[1, 2, 3].map((s) => (
          <div key={s} className={["h-[4px] flex-1 rounded-full transition-colors duration-200", step >= s ? "bg-[var(--accent)]" : "bg-[var(--surface-tag)]"].join(" ")} />
        ))}
      </div>
      <div className="flex justify-between">
        {STEP_LABELS.map((label, i) => (
          <span key={label} className={["text-[12px]", step === i + 1 ? "font-bold text-[var(--accent)]" : "font-medium text-[var(--text-muted)]"].join(" ")}>
            {i + 1}. {label}
          </span>
        ))}
      </div>

      {step === 1 && (
        <div className="flex flex-col gap-[14px]">
          <Input label="Business name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Lagos Agro Supplies" />
          <div className="flex flex-col gap-[8px]">
            <span className="text-[13px] font-semibold text-[var(--text-secondary)]">Business type</span>
            <div className="flex flex-wrap gap-[8px]">
              {BUSINESS_TYPES.map((t) => {
                const active = businessType === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setBusinessType(t)}
                    className={[
                      "h-[34px] cursor-pointer rounded-full border px-[14px] text-[13px] font-semibold",
                      active ? "border-[var(--border-accent)] bg-[var(--accent-tint)] text-[var(--accent)]" : "border-[var(--border-hairline)] bg-[var(--surface-tag)] text-[var(--text-secondary)]",
                    ].join(" ")}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>
          <Input label="Owner's full name" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} />
          <Input label="Phone number" value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="0801 234 5678" />
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-[14px]">
          <span className="text-[13px] font-semibold text-[var(--text-secondary)]">Documents to add</span>
          <div className="flex flex-col gap-[8px]">
            {docs.map((d) => (
              <div key={d} className="flex items-center gap-[10px] rounded-[var(--radius-input)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[11px_14px]">
                <Icon name="FileCheck" size={16} color="var(--success)" />
                <span className="flex-1 text-[13.5px] text-[var(--text-primary)]">{d}</span>
                <button type="button" aria-label="Remove" onClick={() => setDocs((x) => x.filter((v) => v !== d))} className="cursor-pointer border-0 bg-transparent p-[2px]">
                  <Icon name="X" size={15} color="var(--text-muted)" />
                </button>
              </div>
            ))}
            <div className="flex flex-col gap-[8px]">
              {DOC_TYPES.map((dt) => (
                <button
                  key={dt}
                  type="button"
                  onClick={() => setDocs((x) => (x.includes(dt) ? x : [...x, dt]))}
                  className="flex cursor-pointer items-center gap-[10px] rounded-[var(--radius-input)] border-[1.5px] border-dashed border-[var(--border-strong)] bg-transparent p-[12px_14px] text-left"
                >
                  <Icon name="ImagePlus" size={17} color="var(--accent)" />
                  <span className="flex-1 text-[13.5px] font-semibold text-[var(--text-secondary)]">Add {dt}</span>
                  {docs.includes(dt) && <Icon name="Check" size={16} color="var(--accent)" strokeWidth={2.6} />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-col gap-[12px]">
          <ReviewRow label="Business name" value={name} />
          <ReviewRow label="Business type" value={businessType} />
          <ReviewRow label="Owner" value={ownerName} />
          <ReviewRow label="Phone" value={phone} />
          <ReviewRow label="Documents" value={`${docs.length} added`} />
          <div className="flex items-center justify-between rounded-[var(--radius-input)] border border-[var(--border-hairline)] bg-[var(--surface-tag)] p-[12px_14px]">
            <span className="text-[14px] font-semibold text-[var(--text-primary)]">Registration fee</span>
            <span className="text-[15px] font-bold text-[var(--text-primary)] [font-feature-settings:var(--font-feature-tabular)]">From ₦25,000</span>
          </div>
        </div>
      )}

      {error && (
        <span className="inline-flex items-center gap-[6px] text-[12.5px] text-[var(--danger)]">
          <Icon name="CircleAlert" size={14} color="var(--danger)" />
          {error}
        </span>
      )}

      <div className="flex gap-[10px]">
        {step > 1 && (
          <Button variant="secondary" onClick={() => setStep((s) => (s - 1) as Step)}>
            Back
          </Button>
        )}
        {step < 3 ? (
          <Button full onClick={next}>
            Continue
          </Button>
        ) : (
          <Button full disabled={submitting} onClick={submit}>
            {submitting ? "Submitting…" : "Submit application"}
          </Button>
        )}
      </div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-[12px] rounded-[var(--radius-input)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[12px_14px]">
      <span className="text-[13.5px] text-[var(--text-muted)]">{label}</span>
      <span className="text-right text-[14px] font-semibold text-[var(--text-primary)]">{value}</span>
    </div>
  );
}
