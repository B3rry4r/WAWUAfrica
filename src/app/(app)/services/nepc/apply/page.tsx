"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { CacBusinessRecord } from "@/types/services";
import { getCacBusinessRecord, submitNepcApplication } from "@/lib/api/services";
import { ProfileBackButton } from "@/components/profile/ProfileBackButton";
import { Button, ErrorState, Icon, Input } from "@/components/ui";
import type { IconName } from "@/components/ui/Icon";

type Step = 1 | 2 | 3;

const EXPORT_CATEGORIES = [
  "Agricultural produce",
  "Solid minerals",
  "Manufactured goods",
  "Arts and crafts",
  "Fashion and textiles",
  "Processed foods and beverages",
  "Services",
  "Other",
];

const MARKET_CANDIDATES = ["Ghana", "United Kingdom", "United States", "South Africa", "Kenya", "United Arab Emirates", "Netherlands", "China"];

type DocKey = "cac_certificate" | "sample" | "reference_letter";
type DocState = "uploaded" | "uploading" | "empty";

interface DocSlot {
  key: DocKey;
  label: string;
  icon: IconName;
  meta?: string;
  state: DocState;
  progress?: number;
}

const INITIAL_DOCS: DocSlot[] = [
  { key: "cac_certificate", label: "CAC certificate", icon: "FileCheck", meta: "Pulled from your CAC record", state: "uploaded" },
  { key: "sample", label: "Product sample photos", icon: "Image", meta: "sample-set.jpg", state: "uploading", progress: 40 },
  { key: "reference_letter", label: "Bank reference letter", icon: "Landmark", state: "empty" },
];

