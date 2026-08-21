"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { kycApi } from "@/lib/api/kyc";
import type { KycSubmission } from "@/types/kyc";
import { FlowHeader } from "@/components/layout/FlowHeader";
import { Button } from "@/components/ui/Button";
import { ErrorState, Skeleton } from "@/components/ui/Feedback";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { FilePicker } from "@/components/ui/FilePicker";
import { StatusPill } from "@/components/ui/StatusPill";

type View = "loading" | "load-error" | "form" | "pending" | "approved" | "rejected";
type Step = 1 | 2 | 3 | "review";

/** Values the backend accepts (CreateKycSubmissionDto ID_DOCUMENT_TYPE_VALUES). */
const docTypes = [
  { value: "passport", label: "Passport" },
  { value: "drivers_licence", label: "Driver's licence" },
  { value: "national_id_card", label: "National ID card" },
] as const;

type DocTypeValue = (typeof docTypes)[number]["value"];

/**
 * Countries verification is open to. Nigeria first because most creators are
 * there, then the rest alphabetically. "Other" keeps someone from being locked
 * out by a list that will always be incomplete.
 */
const KYC_COUNTRIES = [
  "Nigeria", "Benin", "Cameroon", "Côte d'Ivoire", "Egypt", "Ethiopia", "Ghana", "Kenya",
  "Liberia", "Morocco", "Rwanda", "Senegal", "Sierra Leone", "South Africa", "Tanzania",
  "Togo", "Uganda", "Zambia", "Zimbabwe", "United Kingdom", "United States", "Canada", "Other",
] as const;

