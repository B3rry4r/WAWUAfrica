"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ProfileBackButton } from "@/components/profile/ProfileBackButton";
import { Button, Icon, Input } from "@/components/ui";
import type { IconName } from "@/components/ui/Icon";
import { formatNaira } from "@/lib/format";
import { payCacApplication } from "@/lib/api/services";
import { FilePicker } from "@/components/ui/FilePicker";

type Step = 1 | 2 | 3;
const STEP_LABELS = ["Details", "Documents", "Review"];
const RAIL_STEPS: { n: Step; label: string }[] = [
  { n: 1, label: "Business details" },
  { n: 2, label: "Documents" },
  { n: 3, label: "Review and pay" },
];
const REGISTRATION_FEE = 25000;

type RegistrationType = "business_name" | "limited_company";

const NATURE_OPTIONS = [
  "Agriculture and produce",
  "Retail and trade",
  "Fashion and textiles",
  "Food and beverage",
  "Technology and services",
  "Manufacturing",
  "Education and training",
  "Other",
];

type DocKey = "id" | "signature" | "passport";
type DocState = "uploaded" | "uploading" | "empty";

interface DocSlot {
  key: DocKey;
  label: string;
  icon: IconName;
  filename?: string;
  sizeLabel?: string;
  state: DocState;
  progress?: number;
  /** What to photograph/attach for this slot. */
  hint?: string;
  /** Object-storage URL once the file genuinely finished uploading. */
  url?: string;
}

const INITIAL_DOCS: DocSlot[] = [
  { key: "id", label: "Valid ID", icon: "IdCard", hint: "NIN slip, passport or driver's licence.", state: "empty" },
  { key: "signature", label: "Signature", icon: "Signature", hint: "Sign on white paper and photograph it.", state: "empty" },
  { key: "passport", label: "Passport photograph", icon: "Image", hint: "Plain background, face clear.", state: "empty" },
];

interface NameFieldErrors {
  first?: string;
  second?: string;
  third?: string;
}

function validateNames(regType: RegistrationType, first: string, second: string, third: string): NameFieldErrors {
  const errors: NameFieldErrors = {};
  const values = { first, second, third } as const;

  (Object.keys(values) as (keyof typeof values)[]).forEach((key) => {
    const raw = values[key].trim();
    if (!raw) {
      errors[key] = "CAC needs all three.";
      return;
    }
    if (regType === "business_name" && /\b(ltd|limited)\b/i.test(raw)) {
      errors[key] = "Drop “Ltd”, that is only for a limited company.";
      return;
    }
    if (/\b(federal|national|nigeria)\b/i.test(raw)) {
      errors[key] = "Names cannot contain “Federal”, “National” or “Nigeria” without special approval.";
    }
  });

  const norm = (s: string) => s.trim().toLowerCase();
  if (!errors.second && second.trim() && norm(second) === norm(first)) {
    errors.second = "Same as your first choice. Give a different name.";
  }
  if (!errors.third && third.trim()) {
    if (norm(third) === norm(first)) errors.third = "Same as your first choice. Give a different name.";
    else if (norm(third) === norm(second)) errors.third = "Same as your second choice. Give a different name.";
  }
  return errors;
}