export default function NepcApplyPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);

  const [record, setRecord] = useState<CacBusinessRecord | null>(null);
  const [recordState, setRecordState] = useState<"loading" | "ready" | "error">("loading");

  const [category, setCategory] = useState(EXPORT_CATEGORIES[0]);
  const [mainProduct, setMainProduct] = useState("");
  const [markets, setMarkets] = useState<string[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [yearlyVolume, setYearlyVolume] = useState("");
  const [showDetailErrors, setShowDetailErrors] = useState(false);

  const [docs, setDocs] = useState<DocSlot[]>(INITIAL_DOCS);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>();
  const [result, setResult] = useState<{ reference: string; applicationId: string } | null>(null);

  const loadRecord = () => {
    setRecordState("loading");
    getCacBusinessRecord()
      .then((r) => {
        setRecord(r);
        setRecordState("ready");
      })
      .catch(() => setRecordState("error"));
  };

  useEffect(() => {
    let active = true;
    getCacBusinessRecord()
      .then((r) => {
        if (!active) return;
        setRecord(r);
        setRecordState("ready");
      })
      .catch(() => active && setRecordState("error"));
    return () => {
      active = false;
    };
  }, []);

  // Simulate the sample-photos upload finishing so step 2's Continue unlocks.
  useEffect(() => {
    const sample = docs.find((d) => d.key === "sample");
    if (!sample || sample.state !== "uploading") return;
    const id = setInterval(() => {
      setDocs((prev) =>
        prev.map((d) => {
          if (d.key !== "sample" || d.state !== "uploading") return d;
          const next = Math.min(100, (d.progress ?? 0) + 11);
          if (next >= 100) return { ...d, state: "uploaded", progress: 100, meta: "sample-set.jpg · 3 photos" };
          return { ...d, progress: next };
        }),
      );
    }, 320);
    return () => clearInterval(id);
  }, [docs]);

  const addReferenceLetter = (source: "camera" | "file") => {
    setDocs((prev) => prev.map((d) => (d.key === "reference_letter" ? { ...d, state: "uploading", progress: 0 } : d)));
    setTimeout(() => {
      setDocs((prev) =>
        prev.map((d) =>
          d.key === "reference_letter"
            ? { ...d, state: "uploaded", meta: source === "camera" ? "reference-letter.jpg" : "reference-letter.pdf", progress: 100 }
            : d,
        ),
      );
    }, 600);
  };

  const detailsValid = !!mainProduct.trim() && markets.length > 0 && !!yearlyVolume.trim() && !!record;
  const allDocsUploaded = docs.every((d) => d.state === "uploaded");

  const next = () => {
    if (step === 1) {
      if (!detailsValid) {
        setShowDetailErrors(true);
        return;
      }
      setStep(2);
      return;
    }
    if (step === 2) {
      if (!allDocsUploaded) return;
      setStep(3);
    }
  };

  const submit = async () => {
    if (submitting || !record) return;
    setSubmitting(true);
    setSubmitError(undefined);
    try {
      const res = await submitNepcApplication({
        rcNumber: record.rcNumber,
        exportCategory: category,
        mainProduct: mainProduct.trim(),
        targetMarkets: markets,
        yearlyVolume: yearlyVolume.trim(),
      });
      setResult(res);
    } catch {
      setSubmitError("Could not submit your application. Nothing was lost — try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    return (
      <div className="flex flex-col items-center gap-[18px] p-[64px_28px_96px] text-center">
        <span className="grid h-[72px] w-[72px] place-items-center rounded-full border border-[rgba(184,232,62,0.35)] bg-[var(--success-tint)]">
          <Icon name="Check" size={34} color="var(--success)" strokeWidth={2.6} />
        </span>
        <div className="flex flex-col gap-[6px]">
          <span className="text-[20px] font-bold tracking-[-0.02em] text-[var(--text-primary)]">You&apos;re in the queue</span>
          <span className="text-[13.5px] leading-[1.5] text-[var(--text-secondary)]">
            An export agent will reply within 3–5 days and connect you to the right NEPC desk.
          </span>
        </div>
        <div className="flex w-full items-center gap-[10px] rounded-[var(--radius-input)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[12px_14px]">
          <span className="flex-1 text-[13px] text-[var(--text-secondary)]">Reference</span>
          <span className="text-[13.5px] font-bold [font-feature-settings:var(--font-feature-tabular)]">{result.reference}</span>
        </div>
        <div className="flex w-full flex-col gap-[10px]">
          <Button full onClick={() => router.push(`/services/applications/${result.applicationId}`)}>
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
        <span className="flex-1 text-[16px] font-semibold text-[var(--text-primary)]">NEPC registration</span>
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
            <h2 className="m-0 text-[21px] font-bold tracking-[-0.02em] text-[var(--text-primary)]">Export details</h2>
            <p className="m-0 text-[13.5px] leading-[1.5] text-[var(--text-secondary)]">NEPC certification requires a CAC-registered business.</p>
          </div>

          {recordState === "loading" ? (
            <div className="h-[60px] animate-pulse rounded-[var(--radius-input)] bg-[var(--surface-tag)]" />
          ) : recordState === "error" ? (
            <ErrorState title="Couldn't load your CAC record" body="Check your connection and try again." onRetry={loadRecord} />
          ) : record ? (
            <div className="flex items-center gap-[12px] rounded-[var(--radius-input)] border border-[rgba(184,232,62,0.3)] bg-[var(--success-tint)] p-[14px_15px]">
              <Icon name="Check" size={16} color="var(--success)" strokeWidth={2.4} />
              <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
                <span className="text-[13.5px] font-semibold text-[var(--text-primary)]">{record.businessName}</span>
                <span className="text-[12px] text-[var(--text-secondary)] [font-feature-settings:var(--font-feature-tabular)]">
                  {record.rcNumber} · pulled from your CAC record
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-[10px] rounded-[var(--radius-input)] border border-[rgba(255,183,3,0.3)] bg-[var(--warning-tint)] p-[13px_14px]">
              <Icon name="TriangleAlert" size={16} color="var(--warning)" strokeWidth={2.2} className="mt-[1px]" />
              <div className="flex flex-1 flex-col gap-[6px]">
                <span className="text-[13.5px] leading-[1.45] text-[var(--text-primary)]">
                  You&apos;ll need a CAC-registered business before applying for NEPC.
                </span>
                <Button size="sm" variant="secondary" href="/services/cac/apply">
                  Start CAC registration
                </Button>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-[8px]">
            <span className="text-[13px] font-semibold text-[var(--text-secondary)]">What you export</span>
            <div className="relative">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                aria-label="What you export"
                className="h-[52px] w-full cursor-pointer appearance-none rounded-[var(--radius-input)] border border-[var(--border-hairline)] bg-[var(--surface-input)] px-[16px] pr-[40px] text-[15px] text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
              >
                {EXPORT_CATEGORIES.map((o) => (
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

          <Input
            label="Main product"
            value={mainProduct}
            onChange={(e) => setMainProduct(e.target.value)}
            placeholder="e.g. Dried ginger"
            error={showDetailErrors && !mainProduct.trim() ? "Tell us your main product." : undefined}
          />

          <div className="flex flex-col gap-[9px]">
            <span className="text-[13px] font-semibold text-[var(--text-secondary)]">Target markets</span>
            <div className="flex flex-wrap gap-[8px]">
              {markets.map((m) => (
                <span
                  key={m}
                  className="inline-flex h-[34px] items-center gap-[7px] rounded-full border border-[var(--border-accent)] bg-[var(--accent-tint)] px-[12px] text-[13px] font-semibold text-[var(--text-primary)]"
                >
                  {m}
                  <button
                    type="button"
                    aria-label={`Remove ${m}`}
                    onClick={() => setMarkets((prev) => prev.filter((x) => x !== m))}
                    className="grid cursor-pointer place-items-center border-0 bg-transparent p-0"
                  >
                    <Icon name="X" size={12} color="var(--accent)" strokeWidth={2.6} />
                  </button>
                </span>
              ))}
              <button
                type="button"
                onClick={() => setPickerOpen((v) => !v)}
                className="inline-flex h-[34px] cursor-pointer items-center gap-[6px] rounded-full border border-dashed border-[var(--border-hairline)] bg-[var(--surface-tag)] px-[12px] text-[13px] font-medium text-[var(--text-muted)]"
              >
                <Icon name="Plus" size={13} color="var(--text-muted)" strokeWidth={2.2} />
                Add
              </button>
            </div>
            {pickerOpen && (
              <div className="flex flex-wrap gap-[8px] rounded-[var(--radius-input)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[10px]">
                {MARKET_CANDIDATES.filter((c) => !markets.includes(c)).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      setMarkets((prev) => [...prev, c]);
                      setPickerOpen(false);
                    }}
                    className="inline-flex h-[30px] cursor-pointer items-center rounded-full border border-[var(--border-hairline)] bg-[var(--surface-tag)] px-[11px] text-[12.5px] font-medium text-[var(--text-secondary)]"
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
            {showDetailErrors && markets.length === 0 && <span className="text-[12.5px] text-[var(--danger)]">Add at least one target market.</span>}
          </div>

          <Input
            label="Yearly export volume"
            value={yearlyVolume}
            onChange={(e) => setYearlyVolume(e.target.value)}
            placeholder="e.g. 12 tonnes"
            hint="An estimate is fine."
            error={showDetailErrors && !yearlyVolume.trim() ? "Give an estimate." : undefined}
          />
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
                <span className="text-[12.5px] text-[var(--text-muted)]">A recent letter, on the bank&apos;s letterhead</span>
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
                    <span className="text-[12px] text-[var(--text-muted)]">{doc.meta}{doc.state === "uploading" ? " · uploading" : ""}</span>
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
            <Button variant="secondary" icon="Camera" className="flex-1" onClick={() => addReferenceLetter("camera")}>
              Take a photo
            </Button>
            <Button variant="secondary" icon="Paperclip" className="flex-1" onClick={() => addReferenceLetter("file")}>
              Choose file
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-col gap-[16px]">
          {submitError && (
            <ErrorState title="Couldn't submit" body={submitError} onRetry={submit} />
          )}
          {!submitError && (
            <div className="flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)]">
              <ReviewRow label="Business" value={record ? `${record.businessName} · ${record.rcNumber}` : "—"} onEdit={() => setStep(1)} />
              <ReviewRow label="What you export" value={category} onEdit={() => setStep(1)} />
              <ReviewRow label="Main product" value={mainProduct || "—"} onEdit={() => setStep(1)} />
              <ReviewRow label="Target markets" value={markets.length ? markets.join(", ") : "—"} onEdit={() => setStep(1)} />
              <ReviewRow label="Yearly volume" value={yearlyVolume || "—"} onEdit={() => setStep(1)} />
              <ReviewRow label="Documents" value={`${docs.filter((d) => d.state === "uploaded").length} attached`} onEdit={() => setStep(2)} last />
            </div>
          )}
          {!submitError && (
            <span className="text-[12.5px] leading-[1.5] text-[var(--text-muted)]">
              Free to start — an export agent reads this by hand and connects you to the right NEPC desk.
            </span>
          )}
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
        {step === 3 && !submitError && (
          <div className="flex w-full flex-col gap-[10px]">
            <Button full size="lg" loading={submitting} onClick={submit}>
              Submit application
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
      <span className="truncate text-right text-[13.5px] font-semibold text-[var(--text-primary)]">{value}</span>
      <button type="button" onClick={onEdit} className="cursor-pointer border-0 bg-transparent p-0 text-[12.5px] font-semibold text-[var(--accent)]">
        Edit
      </button>
    </div>
  );
}
