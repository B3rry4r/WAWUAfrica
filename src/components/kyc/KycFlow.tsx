"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { kycApi } from "@/lib/api/kyc";
import type { KycStatus } from "@/types/account";
import { FlowHeader } from "@/components/layout/FlowHeader";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { StatusPill } from "@/components/ui/StatusPill";

type View = "form" | "pending" | "approved" | "rejected";
type Step = 1 | 2 | 3 | "review";

const docTypes = ["Passport", "Driver's licence", "Voter's card", "National ID card"];

export function KycFlow({ initialStatus }: { initialStatus: KycStatus }) {
  const router = useRouter();
  const [view, setView] = useState<View>(
    initialStatus === "approved" ? "approved" : initialStatus === "rejected" ? "rejected" : initialStatus === "pending" ? "pending" : "form",
  );
  const [step, setStep] = useState<Step>(1);
  const [docUploaded, setDocUploaded] = useState(false);
  const [consented, setConsented] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const submit = () => {
    setSubmitting(true);
    kycApi
      .submit({
        country: "Nigeria",
        bvn: "22123456789",
        nin: "98765432101",
        idDocumentType: "passport",
        payoutBankName: "Guaranty Trust Bank",
        payoutAccountNumber: "0123456789",
        status: "pending",
      })
      .then(() => {
        setSubmitting(false);
        setView("pending");
      });
  };

  const headerTitle =
    view === "pending" ? "Verify your identity" : view === "approved" ? "Verify your identity" : view === "rejected" ? "Verify your identity" : step === 1 ? "Verify your identity" : step === 2 ? (docUploaded ? "Check your photo" : "Verify your identity") : step === 3 ? "Where you get paid" : "Review and submit";

  const stepCount = step === "review" ? "3 of 3" : `${step} of 3`;

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", maxWidth: "var(--mobile-column)", margin: "0 auto" }}>
      <FlowHeader
        title={headerTitle}
        right={
          view === "form" && step !== "review" ? (
            <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-muted)", fontFeatureSettings: "var(--font-feature-tabular)" }}>{stepCount}</span>
          ) : (
            undefined
          )
        }
        onBack={view === "form" && step === 1 ? undefined : view === "form" ? () => backStep(step, docUploaded, setStep, setDocUploaded) : undefined}
      />

      <div style={{ display: "flex", justifyContent: "center", gap: 4, padding: "10px 16px 0" }}>
        {([
          ["form", "Form"],
          ["pending", "Pending"],
          ["approved", "Approved"],
          ["rejected", "Rejected"],
        ] as [View, string][]).map(([v, label]) => (
          <button
            key={v}
            type="button"
            onClick={() => setView(v)}
            style={{
              height: 30,
              padding: "0 14px",
              borderRadius: 999,
              border: view === v ? "1px solid var(--border-accent)" : "1px solid var(--border-hairline)",
              background: view === v ? "var(--accent-tint)" : "var(--surface-tag)",
              color: view === v ? "var(--accent)" : "var(--text-muted)",
              fontSize: 11.5,
              fontWeight: 600,
              fontFamily: "var(--font-sans)",
              cursor: "pointer",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, padding: "20px 16px 32px", display: "flex", flexDirection: "column", gap: 18 }}>
        {view === "form" && step === 1 ? <NationalIdStep /> : null}
        {view === "form" && step === 2 && !docUploaded ? <DocumentStep onCaptured={() => setDocUploaded(true)} /> : null}
        {view === "form" && step === 2 && docUploaded ? <CheckPhotoStep onRetake={() => setDocUploaded(false)} /> : null}
        {view === "form" && step === 3 ? <PayoutStep /> : null}
        {view === "form" && step === "review" ? (
          <ReviewStep consented={consented} onConsent={() => setConsented((c) => !c)} />
        ) : null}
        {view === "pending" ? <PendingState /> : null}
        {view === "approved" ? <ApprovedState /> : null}
        {view === "rejected" ? <RejectedState onResubmit={() => setView("form")} /> : null}
      </div>

      <div style={{ padding: "14px 16px 24px", borderTop: "1px solid var(--border-hairline)", display: "flex", flexDirection: "column", gap: 10 }}>
        {view === "form" && step === 1 ? (
          <Button full size="lg" iconRight="ArrowRight" onClick={() => setStep(2)}>
            Continue
          </Button>
        ) : null}
        {view === "form" && step === 2 && docUploaded ? (
          <div style={{ display: "flex", gap: 10 }}>
            <Button variant="secondary" size="lg" icon="RotateCw" style={{ flex: 1 }} onClick={() => setDocUploaded(false)}>
              Retake
            </Button>
            <Button size="lg" style={{ flex: 1 }} onClick={() => setStep(3)}>
              Looks good
            </Button>
          </div>
        ) : null}
        {view === "form" && step === 3 ? (
          <Button full size="lg" iconRight="ArrowRight" onClick={() => setStep("review")}>
            Review
          </Button>
        ) : null}
        {view === "form" && step === "review" ? (
          <Button full size="lg" loading={submitting} disabled={!consented} onClick={submit}>
            Submit for verification
          </Button>
        ) : null}
        {view === "pending" ? (
          <Button full size="lg" iconRight="ArrowRight" onClick={() => router.push("/profile")}>
            Go to your dashboard
          </Button>
        ) : null}
        {view === "approved" ? (
          <Button full size="lg" iconRight="ArrowRight" onClick={() => router.push("/profile")}>
            Go to your dashboard
          </Button>
        ) : null}
        {view === "rejected" ? (
          <>
            <Button full size="lg" onClick={() => setView("form")}>
              Resubmit KYC
            </Button>
            <Button full variant="ghost">Contact support</Button>
          </>
        ) : null}
      </div>
    </div>
  );
}

function backStep(step: Step, docUploaded: boolean, setStep: (s: Step) => void, setDocUploaded: (v: boolean) => void) {
  if (step === 2 && docUploaded) setDocUploaded(false);
  else if (step === "review") setStep(3);
  else if (step === 3) setStep(2);
  else if (step === 2) setStep(1);
}

function NationalIdStep() {
  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700, letterSpacing: "-0.025em" }}>Your national ID</h2>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: "var(--text-secondary)" }}>Both are required in Nigeria.</p>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: "var(--radius-input)", background: "var(--surface-card)", border: "1px solid var(--border-hairline)" }}>
        <Icon name="MapPin" size={16} color="var(--text-muted)" />
        <span style={{ flex: 1, fontSize: 13.5, color: "var(--text-secondary)" }}>Country on your account</span>
        <span style={{ fontSize: 13.5, fontWeight: 600 }}>Nigeria</span>
      </div>

      <Input label="BVN" defaultValue="22123456789" hint="11 digits." />
      <Input label="NIN" defaultValue="98765432101" hint="11 digits." />

      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: 14, borderRadius: "var(--radius-input)", background: "var(--surface-card)", border: "1px solid var(--border-hairline)" }}>
        <Icon name="ShieldCheck" size={16} color="var(--text-muted)" style={{ marginTop: 1 }} />
        <span style={{ flex: 1, fontSize: 13, lineHeight: 1.5, color: "var(--text-secondary)" }}>Used for verification only. Never shown on your profile.</span>
      </div>
    </>
  );
}

