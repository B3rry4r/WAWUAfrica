"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { kycApi } from "@/lib/api/kyc";
import { FlowHeader } from "@/components/layout/FlowHeader";
import { Button } from "@/components/ui/Button";
import { ErrorState, Skeleton } from "@/components/ui/Feedback";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { StatusPill } from "@/components/ui/StatusPill";

type View = "loading" | "load-error" | "form" | "pending" | "approved" | "rejected";
type Step = 1 | 2 | 3 | "review";

const docTypes = ["Passport", "Driver's licence", "Voter's card", "National ID card"];

function viewForStatus(status: "not_started" | "pending" | "approved" | "rejected"): View {
  return status === "not_started" ? "form" : status;
}

export function KycFlow() {
  const router = useRouter();
  const [view, setView] = useState<View>("loading");
  const [step, setStep] = useState<Step>(1);
  const [docUploaded, setDocUploaded] = useState(false);
  const [consented, setConsented] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [bvn, setBvn] = useState("");
  const [nin, setNin] = useState("");
  const [payoutAccountNumber, setPayoutAccountNumber] = useState("");

  const loadStatus = () => {
    setView("loading");
    kycApi
      .getStatus()
      .then((submission) => setView(viewForStatus(submission.status)))
      .catch(() => setView("load-error"));
  };

  useEffect(loadStatus, []);

  const submit = () => {
    setSubmitting(true);
    setSubmitError(null);
    kycApi
      .submit({
        country: "Nigeria",
        bvn,
        nin,
        idDocumentType: "passport",
        payoutBankName: "Guaranty Trust Bank",
        payoutAccountNumber,
        status: "pending",
      })
      .then(() => {
        setSubmitting(false);
        setView("pending");
      })
      .catch((err) => {
        setSubmitting(false);
        setSubmitError(err instanceof Error ? err.message : "Could not submit your verification. Try again.");
      });
  };

  const headerTitle =
    view === "pending" ? "Verify your identity" : view === "approved" ? "Verify your identity" : view === "rejected" ? "Verify your identity" : step === 1 ? "Verify your identity" : step === 2 ? (docUploaded ? "Check your photo" : "Verify your identity") : step === 3 ? "Where you get paid" : "Review and submit";

  const stepCount = step === "review" ? "3 of 3" : `${step} of 3`;

  if (view === "loading") {
    return (
      <div className="flex flex-col min-h-[100vh] max-w-[var(--mobile-column)] m-0">
        <FlowHeader title="Verify your identity" />
        <div className="flex-1 pt-[20px] px-[20px] pb-[32px] flex flex-col gap-[14px]">
          <Skeleton height={22} width="60%" />
          <Skeleton height={52} radius="var(--radius-input)" />
          <Skeleton height={52} radius="var(--radius-input)" />
          <Skeleton height={90} radius="var(--radius-card)" />
        </div>
      </div>
    );
  }

  if (view === "load-error") {
    return (
      <div className="flex flex-col min-h-[100vh] max-w-[var(--mobile-column)] m-0">
        <FlowHeader title="Verify your identity" />
        <ErrorState title="Could not load your verification status" onRetry={loadStatus} />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[100vh] max-w-[var(--mobile-column)] m-0">
      <FlowHeader
        title={headerTitle}
        right={
          view === "form" && step !== "review" ? (
            <span className="text-[12.5px] font-semibold text-[var(--text-muted)] [font-feature-settings:var(--font-feature-tabular)]">{stepCount}</span>
          ) : (
            undefined
          )
        }
        onBack={view === "form" && step === 1 ? undefined : view === "form" ? () => backStep(step, docUploaded, setStep, setDocUploaded) : undefined}
      />

      <div className="flex-1 pt-[20px] px-[20px] pb-[32px] flex flex-col gap-[18px]">
        {submitError ? <ErrorState title="Could not submit" description={submitError} onRetry={submit} /> : null}
        {!submitError && view === "form" && step === 1 ? (
          <NationalIdStep bvn={bvn} nin={nin} onBvnChange={setBvn} onNinChange={setNin} />
        ) : null}
        {!submitError && view === "form" && step === 2 && !docUploaded ? <DocumentStep onCaptured={() => setDocUploaded(true)} /> : null}
        {!submitError && view === "form" && step === 2 && docUploaded ? <CheckPhotoStep onRetake={() => setDocUploaded(false)} /> : null}
        {!submitError && view === "form" && step === 3 ? (
          <PayoutStep accountNumber={payoutAccountNumber} onAccountNumberChange={setPayoutAccountNumber} />
        ) : null}
        {!submitError && view === "form" && step === "review" ? (
          <ReviewStep
            bvn={bvn}
            nin={nin}
            payoutAccountNumber={payoutAccountNumber}
            consented={consented}
            onConsent={() => setConsented((c) => !c)}
          />
        ) : null}
        {view === "pending" ? <PendingState /> : null}
        {view === "approved" ? <ApprovedState /> : null}
        {view === "rejected" ? <RejectedState onResubmit={() => setView("form")} /> : null}
      </div>

      <div className="pt-[14px] px-[16px] pb-[24px] border-t border-t-[var(--border-hairline)] flex flex-col gap-[10px]">
        {submitError ? null : view === "form" && step === 1 ? (
          <Button full size="lg" iconRight="ArrowRight" disabled={bvn.length !== 11 || nin.length !== 11} onClick={() => setStep(2)}>
            Continue
          </Button>
        ) : null}
        {view === "form" && step === 2 && docUploaded ? (
          <div className="flex gap-[10px]">
            <Button variant="secondary" size="lg" icon="RotateCw" className="flex-1" onClick={() => setDocUploaded(false)}>
              Retake
            </Button>
            <Button size="lg" className="flex-1" onClick={() => setStep(3)}>
              Looks good
            </Button>
          </div>
        ) : null}
        {view === "form" && step === 3 ? (
          <Button
            full
            size="lg"
            iconRight="ArrowRight"
            disabled={payoutAccountNumber.length !== 10}
            onClick={() => setStep("review")}
          >
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
            <Button full variant="ghost" href="mailto:hello@wawuafrica.com">
              Contact support
            </Button>
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

function NationalIdStep({
  bvn,
  nin,
  onBvnChange,
  onNinChange,
}: {
  bvn: string;
  nin: string;
  onBvnChange: (v: string) => void;
  onNinChange: (v: string) => void;
}) {
  return (
    <>
      <div className="flex flex-col gap-[8px]">
        <h2 className="m-0 text-[24px] font-bold tracking-[-0.025em]">Your national ID</h2>
        <p className="m-0 text-[14px] leading-[1.5] text-[var(--text-secondary)]">Both are required in Nigeria.</p>
      </div>

      <div className="flex items-center gap-[10px] py-[12px] px-[14px] rounded-[var(--radius-input)] bg-[var(--surface-card)] border border-[var(--border-hairline)]">
        <Icon name="MapPin" size={16} color="var(--text-muted)" />
        <span className="flex-1 text-[13.5px] text-[var(--text-secondary)]">Country on your account</span>
        <span className="text-[13.5px] font-semibold">Nigeria</span>
      </div>

      <Input
        label="BVN"
        value={bvn}
        onChange={(e) => onBvnChange(e.target.value.replace(/\D/g, "").slice(0, 11))}
        inputMode="numeric"
        hint="11 digits."
      />
      <Input
        label="NIN"
        value={nin}
        onChange={(e) => onNinChange(e.target.value.replace(/\D/g, "").slice(0, 11))}
        inputMode="numeric"
        hint="11 digits."
      />

      <div className="flex items-start gap-[10px] p-[14px] rounded-[var(--radius-input)] bg-[var(--surface-card)] border border-[var(--border-hairline)]">
        <Icon name="ShieldCheck" size={16} color="var(--text-muted)" className="mt-[1px]" />
        <span className="flex-1 text-[13px] leading-[1.5] text-[var(--text-secondary)]">Used for verification only. Never shown on your profile.</span>
      </div>
    </>
  );
}

function DocumentStep({ onCaptured }: { onCaptured: () => void }) {
  return (
    <>
      <div className="flex flex-col gap-[8px]">
        <h2 className="m-0 text-[24px] font-bold tracking-[-0.025em]">Add an ID document</h2>
        <p className="m-0 text-[14px] leading-[1.5] text-[var(--text-secondary)]">Pick what you have to hand.</p>
      </div>

      <div className="flex flex-wrap gap-[8px]">
        {docTypes.map((d, i) => (
          <span
            key={d}
            className={`inline-flex items-center h-[38px] py-0 px-[15px] rounded-[999] text-[13.5px] ${
              i === 0
                ? "bg-[var(--accent)] border-none text-[var(--text-on-accent)] font-semibold"
                : "bg-[var(--surface-tag)] border border-[var(--border-hairline)] text-[var(--text-secondary)] font-medium"
            }`}
          >
            {d}
          </span>
        ))}
      </div>

      <div className="flex flex-col items-center justify-center gap-[12px] py-[34px] px-[20px] rounded-[var(--radius-media)] bg-[repeating-linear-gradient(135deg,_var(--surface-tag)_0_12px,_var(--surface-card)_12px_24px)] border-[1px_dashed_var(--border-strong)]">
        <span className="grid place-items-center w-[52px] h-[52px] rounded-[16] bg-[var(--accent-tint)] border border-[var(--border-accent)]">
          <Icon name="IdCard" size={22} strokeWidth={2} color="var(--accent)" />
        </span>
        <span className="text-[14.5px] font-semibold">Photo of your passport</span>
        <span className="text-[12.5px] text-[var(--text-muted)] text-center">All four corners in frame, no glare.</span>
      </div>

      <div className="flex gap-[10px]">
        <Button icon="Camera" className="flex-1" onClick={onCaptured}>
          Take a photo
        </Button>
        <Button variant="secondary" icon="Paperclip" className="flex-1" onClick={onCaptured}>
          Choose file
        </Button>
      </div>

      <span className="text-[12.5px] leading-[1.5] text-[var(--text-muted)]">JPG or PNG, up to 10MB.</span>
    </>
  );
}

function CheckPhotoStep({ onRetake }: { onRetake: () => void }) {
  return (
    <>
      <div className="w-full aspect-[3_/_2] rounded-[var(--radius-media)] bg-[repeating-linear-gradient(135deg,_var(--surface-tag)_0_12px,_var(--surface-card)_12px_24px)] border border-[var(--border-strong)]" />

      <div className="flex flex-col gap-[8px]">
        <h2 className="m-0 text-[22px] font-bold tracking-[-0.025em]">Can you read every line?</h2>
        <p className="m-0 text-[14px] leading-[1.5] text-[var(--text-secondary)]">If the name, number or expiry date is blurred, take it again — a blurred photo comes back rejected.</p>
      </div>

      <div className="flex flex-col gap-[9px]">
        <span className="flex items-center gap-[9px] text-[13.5px] text-[var(--text-secondary)]">
          <Icon name="Check" size={15} color="var(--success)" strokeWidth={2.4} />
          All four corners visible
        </span>
        <span className="flex items-center gap-[9px] text-[13.5px] text-[var(--text-secondary)]">
          <Icon name="Check" size={15} color="var(--success)" strokeWidth={2.4} />
          No glare across the text
        </span>
      </div>
      <span className="text-[12.5px] text-[var(--text-muted)] cursor-pointer" onClick={onRetake}>
        Not readable — retake the photo
      </span>
    </>
  );
}

function PayoutStep({
  accountNumber,
  onAccountNumberChange,
}: {
  accountNumber: string;
  onAccountNumberChange: (v: string) => void;
}) {
  return (
    <>
      <p className="m-0 text-[14px] leading-[1.5] text-[var(--text-secondary)]">The account must be in your own name.</p>

      <div className="flex flex-col gap-[8px]">
        <span className="text-[13px] font-semibold text-[var(--text-secondary)]">Bank</span>
        <button type="button" className="flex items-center gap-[10px] h-[52px] py-0 px-[16px] rounded-[var(--radius-input)] bg-[var(--surface-input)] border border-[var(--border-hairline)] text-[var(--text-primary)] text-[15px] cursor-pointer text-left font-[family-name:var(--font-sans)]">
          <span className="flex-1">Guaranty Trust Bank</span>
          <Icon name="ChevronDown" size={16} strokeWidth={2.2} color="var(--text-muted)" />
        </button>
      </div>

      <Input
        label="Account number"
        value={accountNumber}
        onChange={(e) => onAccountNumberChange(e.target.value.replace(/\D/g, "").slice(0, 10))}
        inputMode="numeric"
      />

      <div className="flex flex-col gap-[8px]">
        <span className="text-[13px] font-semibold text-[var(--text-secondary)]">Account name</span>
        <div className="flex items-center gap-[10px] h-[52px] py-0 px-[16px] rounded-[var(--radius-input)] bg-[var(--surface-tag)] border border-[var(--border-hairline)]">
          <span className="flex-1 text-[15px] font-semibold">ADA OKEKE</span>
          <Icon name="Check" size={16} color="var(--success)" strokeWidth={2.4} />
        </div>
        <span className="text-[12px] text-[var(--text-muted)]">Pulled from your bank. It must match your ID.</span>
      </div>
    </>
  );
}

/** Masks a digit string as the first four digits, a bullet run, then the last four — e.g. "22123456789" -> "2212•••6789". */
function maskMiddle(value: string): string {
  if (value.length <= 8) return value;
  return `${value.slice(0, 4)}•••${value.slice(-4)}`;
}

function ReviewStep({
  bvn,
  nin,
  payoutAccountNumber,
  consented,
  onConsent,
}: {
  bvn: string;
  nin: string;
  payoutAccountNumber: string;
  consented: boolean;
  onConsent: () => void;
}) {
  return (
    <>
      <div className="flex flex-col rounded-[var(--radius-card)] bg-[var(--surface-card)] border border-[var(--border-hairline)] overflow-hidden">
        {[
          ["BVN", maskMiddle(bvn)],
          ["NIN", maskMiddle(nin)],
          ["Document", "Passport"],
          ["Payout", `GTB ••••${payoutAccountNumber.slice(-4)}`],
        ].map(([k, v]) => (
          <div key={k} className="flex items-center gap-[12px] py-[15px] px-[18px] border-b border-b-[var(--border-hairline)]">
            <span className="flex-1 text-[13.5px] text-[var(--text-secondary)]">{k}</span>
            <span className="text-[13.5px] font-semibold [font-feature-settings:var(--font-feature-tabular)]">{v}</span>
            <span className="text-[13px] font-semibold text-[var(--accent)] cursor-pointer">Edit</span>
          </div>
        ))}
      </div>

      <div className="w-full aspect-[3_/_2] rounded-[var(--radius-media)] bg-[repeating-linear-gradient(135deg,_var(--surface-tag)_0_12px,_var(--surface-card)_12px_24px)] border border-[var(--border-hairline)]" />

      <div className="flex items-start gap-[11px]" onClick={onConsent} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onConsent(); }}>
        <span
          className={`grid place-items-center w-[22px] h-[22px] rounded-[7] shrink-0 mt-[1px] cursor-pointer border ${
            consented ? "bg-[var(--accent)] border-none" : "bg-[var(--surface-tag)] border-[var(--border-hairline)]"
          }`}
        >
          {consented ? <Icon name="Check" size={14} strokeWidth={3} color="#fff" /> : null}
        </span>
        <span className="flex-1 text-[13.5px] leading-[1.45] text-[var(--text-secondary)]">These details are mine and are correct.</span>
      </div>
    </>
  );
}

function PendingState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-[18px] py-[30px] px-[12px] text-center">
      <span className="grid place-items-center w-[88px] h-[88px] rounded-[999] bg-[var(--warning-tint)] border border-[rgba(255,183,3,0.3)]">
        <Icon name="Clock" size={36} strokeWidth={2.2} color="var(--warning)" />
      </span>
      <h2 className="m-0 text-[26px] font-bold tracking-[-0.03em]">KYC submitted</h2>
      <p className="m-0 text-[15px] leading-[1.55] text-[var(--text-secondary)] max-w-[300px]">Verification takes 1–3 days. We will notify you.</p>
      <div className="flex flex-col gap-[14px] w-full p-[18px] rounded-[var(--radius-card)] bg-[var(--surface-card)] border border-[var(--border-hairline)] text-left mt-[6px]">
        <div className="flex items-center gap-[11px]">
          <Icon name="Check" size={17} strokeWidth={2.4} color="var(--success)" />
          <span className="flex-1 text-[14px] font-semibold">Uploading and selling</span>
          <StatusPill kind="success">On</StatusPill>
        </div>
        <div className="flex items-center gap-[11px]">
          <Icon name="Clock" size={17} strokeWidth={2.4} color="var(--warning)" />
          <span className="flex-1 text-[14px] font-semibold">Receiving earnings</span>
          <StatusPill kind="warning">In review</StatusPill>
        </div>
        <span className="text-[12.5px] leading-[1.5] text-[var(--text-muted)] pt-[12px] border-t border-t-[var(--border-hairline)]">
          Start uploading now. Earnings from anything you sell are held and released once you are verified.
        </span>
      </div>
    </div>
  );
}

function ApprovedState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-[18px] py-[30px] px-[12px] text-center">
      <span className="grid place-items-center w-[88px] h-[88px] rounded-[999] bg-[var(--success-tint)] border border-[rgba(184,232,62,0.3)]">
        <Icon name="ShieldCheck" size={36} strokeWidth={2.2} color="var(--success)" />
      </span>
      <h2 className="m-0 text-[26px] font-bold tracking-[-0.03em]">You are verified</h2>
      <p className="m-0 text-[15px] leading-[1.55] text-[var(--text-secondary)] max-w-[300px]">Earnings will land in your GTB account ending 6789.</p>
      <div className="flex flex-col gap-[14px] w-full p-[18px] rounded-[var(--radius-card)] bg-[var(--surface-card)] border border-[var(--border-hairline)] text-left mt-[6px]">
        <div className="flex items-center gap-[11px]">
          <span className="flex-1 text-[14px] font-semibold">Uploading and selling</span>
          <StatusPill kind="success">On</StatusPill>
        </div>
        <div className="flex items-center gap-[11px]">
          <span className="flex-1 text-[14px] font-semibold">Receiving earnings</span>
          <StatusPill kind="success">On</StatusPill>
        </div>
      </div>
    </div>
  );
}

