"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ProfileBackButton } from "@/components/profile/ProfileBackButton";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Icon } from "@/components/ui/Icon";

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
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18, padding: "64px 28px 96px", textAlign: "center" }}>
        <span style={{ display: "grid", placeItems: "center", width: 72, height: 72, borderRadius: 999, background: "var(--success-tint)", border: "1px solid rgba(184,232,62,0.35)" }}>
          <Icon name="Check" size={34} color="var(--success)" stroke={2.6} />
        </span>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--text-primary)" }}>
            Application submitted
          </span>
          <span style={{ fontSize: 13.5, lineHeight: 1.5, color: "var(--text-secondary)" }}>
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
    <div style={{ display: "flex", flexDirection: "column", gap: 18, padding: "14px 16px 96px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <ProfileBackButton compact />
        <span style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--text-primary)" }}>
          CAC registration
        </span>
      </div>

      <div style={{ display: "flex", gap: 6 }}>
        {[1, 2, 3].map((s) => (
          <div key={s} style={{ flex: 1, height: 4, borderRadius: 999, background: step >= s ? "var(--accent)" : "var(--surface-tag)", transition: "background 200ms" }} />
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        {STEP_LABELS.map((label, i) => (
          <span key={label} style={{ fontSize: 12, fontWeight: step === i + 1 ? 700 : 500, color: step === i + 1 ? "var(--accent)" : "var(--text-muted)" }}>
            {i + 1}. {label}
          </span>
        ))}
      </div>

      {step === 1 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Input label="Business name" value={name} onChange={setName} placeholder="e.g. Lagos Agro Supplies" />
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>Business type</span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {BUSINESS_TYPES.map((t) => {
                const active = businessType === t;
                return (
                  <button key={t} type="button" onClick={() => setBusinessType(t)} style={{ height: 34, padding: "0 14px", borderRadius: 999, border: `1px solid ${active ? "var(--border-accent)" : "var(--border-hairline)"}`, background: active ? "var(--accent-tint)" : "var(--surface-tag)", color: active ? "var(--accent)" : "var(--text-secondary)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                    {t}
                  </button>
                );
              })}
            </div>
          </div>
          <Input label="Owner's full name" value={ownerName} onChange={setOwnerName} />
          <Input label="Phone number" value={phone} onChange={setPhone} inputMode="tel" placeholder="0801 234 5678" />
        </div>
      )}

      {step === 2 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>Documents to add</span>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {docs.map((d) => (
              <div key={d} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", borderRadius: "var(--radius-input)", background: "var(--surface-card)", border: "1px solid var(--border-hairline)" }}>
                <Icon name="FileCheck" size={16} color="var(--success)" stroke={2} />
                <span style={{ flex: 1, fontSize: 13.5, color: "var(--text-primary)" }}>{d}</span>
                <button type="button" aria-label="Remove" onClick={() => setDocs((x) => x.filter((v) => v !== d))} style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}>
                  <Icon name="X" size={15} color="var(--text-muted)" stroke={2} />
                </button>
              </div>
            ))}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {DOC_TYPES.map((dt) => (
                <button
                  key={dt}
                  type="button"
                  onClick={() => setDocs((x) => (x.includes(dt) ? x : [...x, dt]))}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: "var(--radius-input)", border: "1.5px dashed var(--border-strong)", background: "transparent", cursor: "pointer", textAlign: "left" }}
                >
                  <Icon name="ImagePlus" size={17} color="var(--accent)" stroke={2} />
                  <span style={{ flex: 1, fontSize: 13.5, fontWeight: 600, color: "var(--text-secondary)" }}>Add {dt}</span>
                  {docs.includes(dt) && <Icon name="Check" size={16} color="var(--accent)" stroke={2.6} />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <ReviewRow label="Business name" value={name} />
          <ReviewRow label="Business type" value={businessType} />
          <ReviewRow label="Owner" value={ownerName} />
          <ReviewRow label="Phone" value={phone} />
          <ReviewRow label="Documents" value={`${docs.length} added`} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderRadius: "var(--radius-input)", background: "var(--surface-tag)", border: "1px solid var(--border-hairline)" }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>Registration fee</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", fontFeatureSettings: "var(--font-feature-tabular)" }}>From ₦25,000</span>
          </div>
        </div>
      )}

      {error && (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--danger)" }}>
          <Icon name="CircleAlert" size={14} color="var(--danger)" />
          {error}
        </span>
      )}

      <div style={{ display: "flex", gap: 10 }}>
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
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "12px 14px", borderRadius: "var(--radius-input)", background: "var(--surface-card)", border: "1px solid var(--border-hairline)" }}>
      <span style={{ fontSize: 13.5, color: "var(--text-muted)" }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", textAlign: "right" }}>{value}</span>
    </div>
  );
}