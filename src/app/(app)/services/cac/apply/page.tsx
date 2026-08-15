"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ProfileBackButton } from "@/components/profile/ProfileBackButton";
import { Button, Icon, Input } from "@/components/ui";
import type { IconName } from "@/components/ui/Icon";
import { formatNaira } from "@/lib/format";
import { payCacApplication } from "@/lib/api/services";

type Step = 1 | 2 | 3;
const STEP_LABELS = ["Details", "Documents", "Review"];
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
}

const INITIAL_DOCS: DocSlot[] = [
  { key: "id", label: "Valid ID", icon: "IdCard", filename: "nin-slip.jpg", sizeLabel: "1.2 MB", state: "uploaded" },
  { key: "signature", label: "Signature", icon: "Signature", filename: "signature.png", state: "uploading", progress: 74 },
  { key: "passport", label: "Passport photograph", icon: "Image", state: "empty" },
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
      errors[key] = "Drop “Ltd” — that is only for a limited company.";
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

  // Simulate the signature upload finishing so step 2's Continue eventually unlocks.
  useEffect(() => {
    const signature = docs.find((d) => d.key === "signature");
    if (!signature || signature.state !== "uploading") return;
    const id = setInterval(() => {
      setDocs((prev) =>
        prev.map((d) => {
          if (d.key !== "signature" || d.state !== "uploading") return d;
          const next = Math.min(100, (d.progress ?? 0) + 9);
          if (next >= 100) {
            return { ...d, state: "uploaded", progress: 100, sizeLabel: "640 KB" };
          }
          return { ...d, progress: next };
        }),
      );
    }, 320);
    return () => clearInterval(id);
  }, [docs]);

  const addPassportPhoto = (source: "camera" | "file") => {
    setDocs((prev) => prev.map((d) => (d.key === "passport" ? { ...d, state: "uploading", progress: 0 } : d)));
    setTimeout(() => {
      setDocs((prev) =>
        prev.map((d) =>
          d.key === "passport"
            ? { ...d, state: "uploaded", filename: source === "camera" ? "passport-photo.jpg" : "passport.jpg", sizeLabel: "480 KB" }
            : d,
        ),
      );
    }, 650);
  };

  const allDocsUploaded = docs.every((d) => d.state === "uploaded");

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
      <div className="flex flex-col items-center gap-[18px] p-[40px_28px_96px] text-center">
        <span className="grid h-[88px] w-[88px] place-items-center rounded-full border border-[var(--border-accent)] bg-[var(--accent-tint)]">
          <Icon name="Check" size={40} color="var(--accent)" strokeWidth={2.6} />
        </span>
        <h2 className="m-0 text-[26px] font-bold tracking-[-0.03em] text-[var(--text-primary)]">Application in</h2>
        <p className="m-0 max-w-[290px] text-[15px] leading-[1.55] text-[var(--text-secondary)]">
          We will check your names against the CAC register and file the first one that is free.
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

  return (
    <div className="flex flex-col gap-[16px] p-[14px_16px_96px]">
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

      {step === 1 && (
        <div className="flex flex-col gap-[16px]">
          <div className="flex flex-col gap-[6px]">
            <h2 className="m-0 text-[21px] font-bold tracking-[-0.02em] text-[var(--text-primary)]">Business details</h2>
            <p className="m-0 text-[13.5px] leading-[1.5] text-[var(--text-secondary)]">
              Give three name choices in order of preference. CAC takes the first one that is free.
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
                        ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--text-on-accent)]"
                        : "border-[var(--border-hairline)] bg-[var(--surface-tag)] text-[var(--text-secondary)]",
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
                className="h-[52px] w-full cursor-pointer appearance-none rounded-[var(--radius-input)] border border-[var(--border-hairline)] bg-[var(--surface-input)] px-[16px] pr-[40px] text-[15px] text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
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
      )}

      {step === 2 && (
        <div className="flex flex-col gap-[16px]">
          <div className="flex flex-col gap-[6px]">
            <h2 className="m-0 text-[21px] font-bold tracking-[-0.02em] text-[var(--text-primary)]">Documents</h2>
            <p className="m-0 text-[13.5px] leading-[1.5] text-[var(--text-secondary)]">Photos are fine as long as the text is readable.</p>
          </div>

          {docs.map((doc) =>
            doc.state === "empty" ? (
              <div
                key={doc.key}
                className="flex flex-col items-center justify-center gap-[11px] rounded-[var(--radius-media)] border border-dashed border-[var(--border-strong)] bg-[repeating-linear-gradient(135deg,_var(--surface-tag)_0_12px,_var(--surface-card)_12px_24px)] p-[26px_20px]"
              >
                <span className="grid h-[44px] w-[44px] place-items-center rounded-[14px] border border-[var(--border-hairline)] bg-[var(--surface-card)]">
                  <Icon name="Plus" size={19} color="var(--text-secondary)" strokeWidth={2.2} />
                </span>
                <span className="text-[14px] font-semibold text-[var(--text-primary)]">{doc.label}</span>
                <span className="text-[12.5px] text-[var(--text-muted)]">Plain background, face clear</span>
              </div>
            ) : (
              <div
                key={doc.key}
                className="flex flex-col gap-[11px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[15px]"
              >
                <div className="flex items-center gap-[13px]">
                  <span className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-[13px] border border-[var(--border-accent)] bg-[var(--accent-tint)]">
                    <Icon name={doc.icon} size={18} color="var(--accent)" strokeWidth={2} />
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
                    <span className="text-[14.5px] font-semibold text-[var(--text-primary)]">{doc.label}</span>
                    <span className="text-[12px] text-[var(--text-muted)]">
                      {doc.filename} {doc.state === "uploading" ? "· uploading" : doc.sizeLabel ? `· ${doc.sizeLabel}` : ""}
                    </span>
                  </div>
                  {doc.state === "uploaded" ? (
                    <Icon name="Check" size={18} color="var(--success)" strokeWidth={2.6} />
                  ) : (
                    <span className="text-[13px] font-bold [font-feature-settings:var(--font-feature-tabular)]">{doc.progress ?? 0}%</span>
                  )}
                </div>
                {doc.state === "uploading" && (
                  <div className="h-[5px] overflow-hidden rounded-full bg-[var(--surface-tag)]">
                    <div className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-300" style={{ width: `${doc.progress ?? 0}%` }} />
                  </div>
                )}
              </div>
            ),
          )}

          <div className="flex gap-[10px]">
            <Button variant="secondary" icon="Camera" className="flex-1" onClick={() => addPassportPhoto("camera")}>
              Take a photo
            </Button>
            <Button variant="secondary" icon="Paperclip" className="flex-1" onClick={() => addPassportPhoto("file")}>
              Choose file
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-col gap-[16px]">
          {payPhase === "failed" && (
            <div className="flex items-start gap-[10px] rounded-[var(--radius-input)] border border-[rgba(255,92,92,0.32)] bg-[var(--danger-tint)] p-[13px_14px]">
              <Icon name="CircleAlert" size={16} color="var(--danger)" strokeWidth={2.2} className="mt-[1px]" />
              <span className="flex-1 text-[13.5px] leading-[1.45] text-[var(--danger)]">
                Your bank didn&apos;t confirm the payment. Nothing was charged — try again.
              </span>
            </div>
          )}

          <div className="flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)]">
            <ReviewRow label="Type" value={regType === "business_name" ? "Business name" : "Limited company"} onEdit={() => setStep(1)} />
            <div className="flex items-start gap-[12px] border-b border-[var(--border-hairline)] p-[14px_16px]">
              <span className="flex-1 text-[13px] text-[var(--text-secondary)]">Names</span>
              <div className="flex flex-col items-end gap-[3px]">
                <span className="text-[13.5px] font-semibold text-[var(--text-primary)]">{first || "—"}</span>
                <span className="text-[12.5px] text-[var(--text-muted)]">{second || "—"}</span>
                <span className="text-[12.5px] text-[var(--text-muted)]">{third || "—"}</span>
              </div>
              <button type="button" onClick={() => setStep(1)} className="cursor-pointer border-0 bg-transparent p-0 text-[12.5px] font-semibold text-[var(--accent)]">
                Edit
              </button>
            </div>
            <ReviewRow label="Nature" value={nature} onEdit={() => setStep(1)} />
            <ReviewRow label="Documents" value={`${docs.filter((d) => d.state === "uploaded").length} attached`} onEdit={() => setStep(2)} last />
          </div>

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

          <button type="button" onClick={() => setConfirmed((v) => !v)} className="flex cursor-pointer items-start gap-[11px] border-0 bg-transparent p-0 text-left">
            <span
              className={[
                "mt-[1px] grid h-[22px] w-[22px] shrink-0 place-items-center rounded-[7px] border",
                confirmed ? "border-[var(--accent)] bg-[var(--accent)]" : "border-[var(--border-hairline)] bg-transparent",
              ].join(" ")}
            >
              {confirmed && <Icon name="Check" size={14} color="#fff" strokeWidth={3} />}
            </span>
            <span className="flex-1 text-[13.5px] leading-[1.45] text-[var(--text-secondary)]">The details above are correct and the documents are mine.</span>
          </button>
        </div>
      )}

      <div className="mt-[4px] flex gap-[10px]">
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
    </div>
  );
}

function ReviewRow({ label, value, onEdit, last = false }: { label: string; value: string; onEdit: () => void; last?: boolean }) {
  return (
    <div className={`flex items-center gap-[12px] p-[14px_16px] ${last ? "" : "border-b border-[var(--border-hairline)]"}`}>
      <span className="flex-1 text-[13px] text-[var(--text-secondary)]">{label}</span>
      <span className="text-[13.5px] font-semibold text-[var(--text-primary)]">{value}</span>
      <button type="button" onClick={onEdit} className="cursor-pointer border-0 bg-transparent p-0 text-[12.5px] font-semibold text-[var(--accent)]">
        Edit
      </button>
    </div>
  );
}
