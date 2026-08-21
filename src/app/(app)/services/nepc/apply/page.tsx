"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { CacBusinessRecord } from "@/types/services";
import { getCacBusinessRecord, submitNepcApplication } from "@/lib/api/services";
import { ProfileBackButton } from "@/components/profile/ProfileBackButton";
import { Button, ErrorState, FilePicker, Icon, Input } from "@/components/ui";
import type { IconName } from "@/components/ui/Icon";

type Step = 1 | 2 | 3;
const RAIL_STEPS: { n: Step; label: string }[] = [
  { n: 1, label: "Export details" },
  { n: 2, label: "Documents" },
  { n: 3, label: "Review" },
];

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
  hint?: string;
  /** Object-storage URL once the file genuinely finished uploading. */
  url?: string;
}

const INITIAL_DOCS: DocSlot[] = [
  { key: "cac_certificate", label: "CAC certificate", icon: "FileCheck", hint: "Your CAC registration certificate.", state: "empty" },
  { key: "sample", label: "Product sample photos", icon: "Image", hint: "Clear photos of what you export.", state: "empty" },
  { key: "reference_letter", label: "Bank reference letter", icon: "Landmark", hint: "A recent letter on the bank's letterhead.", state: "empty" },
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

  // Real uploads (POST /uploads/presign + direct PUT). These slots used to
  // fill themselves in with setInterval/setTimeout and no file attached, so
  // applicants reached payment having uploaded nothing.
  const markUploaded = (key: DocKey, file: { fileUrl: string; name: string; size: number }) => {
    setDocs((prev) =>
      prev.map((d) =>
        d.key === key
          ? {
              ...d,
              state: "uploaded",
              meta: file.name,
              url: file.fileUrl,
            }
          : d,
      ),
    );
  };

  const clearDoc = (key: DocKey) => {
    setDocs((prev) => prev.map((d) => (d.key === key ? { ...d, state: "empty", meta: undefined, url: undefined } : d)));
  };

  const detailsValid = !!mainProduct.trim() && markets.length > 0 && !!yearlyVolume.trim() && !!record;

  const allDocsUploaded = docs.every((d) => d.state === "uploaded");
  const docsReadyCount = docs.filter((d) => d.state === "uploaded").length;

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
      setSubmitError("Could not submit your application. Nothing was lost, try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    return (
      <div className="flex flex-col items-center gap-[18px] p-[64px_28px_96px] text-center xl:mx-auto xl:mt-[8vh] xl:max-w-[440px] xl:p-0">
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

  // Shared step content — built once and reused by both the mobile stacked flow
  // and the xl three-column layout, so the two never drift apart.
  const step1Content = (
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
              className="inline-flex h-[34px] items-center gap-[7px] rounded-full border border-[var(--border-decor)] bg-[var(--decor-tint)] px-[12px] text-[13px] font-semibold text-[var(--text-primary)]"
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
            label={doc.state === "uploaded" ? "Replace file" : `Add your ${doc.label.toLowerCase()}`}
            hint={doc.hint}
            onUploaded={(f) => markUploaded(doc.key, f)}
            onCleared={() => clearDoc(doc.key)}
          />
        </div>
      ))}
    </div>
  );

  const step3Content = (
    <div className="flex flex-col gap-[16px]">
      {submitError && <ErrorState title="Couldn't submit" body={submitError} onRetry={submit} />}
      {!submitError && (
        <div className="flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)]">
          <ReviewRow label="Business" value={record ? `${record.businessName} · ${record.rcNumber}` : "—"} onEdit={() => setStep(1)} />
          <ReviewRow label="What you export" value={category} onEdit={() => setStep(1)} />
          <ReviewRow label="Main product" value={mainProduct || "—"} onEdit={() => setStep(1)} />
          <ReviewRow label="Target markets" value={markets.length ? markets.join(", ") : "—"} onEdit={() => setStep(1)} />
          <ReviewRow label="Yearly volume" value={yearlyVolume || "—"} onEdit={() => setStep(1)} />
          <ReviewRow label="Documents" value={`${docsReadyCount} attached`} onEdit={() => setStep(2)} last />
        </div>
      )}
      {!submitError && (
        <span className="text-[12.5px] leading-[1.5] text-[var(--text-muted)]">
          Nothing to start, an export agent reads this by hand and connects you to the right NEPC desk.
        </span>
      )}
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
  );

  // No fee to break down for NEPC (free to start) — the xl right rail instead
  // carries a live summary of what's been entered, replacing the mobile
  // review step's need to be the first place the whole application is seen.
  const summaryCard = (
    <div className="flex flex-col gap-[12px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[20px]">
      <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--text-muted)]">Application summary</span>
      <SummaryRow label="Business" value={record ? `${record.businessName} · ${record.rcNumber}` : "Pending CAC"} />
      <SummaryRow label="Exports" value={category} />
      <SummaryRow label="Main product" value={mainProduct || "—"} />
      <SummaryRow label="Target markets" value={markets.length ? `${markets.length} selected` : "—"} />
      <SummaryRow label="Yearly volume" value={yearlyVolume || "—"} />
      <SummaryRow label="Documents ready" value={`${docsReadyCount} of ${docs.length}`} />
      <div className="flex items-center justify-between border-t border-[var(--border-hairline)] pt-[10px]">
        <span className="text-[13.5px] font-semibold text-[var(--text-primary)]">Cost</span>
        <span className="text-[13.5px] font-bold text-[var(--success)]">Nothing to start</span>
      </div>
    </div>
  );

  const goodToKnowCard = (
    <div className="flex flex-col gap-[11px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[20px]">
      <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--text-muted)]">Good to know</span>
      <span className="text-[12.5px] leading-[1.55] text-[var(--text-secondary)]">
        An export agent reads this by hand and connects you to the right NEPC desk within 3–5 days.
      </span>
    </div>
  );

  return (
    <>
      <div className="flex flex-col gap-[16px] p-[14px_16px_96px] xl:hidden">
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

        {step === 1 && step1Content}
        {step === 2 && step2Content}
        {step === 3 && step3Content}

        <div className="mt-[4px]">{navButtons}</div>
      </div>

      {/* D13 frame 2, structurally parallel to CAC — 280px step rail / flex form / 340px live summary. */}
      <div className="hidden xl:flex xl:h-full xl:min-h-0 xl:flex-1 xl:flex-col">
        <div
          className="sticky top-0 z-20 flex h-[68px] shrink-0 items-center gap-4 border-b border-hairline bg-[rgba(19,19,22,0.86)] px-[26px] backdrop-blur"
          style={{ backdropFilter: "var(--blur-chrome)" }}
        >
          <Link href="/services" className="flex items-center gap-[9px] text-[14px] font-semibold text-[var(--text-secondary)] no-underline">
            <Icon name="ArrowLeft" size={18} color="var(--text-secondary)" />
            Services
          </Link>
          <span className="ml-[10px] text-[19px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">NEPC registration</span>
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
            <div className="mt-auto flex flex-col gap-[9px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[16px]">
              <span className="text-[12.5px] font-semibold text-[var(--text-primary)]">Need help?</span>
              <span className="text-[12px] leading-[1.5] text-[var(--text-muted)]">A mentor can review your export plan before you submit, at no charge.</span>
            </div>
          </div>

          <div className="flex min-h-0 flex-col gap-[16px] overflow-y-auto">
            {step === 1 && step1Content}
            {step === 2 && step2Content}
            {step === 3 && step3Content}
            <div className="mt-auto pt-[8px]">{navButtons}</div>
          </div>

          <div className="flex min-h-0 flex-col gap-[16px] overflow-y-auto">
            {summaryCard}
            {goodToKnowCard}
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
      <span className="truncate text-right text-[13.5px] font-semibold text-[var(--text-primary)]">{value}</span>
      <button type="button" onClick={onEdit} className="cursor-pointer border-0 bg-transparent p-0 text-[12.5px] font-semibold text-[var(--accent)]">
        Edit
      </button>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-[10px] text-[13px]">
      <span className="flex-1 text-[var(--text-secondary)]">{label}</span>
      <span className="truncate text-right font-semibold text-[var(--text-primary)]">{value}</span>
    </div>
  );
}