export default function CacApplyPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);

  const [regType, setRegType] = useState<RegistrationType>("business_name");
  const [first, setFirst] = useState("");
  const [second, setSecond] = useState("");
  const [third, setThird] = useState("");
  const [nature, setNature] = useState(NATURE_OPTIONS[0]);
  const [showNameErrors, setShowNameErrors] = useState(false);

  const [docs, setDocs] = useState<DocSlot[]>(INITIAL_DOCS);
  const [confirmed, setConfirmed] = useState(false);

  const [payPhase, setPayPhase] = useState<"idle" | "processing" | "failed">("idle");
  const [result, setResult] = useState<{ reference: string; applicationId: string; amountPaid: number; certificateExpectedBy: string } | null>(null);

  const nameErrors = validateNames(regType, first, second, third);
  const nameErrorCount = Object.keys(nameErrors).length;

  // Documents upload for real (POST /uploads/presign + direct PUT). This
  // screen previously ran setInterval/setTimeout progress bars with no file
  // behind them, so applicants paid the CAC fee having attached nothing.
  const markUploaded = (key: DocKey, file: { fileUrl: string; name: string; size: number }) => {
    setDocs((prev) =>
      prev.map((d) =>
        d.key === key
          ? {
              ...d,
              state: "uploaded",
              filename: file.name,
              sizeLabel: file.size >= 1024 * 1024 ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : `${Math.round(file.size / 1024)} KB`,
              url: file.fileUrl,
            }
          : d,
      ),
    );
  };

  const clearDoc = (key: DocKey) => {
    setDocs((prev) => prev.map((d) => (d.key === key ? { ...d, state: "empty", filename: undefined, sizeLabel: undefined, url: undefined } : d)));
  };

  const allDocsUploaded = docs.every((d) => d.state === "uploaded");
  const docsReadyCount = docs.filter((d) => d.state === "uploaded").length;

  const next = () => {
    if (step === 1) {
      if (nameErrorCount > 0) {
        setShowNameErrors(true);
        return;
      }
      setShowNameErrors(false);
      setStep(2);
      return;
    }
    if (step === 2) {
      if (!allDocsUploaded) return;
      setStep(3);
    }
  };

  const payAndSubmit = async () => {
    if (!confirmed || payPhase === "processing") return;
    setPayPhase("processing");
    try {
      const res = await payCacApplication({
        registrationType: regType,
        names: [first.trim(), second.trim(), third.trim()],
        nature,
        documents: docs.map((d) => d.url).filter((u): u is string => !!u),
      });
      if (res.result === "success") {
        setResult({
          reference: res.reference,
          applicationId: res.applicationId,
          amountPaid: res.amountPaid,
          certificateExpectedBy: res.certificateExpectedBy,
        });
        setPayPhase("idle");
      } else {
        setPayPhase("failed");
      }
    } catch {
      setPayPhase("failed");
    }
  };

  if (result) {
    return (
      <div className="flex flex-col items-center gap-[18px] p-[40px_28px_96px] text-center xl:mx-auto xl:mt-[8vh] xl:max-w-[440px] xl:p-0">
        <span className="grid h-[88px] w-[88px] place-items-center rounded-full border border-[var(--border-decor)] bg-[var(--decor-tint)]">
          <Icon name="Check" size={40} color="var(--accent)" strokeWidth={2.6} />
        </span>
        <h2 className="m-0 text-[26px] font-bold tracking-[-0.03em] text-[var(--text-primary)]">Application in</h2>
        <p className="m-0 max-w-[290px] text-[15px] leading-[1.55] text-[var(--text-secondary)]">
          We will check your names against the CAC register and file the first one that is available.
        </p>

        <div className="flex w-full flex-col gap-[10px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[16px] text-left">
          <div className="flex items-center gap-[10px]">
            <span className="flex-1 text-[13px] text-[var(--text-secondary)]">Reference</span>
            <span className="text-[13.5px] font-bold [font-feature-settings:var(--font-feature-tabular)]">{result.reference}</span>
          </div>
          <div className="flex items-center gap-[10px]">
            <span className="flex-1 text-[13px] text-[var(--text-secondary)]">Paid</span>
            <span className="text-[13.5px] font-semibold [font-feature-settings:var(--font-feature-tabular)]">{formatNaira(result.amountPaid)}</span>
          </div>
          <div className="flex items-center gap-[10px]">
            <span className="flex-1 text-[13px] text-[var(--text-secondary)]">Certificate expected</span>
            <span className="text-[13.5px] font-semibold [font-feature-settings:var(--font-feature-tabular)]">By {result.certificateExpectedBy}</span>
          </div>
        </div>

        <span className="max-w-[290px] text-[12.5px] leading-[1.5] text-[var(--text-muted)]">
          If all three names are taken you get the {formatNaira(result.amountPaid)} back and a chance to try new ones.
        </span>

        <div className="mt-[6px] flex w-full flex-col gap-[10px]">
          <Button full size="lg" onClick={() => router.push(`/services/applications/${result.applicationId}`)}>
            Track it
          </Button>
          <Button full variant="ghost" onClick={() => router.push("/services")}>
            Back to services
          </Button>
        </div>
      </div>
    );
  }

  // Shared step content — built once and reused by both the mobile stacked flow
  // and the xl three-column layout, so the two never drift apart.
  const failedBanner = payPhase === "failed" && (
    <div className="flex items-start gap-[10px] rounded-[var(--radius-input)] border border-[rgba(255,92,92,0.32)] bg-[var(--danger-tint)] p-[13px_14px]">
      <Icon name="CircleAlert" size={16} color="var(--danger)" strokeWidth={2.2} className="mt-[1px]" />
      <span className="flex-1 text-[13.5px] leading-[1.45] text-[var(--danger)]">
        Your bank didn&apos;t confirm the payment. Nothing was charged, try again.
      </span>
    </div>
  );

  const step1Content = (
    <div className="flex flex-col gap-[16px]">
      <div className="flex flex-col gap-[6px]">
        <h2 className="m-0 text-[21px] font-bold tracking-[-0.02em] text-[var(--text-primary)]">Business details</h2>
        <p className="m-0 text-[13.5px] leading-[1.5] text-[var(--text-secondary)]">
          Give three name choices in order of preference. CAC takes the first one that is available.
        </p>
      </div>

      {showNameErrors && nameErrorCount > 0 && (
        <div className="flex items-start gap-[10px] rounded-[var(--radius-input)] border border-[rgba(255,92,92,0.32)] bg-[var(--danger-tint)] p-[13px_14px]">
          <Icon name="CircleAlert" size={16} color="var(--danger)" strokeWidth={2.2} className="mt-[1px]" />
          <span className="flex-1 text-[13.5px] leading-[1.45] text-[var(--danger)]">
            {nameErrorCount} {nameErrorCount === 1 ? "thing" : "things"} to fix before you can continue.
          </span>
        </div>
      )}

      <div className="flex flex-col gap-[8px]">
        <span className="text-[13px] font-semibold text-[var(--text-secondary)]">Registration type</span>
        <div className="flex gap-[8px]">
          {(
            [
              { value: "business_name", label: "Business name" },
              { value: "limited_company", label: "Limited company" },
            ] as const
          ).map((opt) => {
            const active = regType === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setRegType(opt.value)}
                className={[
                  "h-[44px] flex-1 cursor-pointer rounded-full border text-[13px] font-semibold",
                  active
                    ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--text-on-accent)] hover:bg-[var(--accent-hover)] active:bg-[var(--accent-press)]"
                    : "border-[var(--border-hairline)] bg-[var(--surface-tag)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] active:bg-[var(--surface-press)]",
                ].join(" ")}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      <Input
        label="First choice"
        value={first}
        onChange={(e) => setFirst(e.target.value)}
        placeholder="e.g. Okeke Farms Enugu"
        error={showNameErrors ? nameErrors.first : undefined}
      />
      <Input
        label="Second choice"
        value={second}
        onChange={(e) => setSecond(e.target.value)}
        placeholder="e.g. Ada Okeke Agro"
        error={showNameErrors ? nameErrors.second : undefined}
      />
      <Input
        label="Third choice"
        value={third}
        onChange={(e) => setThird(e.target.value)}
        placeholder="A third option"
        error={showNameErrors ? nameErrors.third : undefined}
      />

      <div className="flex flex-col gap-[8px]">
        <span className="text-[13px] font-semibold text-[var(--text-secondary)]">Nature of business</span>
        <div className="relative">
          <select
            value={nature}
            onChange={(e) => setNature(e.target.value)}
            aria-label="Nature of business"
            className="h-[52px] w-full cursor-pointer appearance-none rounded-[var(--radius-input)] border border-[var(--border-hairline)] bg-[var(--surface-input)] px-[16px] pr-[40px] text-[15px] text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--accent)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--accent)_20%,transparent)]"
          >
            {NATURE_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-[16px] top-1/2 -translate-y-1/2">
            <Icon name="ChevronDown" size={16} color="var(--text-muted)" strokeWidth={2.2} />
          </span>
        </div>
      </div>

      <div className="flex items-start gap-[10px] rounded-[var(--radius-input)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[13px_14px]">
        <Icon name="Info" size={15} color="var(--text-muted)" className="mt-[1px]" />
        <span className="flex-1 text-[12.5px] leading-[1.5] text-[var(--text-secondary)]">
          Names cannot contain “Federal”, “National” or “Nigeria” without special approval.
        </span>
      </div>
    </div>
  );

  const step2Content = (
    <div className="flex flex-col gap-[16px]">
      <div className="flex flex-col gap-[6px]">
        <h2 className="m-0 text-[21px] font-bold tracking-[-0.02em] text-[var(--text-primary)]">Documents</h2>
        <p className="m-0 text-[13.5px] leading-[1.5] text-[var(--text-secondary)]">Photos are fine as long as the text is readable.</p>
      </div>

      {docs.map((doc) => (
        <div key={doc.key} className="flex flex-col gap-[9px]">
          <div className="flex items-center gap-[9px]">
            <Icon name={doc.icon} size={16} color="var(--text-secondary)" strokeWidth={2} />
            <span className="text-[13.5px] font-semibold text-[var(--text-primary)]">{doc.label}</span>
          </div>
          <FilePicker
            folder="service-application/document"
            accept="image/png,image/jpeg,application/pdf"
            capture={doc.key === "passport"}
            label={doc.state === "uploaded" ? "Replace file" : `Add your ${doc.label.toLowerCase()}`}
            hint={doc.hint}
            onUploaded={(f) => markUploaded(doc.key, f)}
            onCleared={() => clearDoc(doc.key)}
          />
        </div>
      ))}
    </div>
  );

  const reviewRows = (
    <div className="flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)]">
      <ReviewRow label="Type" value={regType === "business_name" ? "Business name" : "Limited company"} onEdit={() => setStep(1)} />
      <div className="flex items-start gap-[12px] border-b border-[var(--border-hairline)] p-[14px_16px]">
        <span className="flex-1 text-[13px] text-[var(--text-secondary)]">Names</span>
        <div className="flex flex-col items-end gap-[3px]">
          <span className="text-[13.5px] font-semibold text-[var(--text-primary)]">{first || "-"}</span>
          <span className="text-[12.5px] text-[var(--text-muted)]">{second || "-"}</span>
          <span className="text-[12.5px] text-[var(--text-muted)]">{third || "-"}</span>
        </div>
        <button type="button" onClick={() => setStep(1)} className="cursor-pointer border-0 bg-transparent p-0 text-[12.5px] font-semibold text-[var(--accent)] hover:text-[var(--text-primary)]">
          Edit
        </button>
      </div>
      <ReviewRow label="Nature" value={nature} onEdit={() => setStep(1)} />
      <ReviewRow label="Documents" value={`${docsReadyCount} attached`} onEdit={() => setStep(2)} last />
    </div>
  );

  const confirmToggle = (
    <button type="button" onClick={() => setConfirmed((v) => !v)} className="flex cursor-pointer items-start gap-[11px] border-0 bg-transparent p-0 text-left hover:bg-[var(--state-hover)] active:bg-[var(--state-press)]">
      <span
        className={[
          "mt-[1px] grid h-[22px] w-[22px] shrink-0 place-items-center rounded-[7px] border",
          confirmed ? "border-[var(--accent)] bg-[var(--accent)]" : "border-[var(--border-hairline)] bg-transparent",
        ].join(" ")}
      >
        {confirmed && <Icon name="Check" size={14} color="var(--text-on-accent)" strokeWidth={3} />}
      </span>
      <span className="flex-1 text-[13.5px] leading-[1.45] text-[var(--text-secondary)]">The details above are correct and the documents are mine.</span>
    </button>
  );

  const priceCard = (
    <div className="flex flex-col gap-[10px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[16px]">
      <div className="flex items-center gap-[10px]">
        <span className="flex-1 text-[13.5px] text-[var(--text-secondary)]">Registration fee</span>
        <span className="text-[13.5px] font-semibold [font-feature-settings:var(--font-feature-tabular)]">{formatNaira(REGISTRATION_FEE)}</span>
      </div>
      <div className="flex items-baseline gap-[10px] border-t border-[var(--border-hairline)] pt-[11px]">
        <span className="flex-1 text-[15px] font-semibold text-[var(--text-primary)]">Due now</span>
        <span className="text-[24px] font-bold tracking-[-0.03em] [font-feature-settings:var(--font-feature-tabular)]">{formatNaira(REGISTRATION_FEE)}</span>
      </div>
      <span className="text-[12px] leading-[1.45] text-[var(--text-muted)]">Refunded in full if all three names are already taken.</span>
    </div>
  );

  // Mobile-only: step 3 carries its own price card. At xl the price lives
  // permanently in the right rail instead, so the review step there is just
  // the recap + confirmation.
  const step3Content = (
    <div className="flex flex-col gap-[16px]">
      {failedBanner}
      {reviewRows}
      {priceCard}
      {confirmToggle}
    </div>
  );
  const step3ContentDesktop = (
    <div className="flex flex-col gap-[16px]">
      {failedBanner}
      {reviewRows}
      {confirmToggle}
    </div>
  );

  const navButtons = (
    <div className="flex gap-[10px]">
      {step > 1 && step !== 3 && (
        <Button variant="secondary" onClick={() => setStep((s) => (s - 1) as Step)}>
          Back
        </Button>
      )}
      {step === 1 && (
        <Button full size="lg" iconRight="ArrowRight" onClick={next}>
          Continue
        </Button>
      )}
      {step === 2 && (
        <Button full size="lg" iconRight="ArrowRight" disabled={!allDocsUploaded} onClick={next}>
          Continue
        </Button>
      )}
      {step === 3 && (
        <div className="flex w-full flex-col gap-[10px]">
          <Button full size="lg" disabled={!confirmed} loading={payPhase === "processing"} onClick={payAndSubmit}>
            {payPhase === "failed" ? "Try again" : `Pay ${formatNaira(REGISTRATION_FEE)} and submit`}
          </Button>
          <Button variant="ghost" onClick={() => setStep(2)}>
            Back
          </Button>
        </div>
      )}
    </div>
  );

  // Live cost breakdown for the xl right rail — same registration fee the
  // mobile flow charges (never invents a differential rate), but it does
  // reflect real state as it's filled in: chosen structure and how many
  // documents are ready.
  const costCard = (
    <div className="flex flex-col gap-[12px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[20px]">
      <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--text-muted)]">What you pay</span>
      <div className="flex items-center justify-between text-[13.5px] text-[var(--text-secondary)]">
        <span>Structure</span>
        <span className="font-semibold text-[var(--text-primary)]">{regType === "business_name" ? "Business name" : "Limited company"}</span>
      </div>
      <div className="flex items-center justify-between text-[13.5px] text-[var(--text-secondary)]">
        <span>Documents ready</span>
        <span className="[font-feature-settings:var(--font-feature-tabular)]">
          {docsReadyCount} of {docs.length}
        </span>
      </div>
      <div className="flex items-center justify-between text-[13.5px] text-[var(--text-secondary)]">
        <span>Registration fee</span>
        <span className="[font-feature-settings:var(--font-feature-tabular)]">{formatNaira(REGISTRATION_FEE)}</span>
      </div>
      <div className="flex items-baseline justify-between border-t border-[var(--border-hairline)] pt-[10px] text-[16px] font-bold text-[var(--text-primary)]">
        <span>Due now</span>
        <span className="[font-feature-settings:var(--font-feature-tabular)]">{formatNaira(REGISTRATION_FEE)}</span>
      </div>
      <span className="text-[12px] leading-[1.45] text-[var(--text-muted)]">Refunded in full if all three names are already taken.</span>
    </div>
  );

  const youWillNeedCard = (
    <div className="flex flex-col gap-[11px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[20px]">
      <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--text-muted)]">You will need</span>
      <span className="text-[12.5px] leading-[1.55] text-[var(--text-secondary)]">
        A valid ID, a passport photo, and your proprietors&apos; signatures. Photos of originals are fine.
      </span>
    </div>
  );

  return (
    <>
      <div className="flex flex-col gap-[16px] p-[14px_16px_96px] xl:hidden">
        <div className="flex items-center gap-[10px]">
          <ProfileBackButton compact />
          <span className="flex-1 text-[16px] font-semibold text-[var(--text-primary)]">CAC registration</span>
          <span className="text-[12.5px] font-semibold text-[var(--text-muted)] [font-feature-settings:var(--font-feature-tabular)]">{step} of 3</span>
        </div>

        <div className="flex gap-[6px]">
          {[1, 2, 3].map((s) => (
            <span key={s} className={`h-[4px] flex-1 rounded-full transition-colors duration-200 ${step >= s ? "bg-[var(--accent)]" : "bg-[var(--surface-tag)]"}`} />
          ))}
        </div>

        {step === 1 && step1Content}
        {step === 2 && step2Content}
        {step === 3 && step3Content}

        <div className="mt-[4px]">{navButtons}</div>
      </div>

      {/* D13 frame 2 — 280px step rail / flex form / 340px live cost, replacing the mobile review-with-price step. */}
      <div className="hidden xl:flex xl:h-full xl:min-h-0 xl:flex-1 xl:flex-col">
        <div
          className="sticky top-0 z-20 flex h-[68px] shrink-0 items-center gap-4 border-b border-hairline bg-[rgba(19,19,22,0.86)] px-[26px] backdrop-blur"
          style={{ backdropFilter: "var(--blur-chrome)" }}
        >
          <Link href="/services" className="flex items-center gap-[9px] text-[14px] font-semibold text-[var(--text-secondary)] no-underline hover:text-text-primary">
            <Icon name="ArrowLeft" size={18} />
            Services
          </Link>
          <span className="ml-[10px] text-[19px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">CAC registration</span>
          <span className="flex-1" />
          <span className="text-[13.5px] text-[var(--text-muted)]">Saved automatically</span>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-[280px_1fr_340px] gap-[26px] overflow-hidden p-[26px]">
          <div className="flex min-h-0 flex-col gap-[14px]">
            {RAIL_STEPS.map(({ n, label }) => {
              const state = n === step ? "current" : n < step ? "done" : "upcoming";
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => n <= step && setStep(n)}
                  disabled={n > step}
                  className={[
                    "flex items-center gap-[11px] rounded-[var(--radius-input)] border p-[14px_16px] text-left",
                    state === "current" ? "border-[var(--border-selected)] bg-[var(--selected-tint)]" : "border-[var(--border-hairline)] bg-[var(--surface-card)]",
                    n <= step ? "cursor-pointer" : "cursor-default",
                    // Hover only on a completed step you can actually go back to.
                    // The current step keeps its selected fill; upcoming ones are disabled.
                    n < step ? "hover:bg-[var(--surface-hover)] active:bg-[var(--surface-press)]" : "",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "grid h-[24px] w-[24px] shrink-0 place-items-center rounded-full text-[12px] font-bold",
                      state === "done"
                        ? "bg-[var(--accent)] text-[var(--text-on-accent)]"
                        : state === "current"
                          ? "bg-[var(--accent)] text-[var(--text-on-accent)]"
                          : "bg-[var(--surface-tag)] text-[var(--text-muted)]",
                    ].join(" ")}
                  >
                    {state === "done" ? <Icon name="Check" size={12} color="var(--text-on-accent)" strokeWidth={3} /> : n}
                  </span>
                  <span className={`text-[13.5px] ${state === "current" ? "font-semibold text-[var(--text-primary)]" : "text-[var(--text-secondary)]"}`}>{label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex min-h-0 flex-col gap-[16px] overflow-y-auto">
            {step === 1 && step1Content}
            {step === 2 && step2Content}
            {step === 3 && step3ContentDesktop}
            <div className="mt-auto pt-[8px]">{navButtons}</div>
          </div>

          <div className="flex min-h-0 flex-col gap-[16px] overflow-y-auto">
            {costCard}
            {youWillNeedCard}
          </div>
        </div>
      </div>
    </>
  );
}

function ReviewRow({ label, value, onEdit, last = false }: { label: string; value: string; onEdit: () => void; last?: boolean }) {
  return (
    <div className={`flex items-center gap-[12px] p-[14px_16px] ${last ? "" : "border-b border-[var(--border-hairline)]"}`}>
      <span className="flex-1 text-[13px] text-[var(--text-secondary)]">{label}</span>
      <span className="text-[13.5px] font-semibold text-[var(--text-primary)]">{value}</span>
      <button type="button" onClick={onEdit} className="cursor-pointer border-0 bg-transparent p-0 text-[12.5px] font-semibold text-[var(--accent)] hover:text-[var(--text-primary)]">
        Edit
      </button>
    </div>
  );
}