function DocumentStep({ onCaptured }: { onCaptured: () => void }) {
  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700, letterSpacing: "-0.025em" }}>Add an ID document</h2>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: "var(--text-secondary)" }}>Pick what you have to hand.</p>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {docTypes.map((d, i) => (
          <span
            key={d}
            style={{
              display: "inline-flex",
              alignItems: "center",
              height: 38,
              padding: "0 15px",
              borderRadius: 999,
              background: i === 0 ? "var(--accent)" : "var(--surface-tag)",
              border: i === 0 ? "none" : "1px solid var(--border-hairline)",
              color: i === 0 ? "var(--text-on-accent)" : "var(--text-secondary)",
              fontSize: 13.5,
              fontWeight: i === 0 ? 600 : 500,
            }}
          >
            {d}
          </span>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: "34px 20px", borderRadius: "var(--radius-media)", background: "repeating-linear-gradient(135deg, var(--surface-tag) 0 12px, var(--surface-card) 12px 24px)", border: "1px dashed var(--border-strong)" }}>
        <span style={{ display: "grid", placeItems: "center", width: 52, height: 52, borderRadius: 16, background: "var(--accent-tint)", border: "1px solid var(--border-accent)" }}>
          <Icon name="IdCard" size={22} stroke={2} color="var(--accent)" />
        </span>
        <span style={{ fontSize: 14.5, fontWeight: 600 }}>Photo of your passport</span>
        <span style={{ fontSize: 12.5, color: "var(--text-muted)", textAlign: "center" }}>All four corners in frame, no glare.</span>
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <Button icon="Camera" style={{ flex: 1 }} onClick={onCaptured}>
          Take a photo
        </Button>
        <Button variant="secondary" icon="Paperclip" style={{ flex: 1 }} onClick={onCaptured}>
          Choose file
        </Button>
      </div>

      <span style={{ fontSize: 12.5, lineHeight: 1.5, color: "var(--text-muted)" }}>JPG or PNG, up to 10MB.</span>
    </>
  );
}