/** Banks WAWU can pay out to. Chosen by the creator, never assumed. */
const payoutBanks = [
  "Access Bank", "Citibank Nigeria", "Ecobank Nigeria", "Fidelity Bank", "First Bank of Nigeria",
  "First City Monument Bank", "Globus Bank", "Guaranty Trust Bank", "Heritage Bank", "Keystone Bank",
  "Kuda Bank", "Moniepoint MFB", "Opay", "Optimus Bank", "Palmpay", "Parallex Bank", "Polaris Bank",
  "Providus Bank", "Stanbic IBTC Bank", "Standard Chartered", "Sterling Bank", "SunTrust Bank",
  "Titan Trust Bank", "Union Bank of Nigeria", "United Bank for Africa", "Unity Bank",
  "Wema Bank", "Zenith Bank",
];

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
  const [country, setCountry] = useState("Nigeria");
  const [nationalIdEquivalent, setNationalIdEquivalent] = useState("");
  const [bvn, setBvn] = useState("");
  const [nin, setNin] = useState("");
  const [payoutAccountNumber, setPayoutAccountNumber] = useState("");
  // Previously hardcoded in the submit payload: every creator was recorded as
  // holding a passport and banking with GTB regardless of what was true.
  const [docType, setDocType] = useState<DocTypeValue>("passport");
  const [payoutBankName, setPayoutBankName] = useState("");
  /** Short-lived URL, for showing the creator their own upload on this screen only. */
  const [idDocumentUrl, setIdDocumentUrl] = useState<string | null>(null);
  /** The stored object key — this is what gets persisted. */
  const [idDocumentKey, setIdDocumentKey] = useState<string | null>(null);
  /** The stored submission, so the approved screen can name the real payout account. */
  const [submitted, setSubmitted] = useState<KycSubmission | null>(null);

  const loadStatus = () => {
    setView("loading");
    kycApi
      .getStatus()
      .then((submission) => {
        setSubmitted(submission);
        setView(viewForStatus(submission.status));
      })
      .catch(() => setView("load-error"));
  };

  useEffect(loadStatus, []);

  const nigerianCountry = country.trim().toLowerCase() === "nigeria";

  const submit = () => {
    setSubmitting(true);
    setSubmitError(null);
    kycApi
      .submit({
        country,
        // Send only what the chosen country's rules require. The server
        // validates by country (bvn+nin for Nigeria, national ID elsewhere),
        // so sending empty strings for the other branch fails validation.
        ...(nigerianCountry
          ? { bvn, nin }
          : { nationalIdEquivalent }),
        idDocumentType: docType,
        idDocumentUrl: idDocumentKey ?? "",
        payoutBankName,
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
      <div className="flex flex-col min-h-[100vh] max-w-[var(--mobile-column)] xl:max-w-[760px] m-0">
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
      <div className="flex flex-col min-h-[100vh] max-w-[var(--mobile-column)] xl:max-w-[760px] m-0">
        <FlowHeader title="Verify your identity" />
        <ErrorState title="Could not load your verification status" onRetry={loadStatus} />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[100vh] max-w-[var(--mobile-column)] xl:max-w-[760px] m-0">
      <FlowHeader
        title={headerTitle}
        right={
          view === "form" && step !== "review" ? (
            <span className="text-[12.5px] font-semibold text-[var(--text-muted)] [font-feature-settings:var(--font-feature-tabular)]">{stepCount}</span>
          ) : (
            undefined
          )
        }
        onBack={view === "form" && step === 1 ? undefined : view === "form" ? () => backStep(step, docUploaded, setStep, setDocUploaded, () => { setIdDocumentUrl(null); setIdDocumentKey(null); }) : undefined}
      />

      <div className="flex-1 pt-[20px] px-[20px] pb-[32px] flex flex-col gap-[18px]">
        {submitError ? <ErrorState title="Could not submit" description={submitError} onRetry={submit} /> : null}
        {!submitError && view === "form" && step === 1 ? (
          <NationalIdStep
            bvn={bvn}
            nin={nin}
            country={country}
            nationalIdEquivalent={nationalIdEquivalent}
            onBvnChange={setBvn}
            onNinChange={setNin}
            onCountryChange={setCountry}
            onNationalIdChange={setNationalIdEquivalent}
          />
        ) : null}
        {!submitError && view === "form" && step === 2 && !docUploaded ? (
          <DocumentStep
            docType={docType}
            onDocType={setDocType}
            onUploaded={(key, previewUrl) => {
              setIdDocumentKey(key);
              setIdDocumentUrl(previewUrl);
              setDocUploaded(true);
            }}
          />
        ) : null}
        {!submitError && view === "form" && step === 2 && docUploaded ? (
          <CheckPhotoStep
            url={idDocumentUrl}
            onRetake={() => {
              setDocUploaded(false);
              setIdDocumentUrl(null);
              setIdDocumentKey(null);
            }}
          />
        ) : null}
        {!submitError && view === "form" && step === 3 ? (
          <PayoutStep
            bankName={payoutBankName}
            onBankNameChange={setPayoutBankName}
            accountNumber={payoutAccountNumber}
            onAccountNumberChange={setPayoutAccountNumber}
          />
        ) : null}
        {!submitError && view === "form" && step === "review" ? (
          <ReviewStep
            bvn={bvn}
            nin={nin}
            country={country}
            nationalIdEquivalent={nationalIdEquivalent}
            payoutAccountNumber={payoutAccountNumber}
            docType={docType}
            payoutBankName={payoutBankName}
            idDocumentUrl={idDocumentUrl}
            consented={consented}
            onConsent={() => setConsented((c) => !c)}
          />
        ) : null}
        {view === "pending" ? <PendingState /> : null}
        {view === "approved" ? <ApprovedState submission={submitted} /> : null}
        {view === "rejected" ? <RejectedState submission={submitted} onResubmit={() => setView("form")} /> : null}
      </div>

      <div className="pt-[14px] px-[16px] pb-[24px] border-t border-t-[var(--border-hairline)] flex flex-col gap-[10px]">
        {submitError ? null : view === "form" && step === 1 ? (
          <Button
            full
            size="lg"
            iconRight="ArrowRight"
            // Nigeria needs both 11-digit numbers; elsewhere one national ID
            // number is the requirement, so the old check locked non-Nigerians
            // on this step forever.
            disabled={
              nigerianCountry
                ? bvn.length !== 11 || nin.length !== 11
                : nationalIdEquivalent.trim().length < 4
            }
            onClick={() => setStep(2)}
          >
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
            disabled={payoutAccountNumber.length !== 10 || payoutBankName === ""}
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

function backStep(
  step: Step,
  docUploaded: boolean,
  setStep: (s: Step) => void,
  setDocUploaded: (v: boolean) => void,
  clearDocument: () => void,
) {
  if (step === 2 && docUploaded) {
    setDocUploaded(false);
    clearDocument();
  }
  else if (step === "review") setStep(3);
  else if (step === 3) setStep(2);
  else if (step === 2) setStep(1);
}

function NationalIdStep({
  bvn,
  nin,
  country,
  nationalIdEquivalent,
  onBvnChange,
  onNinChange,
  onCountryChange,
  onNationalIdChange,
}: {
  bvn: string;
  nin: string;
  country: string;
  nationalIdEquivalent: string;
  onBvnChange: (v: string) => void;
  onNinChange: (v: string) => void;
  onCountryChange: (v: string) => void;
  onNationalIdChange: (v: string) => void;
}) {
  const nigerian = country.trim().toLowerCase() === "nigeria";
  return (
    <>
      <div className="flex flex-col gap-[8px]">
        <h2 className="m-0 text-[24px] font-bold tracking-[-0.025em]">Your identity</h2>
        <p className="m-0 text-[14px] leading-[1.5] text-[var(--text-secondary)]">
          {nigerian
            ? "BVN and NIN are both required in Nigeria."
            : "Give the national ID number your country issues. Your passport or driver's licence works as the document."}
        </p>
      </div>

      {/*
        This used to be a fixed "Nigeria" row, and BVN/NIN were the only fields,
        so anyone outside Nigeria could not finish verification at all. The API
        has always accepted a national-ID equivalent for other countries; the
        form simply never offered it.
      */}
      <div className="flex flex-col gap-[8px]">
        <span className="text-[13px] font-semibold text-[var(--text-secondary)]">Country</span>
        <div className="relative">
          <select
            value={country}
            onChange={(e) => onCountryChange(e.target.value)}
            className="flex h-[52px] w-full appearance-none items-center rounded-[var(--radius-input)] border border-[var(--border-hairline)] bg-[var(--surface-input)] px-[16px] font-[var(--font-sans)] text-[15px] text-[var(--text-primary)]"
          >
            {KYC_COUNTRIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <Icon
            name="ChevronDown"
            size={16}
            strokeWidth={2.2}
            color="var(--text-muted)"
            className="pointer-events-none absolute right-[16px] top-1/2 -translate-y-1/2"
          />
        </div>
      </div>

      {nigerian ? (
        <>
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
        </>
      ) : (
        <Input
          label="National ID number"
          value={nationalIdEquivalent}
          onChange={(e) => onNationalIdChange(e.target.value)}
          hint="Whatever your country issues: national ID, passport number, or equivalent."
        />
      )}

      <div className="flex items-start gap-[10px] p-[14px] rounded-[var(--radius-input)] bg-[var(--surface-card)] border border-[var(--border-hairline)]">
        <Icon name="ShieldCheck" size={16} color="var(--text-muted)" className="mt-[1px]" />
        <span className="flex-1 text-[13px] leading-[1.5] text-[var(--text-secondary)]">Used for verification only. Never shown on your profile.</span>
      </div>
    </>
  );
}

function DocumentStep({
  docType,
  onDocType,
  onUploaded,
}: {
  docType: DocTypeValue;
  onDocType: (v: DocTypeValue) => void;
  onUploaded: (key: string, previewUrl: string) => void;
}) {
  const chosen = docTypes.find((d) => d.value === docType);
  return (
    <>
      <div className="flex flex-col gap-[8px]">
        <h2 className="m-0 text-[24px] font-bold tracking-[-0.025em]">Add an ID document</h2>
        <p className="m-0 text-[14px] leading-[1.5] text-[var(--text-secondary)]">Pick what you have to hand.</p>
      </div>

      <div className="flex flex-wrap gap-[8px]">
        {docTypes.map((d) => {
          const active = d.value === docType;
          return (
            <button
              key={d.value}
              type="button"
              onClick={() => onDocType(d.value)}
              aria-pressed={active}
              className={`inline-flex h-[38px] cursor-pointer items-center rounded-[999px] px-[15px] text-[13.5px] ${
                active
                  ? "border-none bg-[var(--accent)] font-semibold text-[var(--text-on-accent)]"
                  : "border border-[var(--border-hairline)] bg-[var(--surface-tag)] font-medium text-[var(--text-secondary)]"
              }`}
            >
              {d.label}
            </button>
          );
        })}
      </div>

      <FilePicker
        folder="kyc/id-document"
        accept="image/png,image/jpeg,application/pdf"
        capture
        label={`Photo of your ${chosen?.label.toLowerCase() ?? "ID"}`}
        hint="All four corners in frame, no glare. JPG, PNG or PDF, up to 10MB."
        onUploaded={(f) => onUploaded(f.key, f.fileUrl)}
      />
    </>
  );
}

function CheckPhotoStep({ url, onRetake }: { url: string | null; onRetake: () => void }) {
  const isPdf = !!url && url.split("?")[0].toLowerCase().endsWith(".pdf");
  return (
    <>
      {url && !isPdf ? (
        // The document the reviewer will actually see, so a blurred or
        // cropped shot is caught here rather than coming back rejected.
        <img
          src={url}
          alt="The ID document you uploaded"
          className="w-full aspect-[3_/_2] rounded-[var(--radius-media)] border border-[var(--border-strong)] object-cover"
        />
      ) : (
        <div className="flex w-full aspect-[3_/_2] flex-col items-center justify-center gap-[10px] rounded-[var(--radius-media)] border border-[var(--border-strong)] bg-[var(--surface-card)]">
          <Icon name="FileText" size={30} color="var(--text-secondary)" />
          <span className="text-[13px] text-[var(--text-muted)]">{isPdf ? "PDF uploaded" : "Document uploaded"}</span>
        </div>
      )}

      <div className="flex flex-col gap-[8px]">
        <h2 className="m-0 text-[22px] font-bold tracking-[-0.025em]">Can you read every line?</h2>
        <p className="m-0 text-[14px] leading-[1.5] text-[var(--text-secondary)]">If the name, number or expiry date is blurred, take it again, a blurred photo comes back rejected.</p>
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
        Not readable, retake the photo
      </span>
    </>
  );
}

function PayoutStep({
  bankName,
  onBankNameChange,
  accountNumber,
  onAccountNumberChange,
}: {
  bankName: string;
  onBankNameChange: (v: string) => void;
  accountNumber: string;
  onAccountNumberChange: (v: string) => void;
}) {
  return (
    <>
      <p className="m-0 text-[14px] leading-[1.5] text-[var(--text-secondary)]">The account must be in your own name.</p>

      <div className="flex flex-col gap-[8px]">
        <span className="text-[13px] font-semibold text-[var(--text-secondary)]">Bank</span>
        <div className="relative">
          <select
            value={bankName}
            onChange={(e) => onBankNameChange(e.target.value)}
            aria-label="Bank"
            className="h-[52px] w-full cursor-pointer appearance-none rounded-[var(--radius-input)] border border-[var(--border-hairline)] bg-[var(--surface-input)] px-[16px] pr-[42px] font-[family-name:var(--font-sans)] text-[15px] text-[var(--text-primary)]"
          >
            <option value="">Choose your bank</option>
            {payoutBanks.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-[16px] top-1/2 -translate-y-1/2">
            <Icon name="ChevronDown" size={16} strokeWidth={2.2} color="var(--text-muted)" />
          </span>
        </div>
      </div>

      <Input
        label="Account number"
        value={accountNumber}
        onChange={(e) => onAccountNumberChange(e.target.value.replace(/\D/g, "").slice(0, 10))}
        inputMode="numeric"
      />

      {/* The design showed a resolved account name with a verified tick. There
          is no bank-name-resolution endpoint on this backend, so showing one
          would be inventing a verification that never happened. The reviewer
          checks the name against the ID during manual review instead. */}
      <span className="text-[12.5px] leading-[1.5] text-[var(--text-muted)]">
        We check this account against your ID during review. If the names do not match, your payout details come back rejected.
      </span>
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
  country,
  nationalIdEquivalent,
  payoutAccountNumber,
  docType,
  payoutBankName,
  idDocumentUrl,
  consented,
  onConsent,
}: {
  bvn: string;
  nin: string;
  country: string;
  nationalIdEquivalent: string;
  payoutAccountNumber: string;
  docType: DocTypeValue;
  payoutBankName: string;
  idDocumentUrl: string | null;
  consented: boolean;
  onConsent: () => void;
}) {
  return (
    <>
      <div className="flex flex-col rounded-[var(--radius-card)] bg-[var(--surface-card)] border border-[var(--border-hairline)] overflow-hidden">
        {[
          // Show what was actually collected for this country.
          ...(country.trim().toLowerCase() === "nigeria"
            ? [["BVN", maskMiddle(bvn)], ["NIN", maskMiddle(nin)]]
            : [["Country", country], ["National ID", maskMiddle(nationalIdEquivalent)]]),
          ["Document", docTypes.find((d) => d.value === docType)?.label ?? "ID document"],
          ["Payout", `${payoutBankName || "Bank not set"} ••••${payoutAccountNumber.slice(-4)}`],
        ].map(([k, v]) => (
          <div key={k} className="flex items-center gap-[12px] py-[15px] px-[18px] border-b border-b-[var(--border-hairline)]">
            <span className="flex-1 text-[13.5px] text-[var(--text-secondary)]">{k}</span>
            <span className="text-[13.5px] font-semibold [font-feature-settings:var(--font-feature-tabular)]">{v}</span>
            <span className="text-[13px] font-semibold text-[var(--accent)] cursor-pointer">Edit</span>
          </div>
        ))}
      </div>

      {idDocumentUrl && !idDocumentUrl.split("?")[0].toLowerCase().endsWith(".pdf") ? (
        <img
          src={idDocumentUrl}
          alt="The ID document you uploaded"
          className="w-full aspect-[3_/_2] rounded-[var(--radius-media)] border border-[var(--border-hairline)] object-cover"
        />
      ) : (
        <div className="grid w-full aspect-[3_/_2] place-items-center rounded-[var(--radius-media)] border border-[var(--border-hairline)] bg-[var(--surface-card)]">
          <Icon name="FileText" size={28} color="var(--text-secondary)" />
        </div>
      )}

      <div className="flex items-start gap-[11px]" onClick={onConsent} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onConsent(); }}>
        <span
          className={`grid place-items-center w-[22px] h-[22px] rounded-[7px] shrink-0 mt-[1px] cursor-pointer border ${
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
      <span className="grid place-items-center w-[88px] h-[88px] rounded-[999px] bg-[var(--warning-tint)] border border-[rgba(255,183,3,0.3)]">
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

function ApprovedState({ submission }: { submission: KycSubmission | null }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-[18px] py-[30px] px-[12px] text-center">
      <span className="grid place-items-center w-[88px] h-[88px] rounded-[999px] bg-[var(--success-tint)] border border-[rgba(184,232,62,0.3)]">
        <Icon name="ShieldCheck" size={36} strokeWidth={2.2} color="var(--success)" />
      </span>
      <h2 className="m-0 text-[26px] font-bold tracking-[-0.03em]">You are verified</h2>
      <p className="m-0 text-[15px] leading-[1.55] text-[var(--text-secondary)] max-w-[300px]">
        {submission?.payoutBankName && submission?.payoutAccountNumber
          ? `Earnings will land in your ${submission.payoutBankName} account ending ${submission.payoutAccountNumber.slice(-4)}.`
          : "Earnings will land in the bank account on your verified profile."}
      </p>
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

function RejectedState({ submission, onResubmit }: { submission: KycSubmission | null; onResubmit: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-[18px] py-[30px] px-[12px] text-center">
      <span className="grid place-items-center w-[88px] h-[88px] rounded-[999px] bg-[var(--danger-tint)] border border-[rgba(255,92,92,0.3)]">
        <Icon name="CircleAlert" size={36} strokeWidth={2.2} color="var(--danger)" />
      </span>
      <h2 className="m-0 text-[26px] font-bold tracking-[-0.03em]">We could not verify you</h2>
      <div className="flex flex-col gap-[10px] w-full py-[16px] px-[18px] rounded-[var(--radius-card)] bg-[var(--danger-tint)] border border-[rgba(255,92,92,0.32)] text-left">
        <span className="text-[11px] font-bold tracking-[0.06em] uppercase text-[var(--danger)]">Reason</span>
        {/* The real reviewer's reason. This was a hardcoded sentence, so
            every rejected creator was told the same false thing and could
            never fix the actual problem blocking their payouts. */}
        <span className="text-[14px] leading-[1.5] text-[var(--text-primary)]">
          {submission?.rejectionReason?.trim()
            ? submission.rejectionReason
            : "Our reviewer did not record a reason. Please resubmit with a clear photo of your ID and matching bank details, or contact support."}
        </span>
      </div>
      <div className="flex flex-col gap-[9px] w-full text-left">
        <span className="text-[13.5px] leading-[1.5] text-[var(--text-secondary)]">
          Fix one of the two and send it again, either a document in your bank&apos;s name, or a payout account in your ID&apos;s name.
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