function RejectedState({ onResubmit }: { onResubmit: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-[18px] py-[30px] px-[12px] text-center">
      <span className="grid place-items-center w-[88px] h-[88px] rounded-[999] bg-[var(--danger-tint)] border border-[rgba(255,92,92,0.3)]">
        <Icon name="CircleAlert" size={36} strokeWidth={2.2} color="var(--danger)" />
      </span>
      <h2 className="m-0 text-[26px] font-bold tracking-[-0.03em]">We could not verify you</h2>
      <div className="flex flex-col gap-[10px] w-full py-[16px] px-[18px] rounded-[var(--radius-card)] bg-[var(--danger-tint)] border border-[rgba(255,92,92,0.32)] text-left">
        <span className="text-[11px] font-bold tracking-[0.06em] uppercase text-[var(--danger)]">Reason</span>
        <span className="text-[14px] leading-[1.5] text-[var(--text-primary)]">The name on your passport does not match the name on your bank account.</span>
      </div>
      <div className="flex flex-col gap-[9px] w-full text-left">
        <span className="text-[13.5px] leading-[1.5] text-[var(--text-secondary)]">
          Fix one of the two and send it again — either a document in your bank&apos;s name, or a payout account in your ID&apos;s name.
        </span>
      </div>
      <div className="flex flex-col gap-[14px] w-full p-[18px] rounded-[var(--radius-card)] bg-[var(--surface-card)] border border-[var(--border-hairline)] text-left">
        <div className="flex items-center gap-[11px]">
          <span className="flex-1 text-[14px] font-semibold">Uploading and selling</span>
          <StatusPill kind="success">Still on</StatusPill>
        </div>
        <div className="flex items-center gap-[11px]">
          <span className="flex-1 text-[14px] font-semibold">Receiving earnings</span>
          <StatusPill kind="error">Blocked</StatusPill>
        </div>
      </div>
    </div>
  );
}