function CheckPhotoStep({ onRetake }: { onRetake: () => void }) {
  return (
    <>
      <div style={{ width: "100%", aspectRatio: "3 / 2", borderRadius: "var(--radius-media)", background: "repeating-linear-gradient(135deg, var(--surface-tag) 0 12px, var(--surface-card) 12px 24px)", border: "1px solid var(--border-strong)" }} />

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: "-0.025em" }}>Can you read every line?</h2>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: "var(--text-secondary)" }}>If the name, number or expiry date is blurred, take it again — a blurred photo comes back rejected.</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13.5, color: "var(--text-secondary)" }}>
          <Icon name="Check" size={15} color="var(--success)" stroke={2.4} />
          All four corners visible
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13.5, color: "var(--text-secondary)" }}>
          <Icon name="Check" size={15} color="var(--success)" stroke={2.4} />
          No glare across the text
        </span>
      </div>
      <span style={{ fontSize: 12.5, color: "var(--text-muted)", cursor: "pointer" }} onClick={onRetake}>
        Not readable — retake the photo
      </span>
    </>
  );
}

function PayoutStep() {
  return (
    <>
      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: "var(--text-secondary)" }}>The account must be in your own name.</p>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>Bank</span>
        <button type="button" style={{ display: "flex", alignItems: "center", gap: 10, height: 52, padding: "0 16px", borderRadius: "var(--radius-input)", background: "var(--surface-input)", border: "1px solid var(--border-hairline)", color: "var(--text-primary)", fontFamily: "var(--font-sans)", fontSize: 15, cursor: "pointer", textAlign: "left" }}>
          <span style={{ flex: 1 }}>Guaranty Trust Bank</span>
          <Icon name="ChevronDown" size={16} stroke={2.2} color="var(--text-muted)" />
        </button>
      </div>

      <Input label="Account number" defaultValue="0123456789" />

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>Account name</span>
        <div style={{ display: "flex", alignItems: "center", gap: 10, height: 52, padding: "0 16px", borderRadius: "var(--radius-input)", background: "var(--surface-tag)", border: "1px solid var(--border-hairline)" }}>
          <span style={{ flex: 1, fontSize: 15, fontWeight: 600 }}>ADA OKEKE</span>
          <Icon name="Check" size={16} color="var(--success)" stroke={2.4} />
        </div>
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Pulled from your bank. It must match your ID.</span>
      </div>
    </>
  );
}

function ReviewStep({ consented, onConsent }: { consented: boolean; onConsent: () => void }) {
  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", borderRadius: "var(--radius-card)", background: "var(--surface-card)", border: "1px solid var(--border-hairline)", overflow: "hidden" }}>
        {[
          ["BVN", "2212•••6789"],
          ["NIN", "9876•••2101"],
          ["Document", "Passport"],
          ["Payout", "GTB ••••6789"],
        ].map(([k, v]) => (
          <div key={k} style={{ display: "flex", alignItems: "center", gap: 12, padding: "15px 18px", borderBottom: "1px solid var(--border-hairline)" }}>
            <span style={{ flex: 1, fontSize: 13.5, color: "var(--text-secondary)" }}>{k}</span>
            <span style={{ fontSize: 13.5, fontWeight: 600, fontFeatureSettings: "var(--font-feature-tabular)" }}>{v}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--accent)", cursor: "pointer" }}>Edit</span>
          </div>
        ))}
      </div>

      <div style={{ width: "100%", aspectRatio: "3 / 2", borderRadius: "var(--radius-media)", background: "repeating-linear-gradient(135deg, var(--surface-tag) 0 12px, var(--surface-card) 12px 24px)", border: "1px solid var(--border-hairline)" }} />

      <div style={{ display: "flex", alignItems: "flex-start", gap: 11 }} onClick={onConsent} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onConsent(); }}>
        <span
          style={{
            display: "grid",
            placeItems: "center",
            width: 22,
            height: 22,
            borderRadius: 7,
            background: consented ? "var(--accent)" : "var(--surface-tag)",
            border: consented ? "none" : "1px solid var(--border-hairline)",
            flexShrink: 0,
            marginTop: 1,
            cursor: "pointer",
          }}
        >
          {consented ? <Icon name="Check" size={14} stroke={3} color="#fff" /> : null}
        </span>
        <span style={{ flex: 1, fontSize: 13.5, lineHeight: 1.45, color: "var(--text-secondary)" }}>These details are mine and are correct.</span>
      </div>
    </>
  );
}

function PendingState() {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18, padding: "30px 12px", textAlign: "center" }}>
      <span style={{ display: "grid", placeItems: "center", width: 88, height: 88, borderRadius: 999, background: "var(--warning-tint)", border: "1px solid rgba(255,183,3,0.3)" }}>
        <Icon name="Clock" size={36} stroke={2.2} color="var(--warning)" />
      </span>
      <h2 style={{ margin: 0, fontSize: 26, fontWeight: 700, letterSpacing: "-0.03em" }}>KYC submitted</h2>
      <p style={{ margin: 0, fontSize: 15, lineHeight: 1.55, color: "var(--text-secondary)", maxWidth: 300 }}>Verification takes 1–3 days. We will notify you.</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 14, width: "100%", padding: 18, borderRadius: "var(--radius-card)", background: "var(--surface-card)", border: "1px solid var(--border-hairline)", textAlign: "left", marginTop: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
          <Icon name="Check" size={17} stroke={2.4} color="var(--success)" />
          <span style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>Uploading and selling</span>
          <StatusPill kind="success">On</StatusPill>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
          <Icon name="Clock" size={17} stroke={2.4} color="var(--warning)" />
          <span style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>Receiving earnings</span>
          <StatusPill kind="warning">In review</StatusPill>
        </div>
        <span style={{ fontSize: 12.5, lineHeight: 1.5, color: "var(--text-muted)", paddingTop: 12, borderTop: "1px solid var(--border-hairline)" }}>
          Start uploading now. Earnings from anything you sell are held and released once you are verified.
        </span>
      </div>
    </div>
  );
}

function ApprovedState() {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18, padding: "30px 12px", textAlign: "center" }}>
      <span style={{ display: "grid", placeItems: "center", width: 88, height: 88, borderRadius: 999, background: "var(--success-tint)", border: "1px solid rgba(184,232,62,0.3)" }}>
        <Icon name="ShieldCheck" size={36} stroke={2.2} color="var(--success)" />
      </span>
      <h2 style={{ margin: 0, fontSize: 26, fontWeight: 700, letterSpacing: "-0.03em" }}>You are verified</h2>
      <p style={{ margin: 0, fontSize: 15, lineHeight: 1.55, color: "var(--text-secondary)", maxWidth: 300 }}>Earnings will land in your GTB account ending 6789.</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 14, width: "100%", padding: 18, borderRadius: "var(--radius-card)", background: "var(--surface-card)", border: "1px solid var(--border-hairline)", textAlign: "left", marginTop: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
          <span style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>Uploading and selling</span>
          <StatusPill kind="success">On</StatusPill>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
          <span style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>Receiving earnings</span>
          <StatusPill kind="success">On</StatusPill>
        </div>
      </div>
    </div>
  );
}

function RejectedState({ onResubmit }: { onResubmit: () => void }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18, padding: "30px 12px", textAlign: "center" }}>
      <span style={{ display: "grid", placeItems: "center", width: 88, height: 88, borderRadius: 999, background: "var(--danger-tint)", border: "1px solid rgba(255,92,92,0.3)" }}>
        <Icon name="CircleAlert" size={36} stroke={2.2} color="var(--danger)" />
      </span>
      <h2 style={{ margin: 0, fontSize: 26, fontWeight: 700, letterSpacing: "-0.03em" }}>We could not verify you</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", padding: "16px 18px", borderRadius: "var(--radius-card)", background: "var(--danger-tint)", border: "1px solid rgba(255,92,92,0.32)", textAlign: "left" }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--danger)" }}>Reason</span>
        <span style={{ fontSize: 14, lineHeight: 1.5, color: "var(--text-primary)" }}>The name on your passport does not match the name on your bank account.</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 9, width: "100%", textAlign: "left" }}>
        <span style={{ fontSize: 13.5, lineHeight: 1.5, color: "var(--text-secondary)" }}>
          Fix one of the two and send it again — either a document in your bank's name, or a payout account in your ID's name.
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14, width: "100%", padding: 18, borderRadius: "var(--radius-card)", background: "var(--surface-card)", border: "1px solid var(--border-hairline)", textAlign: "left" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
          <span style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>Uploading and selling</span>
          <StatusPill kind="success">Still on</StatusPill>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
          <span style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>Receiving earnings</span>
          <StatusPill kind="error">Blocked</StatusPill>
        </div>
      </div>
    </div>
  );
}
