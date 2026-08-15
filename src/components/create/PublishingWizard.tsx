"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CONTENT_TYPE_META, type ContentType } from "@/types/content";
import { PLANS } from "@/types/subscription";
import { currentSession } from "@/lib/api/mocks/session";
import { formatNaira } from "@/lib/format";
import { FlowHeader } from "@/components/layout/FlowHeader";
import { Button } from "@/components/ui/Button";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { NairaInput } from "@/components/ui/Input";
import { StatusPill } from "@/components/ui/StatusPill";
import { ErrorState } from "@/components/ui/Feedback";

const stepIcons: Record<ContentType, IconName> = {
  video: "Play",
  course: "GraduationCap",
  audio: "Headphones",
  pdf: "BookOpen",
  image: "Image",
  template: "LayoutTemplate",
};

const uploadMeta: Record<ContentType, { file: string; meta: string; note: string; cover?: string }> = {
  video: {
    file: "stall-pricing-final.mp4",
    meta: "248 MB · 12:08",
    note: "MP4 or MOV, up to 2 GB. Landscape reads better in the feed.",
  },
  course: {
    file: "cac-in-7-days-course",
    meta: "6 lessons",
    note: "Courses stream lesson by lesson. Buyers get the whole thing.",
  },
  audio: {
    file: "pricing-answers.mp3",
    meta: "42 MB · 26 min",
    note: "MP3 or WAV, up to 200 MB. The preview is a 30 to 60 second clip.",
  },
  pdf: {
    file: "traders-playbook.pdf",
    meta: "8.4 MB · 34 pages",
    note: "Buyers download the file and keep it. Do not upload anything you do not own the rights to.",
    cover: "Books with a cover sell better than books without one.",
  },
  image: {
    file: "market-pricing-sheet.png",
    meta: "12 MB · 4000×3000",
    note: "PNG or JPG, up to 50 MB. Keep it sharp — it is what people buy.",
  },
  template: {
    file: "invoice-starter.xlsx",
    meta: "640 KB · 3 sheets",
    note: "Spreadsheets, forms and editable files. Buyers download and keep them.",
  },
};

export interface PublishingWizardProps {
  type: ContentType;
  firstUpload: boolean;
}

export function PublishingWizard({ type, firstUpload }: PublishingWizardProps) {
  const router = useRouter();
  const meta = CONTENT_TYPE_META[type];
  const file = uploadMeta[type];
  const [step, setStep] = useState(0);
  const [paid, setPaid] = useState(true);
  const [price, setPrice] = useState(1500);
  const [title, setTitle] = useState(firstUpload ? "" : "The trader's playbook");
  const [submitted, setSubmitted] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  const steps = ["Upload", "Free preview", "Details", "Price"];
  const stepLabel = `Step ${step + 1} of 4`;

  const tier = currentSession.creator?.tier ?? "basic";
  const tierIsPro = tier === "pro";
  const keep = PLANS[tier].split;
  const youEarn = Math.round((price * keep) / 100);
  const wawuTakes = price - youEarn;
  const proEarn = Math.round(price * 0.9);

  const submit = async () => {
    if (publishing) return;
    setPublishing(true);
    setPublishError(null);
    try {
      await contentPublish({ type, title, price: paid && !firstUpload ? price : 0 });
      setSubmitted(true);
    } catch (err) {
      setPublishError(err instanceof Error ? err.message : "Something went wrong submitting your upload.");
    } finally {
      setPublishing(false);
    }
  };

  if (submitted) {
    return <Submitted type={type} title={title} price={paid && !firstUpload ? price : 0} />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", maxWidth: "var(--mobile-column)", margin: "0 auto" }}>
      <FlowHeader title={step === 0 ? meta.label : steps[step]} right={<span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-muted)", fontFeatureSettings: "var(--font-feature-tabular)" }}>{stepLabel}</span>} />

      <div style={{ flex: 1, padding: "18px 16px", display: "flex", flexDirection: "column", gap: 18 }}>
        {publishError ? (
          <ErrorState
            title="Could not submit"
            description={publishError}
            onRetry={submit}
          />
        ) : (
          <>
            {step === 0 ? <UploadStep type={type} /> : null}
            {step === 1 ? <PreviewStep type={type} /> : null}
            {step === 2 ? <DetailsStep title={title} onTitle={setTitle} /> : null}
            {step === 3 ? (
              <PriceStep
                firstUpload={firstUpload}
                paid={paid}
                onPaid={setPaid}
                price={price}
                onPrice={setPrice}
                keep={keep}
                tierIsPro={tierIsPro}
                youEarn={youEarn}
                wawuTakes={wawuTakes}
                proEarn={proEarn}
              />
            ) : null}
          </>
        )}
      </div>

      <div style={{ padding: "14px 16px 24px", borderTop: "1px solid var(--border-hairline)", display: "flex", flexDirection: "column", gap: 10 }}>
        {publishError ? (
          <Button full size="lg" onClick={() => { setPublishError(null); setStep(3); }}>
            Back to pricing
          </Button>
        ) : null}
        {!publishError && step === 0 ? (
          <Button full size="lg" iconRight="ArrowRight" onClick={() => setStep(1)}>
            Set the preview
          </Button>
        ) : null}
        {!publishError && step === 1 ? (
          <Button full size="lg" iconRight="ArrowRight" onClick={() => setStep(2)}>
            Continue
          </Button>
        ) : null}
        {!publishError && step === 2 ? (
          <Button full size="lg" iconRight="ArrowRight" onClick={() => setStep(3)}>
            Set your price
          </Button>
        ) : null}
        {!publishError && step === 3 ? (
          <>
            <Button full size="lg" loading={publishing} onClick={submit}>
              {firstUpload ? "Publish free" : "Submit for review"}
            </Button>
            <span style={{ alignSelf: "center", fontSize: 12, color: "var(--text-muted)" }}>
              {firstUpload ? "Reviewed before it goes live." : "Reviewed before it goes live, same as any upload."}
            </span>
          </>
        ) : null}
      </div>
    </div>
  );
}

function UploadStep({ type }: { type: ContentType }) {
  const file = uploadMeta[type];
  const isStream = CONTENT_TYPE_META[type].group === "stream";
  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: 16, borderRadius: "var(--radius-card)", background: "var(--surface-card)", border: "1px solid var(--border-hairline)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ display: "grid", placeItems: "center", width: 42, height: 42, borderRadius: 13, background: "var(--accent-tint)", border: "1px solid var(--border-accent)", flexShrink: 0 }}>
            <Icon name={stepIcons[type]} size={18} stroke={2} color="var(--accent)" />
          </span>
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 3 }}>
            <span style={{ fontSize: 14.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "var(--text-primary)" }}>
              {file.file}
            </span>
            <span style={{ fontSize: 12, color: "var(--text-muted)", fontFeatureSettings: "var(--font-feature-tabular)" }}>{file.meta}</span>
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, fontFeatureSettings: "var(--font-feature-tabular)" }}>68%</span>
        </div>
        <div style={{ height: 5, borderRadius: 999, background: "var(--surface-tag)", overflow: "hidden" }}>
          <div style={{ width: "68%", height: "100%", borderRadius: 999, background: "var(--accent)" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ flex: 1, fontSize: 12, color: "var(--text-muted)" }}>Uploading — you can keep filling in the rest</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--accent)" }}>Cancel</span>
        </div>
      </div>

      {type === "video" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>Thumbnail</span>
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 1, position: "relative", aspectRatio: "16 / 10", borderRadius: "var(--radius-media)", background: "repeating-linear-gradient(135deg, var(--surface-tag) 0 12px, var(--surface-card) 12px 24px)", border: "1px solid var(--accent)" }}>
              <span style={{ position: "absolute", top: 8, left: 8, display: "inline-flex", alignItems: "center", height: 22, padding: "0 8px", borderRadius: 999, background: "var(--accent)", color: "#fff", fontSize: 10.5, fontWeight: 700 }}>
                Chosen
              </span>
            </div>
            <div style={{ flex: 1, aspectRatio: "16 / 10", borderRadius: "var(--radius-media)", background: "repeating-linear-gradient(135deg, var(--surface-tag) 0 12px, var(--surface-card) 12px 24px)", border: "1px solid var(--border-hairline)" }} />
            <div style={{ flex: 1, aspectRatio: "16 / 10", borderRadius: "var(--radius-media)", background: "repeating-linear-gradient(135deg, var(--surface-tag) 0 12px, var(--surface-card) 12px 24px)", border: "1px solid var(--border-hairline)" }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ flex: 1, fontSize: 12, color: "var(--text-muted)" }}>Pulled from your video</span>
            <Button size="sm" variant="secondary" icon="Upload">
              Upload one
            </Button>
          </div>
        </div>
      ) : null}

      {type === "pdf" ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: "30px 20px", borderRadius: "var(--radius-media)", background: "repeating-linear-gradient(135deg, var(--surface-tag) 0 12px, var(--surface-card) 12px 24px)", border: "1px dashed var(--border-strong)" }}>
          <span style={{ display: "grid", placeItems: "center", width: 48, height: 48, borderRadius: 15, background: "var(--surface-card)", border: "1px solid var(--border-hairline)" }}>
            <Icon name="Plus" size={20} stroke={2.2} color="var(--text-secondary)" />
          </span>
          <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>Add a cover</span>
          <span style={{ fontSize: 12.5, color: "var(--text-muted)", textAlign: "center" }}>
            Books with a cover sell better than books without one.
          </span>
        </div>
      ) : null}

      <InfoNote text={file.note} />
    </>
  );
}

function PreviewStep({ type }: { type: ContentType }) {
  const isPdf = type === "pdf";
  return (
    <>
      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: "var(--text-secondary)" }}>
        Anyone can see this much for free. Give away enough that they can tell it is good.
      </p>

      {isPdf ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 13, padding: 16, borderRadius: "var(--radius-card)", background: "var(--surface-card)", border: "1px solid var(--border-hairline)" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
            <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>Pages shown free</span>
            <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", fontFeatureSettings: "var(--font-feature-tabular)" }}>4</span>
          </div>
          <input type="range" min={1} max={10} defaultValue={4} style={{ width: "100%", accentColor: "var(--accent)", height: 24, cursor: "pointer" }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: "var(--text-muted)", fontFeatureSettings: "var(--font-feature-tabular)" }}>
            <span>1 page</span>
            <span>10 pages</span>
          </div>
          <span style={{ fontSize: 12.5, color: "var(--text-muted)", paddingTop: 11, borderTop: "1px solid var(--border-hairline)" }}>
            Pages 5 to 34 stay locked until someone buys.
          </span>
        </div>
      ) : null}

      <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>How it will look</span>
        <div style={{ display: "flex", gap: 9 }}>
          <div style={{ flex: 1, aspectRatio: "3 / 4", borderRadius: 10, background: "repeating-linear-gradient(135deg, var(--surface-tag) 0 12px, var(--surface-card) 12px 24px)", border: "1px solid var(--border-hairline)" }} />
          <div style={{ flex: 1, aspectRatio: "3 / 4", borderRadius: 10, background: "repeating-linear-gradient(135deg, var(--surface-tag) 0 12px, var(--surface-card) 12px 24px)", border: "1px solid var(--border-hairline)" }} />
          <div style={{ position: "relative", flex: 1, aspectRatio: "3 / 4", borderRadius: 10, overflow: "hidden", border: "1px solid var(--border-hairline)" }}>
            <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(135deg, var(--surface-tag) 0 12px, var(--surface-card) 12px 24px)", filter: "blur(8px)", transform: "scale(1.12)" }} />
            <div style={{ position: "absolute", inset: 0, background: "var(--locked-veil)", display: "grid", placeItems: "center" }}>
              <Icon name="Lock" size={16} stroke={2.2} color="#fff" />
            </div>
          </div>
        </div>
      </div>

      <InfoNote text={type === "audio" ? "For audio the preview is a 30 to 60 second clip. For a course it is the first lesson." : "For audio the preview is a 30 to 60 second clip. For a course it is the first lesson."} />
    </>
  );
}

function DetailsStep({ title, onTitle }: { title: string; onTitle: (v: string) => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Input label="Title" value={title} onChange={(e) => onTitle(e.target.value)} />
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>Description</span>
        <div style={{ display: "flex", minHeight: 104, padding: "14px 16px", borderRadius: "var(--radius-input)", background: "var(--surface-input)", border: "1px solid var(--border-hairline)", fontSize: 14.5, lineHeight: 1.5, color: "var(--text-primary)" }}>
          Everything I learned running a stall for nine years — stock, margin, spoilage, and what to do on a slow day.
        </div>
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Say who it is for and what they will be able to do after.</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>Category</span>
        <button
          type="button"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            height: 52,
            padding: "0 16px",
            borderRadius: "var(--radius-input)",
            background: "var(--surface-input)",
            border: "1px solid var(--border-hairline)",
            color: "var(--text-primary)",
            fontFamily: "var(--font-sans)",
            fontSize: 15,
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          <span style={{ flex: 1 }}>Business</span>
          <Icon name="ChevronDown" size={16} stroke={2.2} color="var(--text-muted)" />
        </button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>Tags</span>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {["trading", "pricing"].map((t) => (
            <span key={t} style={{ display: "inline-flex", alignItems: "center", gap: 7, height: 34, padding: "0 12px", borderRadius: 999, background: "var(--accent-tint)", border: "1px solid var(--border-accent)", color: "var(--text-primary)", fontSize: 13, fontWeight: 600 }}>
              {t}
              <Icon name="X" size={12} stroke={2.6} color="var(--accent)" />
            </span>
          ))}
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, height: 34, padding: "0 12px", borderRadius: 999, background: "var(--surface-tag)", border: "1px dashed var(--border-hairline)", color: "var(--text-muted)", fontSize: 13, fontWeight: 500 }}>
            <Icon name="Plus" size={13} stroke={2.2} color="var(--text-muted)" />
            Add
          </span>
        </div>
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Up to 5. Tags are how people find you in search.</span>
      </div>
    </div>
  );
}

function PriceStep({
  firstUpload,
  paid,
  onPaid,
  price,
  onPrice,
  keep,
  tierIsPro,
  youEarn,
  wawuTakes,
  proEarn,
}: {
  firstUpload: boolean;
  paid: boolean;
  onPaid: (v: boolean) => void;
  price: number;
  onPrice: (v: number) => void;
  keep: number;
  tierIsPro: boolean;
  youEarn: number;
  wawuTakes: number;
  proEarn: number;
}) {
  return (
    <>
      {firstUpload ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: 20, borderRadius: "var(--radius-card)", background: "var(--surface-elevated)", border: "1px solid var(--border-accent)" }}>
          <span style={{ display: "grid", placeItems: "center", width: 46, height: 46, borderRadius: 14, background: "var(--accent-tint)", border: "1px solid var(--border-accent)" }}>
            <Icon name="Gift" size={20} stroke={2} color="var(--accent)" />
          </span>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            <span style={{ fontSize: 19, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--text-primary)" }}>Your first one is free</span>
            <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.5, color: "var(--text-secondary)" }}>
              Nobody has bought from you yet, so nobody knows the work is worth paying for. Give this one away, then price everything after it.
            </p>
          </div>
          <div style={{ display: "flex" }}>
            <StatusPill kind="info">Free · set for you</StatusPill>
          </div>
        </div>
      ) : null}

      <div style={{ display: "flex", gap: 4, padding: 4, borderRadius: 999, background: "var(--surface-tag)", border: "1px solid var(--border-hairline)", opacity: firstUpload ? 0.55 : 1 }}>
        {["Free", "Paid"].map((label) => {
          const active = (label === "Paid") === paid;
          return (
            <button
              key={label}
              type="button"
              disabled={firstUpload && label === "Paid"}
              onClick={() => onPaid(label === "Paid")}
              style={{
                flex: 1,
                display: "grid",
                placeItems: "center",
                height: 40,
                borderRadius: 999,
                border: "none",
                background: active ? "var(--accent)" : "transparent",
                color: active ? "var(--text-on-accent)" : firstUpload && label === "Paid" ? "var(--text-disabled)" : "var(--text-secondary)",
                fontSize: 13.5,
                fontWeight: 600,
                fontFamily: "var(--font-sans)",
                cursor: firstUpload && label === "Paid" ? "not-allowed" : "pointer",
              }}
            >
              {firstUpload && label === "Paid" ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
                  <Icon name="Lock" size={14} stroke={2.2} color="var(--text-disabled)" />
                  Paid
                </span>
              ) : (
                label
              )}
            </button>
          );
        })}
      </div>

      {firstUpload ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 11, padding: 16, borderRadius: "var(--radius-card)", background: "var(--surface-card)", border: "1px solid var(--border-hairline)" }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-muted)" }}>What happens next</span>
          <div style={{ display: "flex", gap: 11 }}>
            <span style={{ display: "grid", placeItems: "center", width: 22, height: 22, borderRadius: 999, background: "var(--accent)", color: "#fff", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>1</span>
            <span style={{ flex: 1, fontSize: 13, lineHeight: 1.45, color: "var(--text-secondary)" }}>This goes live free and starts pulling people to your profile.</span>
          </div>
          <div style={{ display: "flex", gap: 11 }}>
            <span style={{ display: "grid", placeItems: "center", width: 22, height: 22, borderRadius: 999, background: "var(--accent)", color: "#fff", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>2</span>
            <span style={{ flex: 1, fontSize: 13, lineHeight: 1.45, color: "var(--text-secondary)" }}>Your next upload can carry any price from ₦100 to ₦5,000.</span>
          </div>
        </div>
      ) : paid ? (
        <>
          <NairaInput
            label="Price per sale"
            value={price}
            onChange={onPrice}
            presets={[500, 1000, 1500, 2500]}
            hint="Most PDFs on WAWU sell between ₦500 and ₦2,000."
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: 18, borderRadius: "var(--radius-card)", background: "var(--surface-elevated)", border: "1px solid var(--border-accent)" }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-muted)" }}>You earn per sale</span>
            <span style={{ fontSize: 34, fontWeight: 700, letterSpacing: "-0.035em", lineHeight: 1, fontFeatureSettings: "var(--font-feature-tabular)" }}>
              {formatNaira(youEarn)}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: 13, borderTop: "1px solid var(--border-hairline)" }}>
              <span style={{ flex: 1, fontSize: 13, color: "var(--text-secondary)" }}>Buyer pays</span>
              <span style={{ fontSize: 13.5, fontWeight: 600, fontFeatureSettings: "var(--font-feature-tabular)" }}>{formatNaira(price)}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ flex: 1, fontSize: 13, color: "var(--text-secondary)" }}>WAWU takes {100 - keep}%</span>
              <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-muted)", fontFeatureSettings: "var(--font-feature-tabular)" }}>−{formatNaira(wawuTakes)}</span>
            </div>
            {!tierIsPro ? (
              <div style={{ display: "flex", alignItems: "center", gap: 9, paddingTop: 12, borderTop: "1px solid var(--border-hairline)" }}>
                <Icon name="TrendingUp" size={15} stroke={2.2} color="var(--accent)" />
                <span style={{ flex: 1, fontSize: 12.5, lineHeight: 1.45, color: "var(--text-secondary)" }}>
                  On Pro you would keep {formatNaira(proEarn)} — 90% instead of 85%.
                </span>
              </div>
            ) : null}
          </div>
        </>
      ) : null}
    </>
  );
}

function Submitted({ type, title, price }: { type: ContentType; title: string; price: number }) {
  const router = useRouter();
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", maxWidth: "var(--mobile-column)", margin: "0 auto" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18, padding: "40px 28px", textAlign: "center" }}>
        <span style={{ display: "grid", placeItems: "center", width: 88, height: 88, borderRadius: 999, background: "var(--warning-tint)", border: "1px solid rgba(255,183,3,0.3)" }}>
          <Icon name="Clock" size={36} stroke={2.2} color="var(--warning)" />
        </span>
        <h2 style={{ margin: 0, fontSize: 26, fontWeight: 700, letterSpacing: "-0.03em", color: "var(--text-primary)" }}>Under review</h2>
        <p style={{ margin: 0, fontSize: 15, lineHeight: 1.55, color: "var(--text-secondary)", maxWidth: 290 }}>
          Usually within a day. We will notify you when it goes live.
        </p>
        <div style={{ display: "flex", gap: 13, width: "100%", padding: 15, borderRadius: "var(--radius-card)", background: "var(--surface-card)", border: "1px solid var(--border-hairline)", textAlign: "left" }}>
          <div style={{ width: 52, height: 66, borderRadius: 10, flexShrink: 0, background: "repeating-linear-gradient(135deg, var(--surface-tag) 0 12px, var(--surface-card) 12px 24px)", border: "1px solid var(--border-hairline)" }} />
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 5 }}>
            <span style={{ fontSize: 14.5, fontWeight: 600, color: "var(--text-primary)" }}>{title || "Untitled"}</span>
            <span style={{ fontSize: 12.5, color: "var(--text-secondary)" }}>
              {CONTENT_TYPE_META[type].label} · {price > 0 ? `${formatNaira(price)}` : "Free"}
            </span>
            <div style={{ display: "flex" }}>
              <StatusPill kind="warning" size="xs">Pending review</StatusPill>
            </div>
          </div>
        </div>
        <span style={{ fontSize: 12.5, lineHeight: 1.5, color: "var(--text-muted)", maxWidth: 290 }}>
          Your slot is already counted. If it is rejected the slot comes back.
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "14px 16px 24px", borderTop: "1px solid var(--border-hairline)" }}>
        <Button full size="lg" onClick={() => router.push("/create/library")}>
          Back to your content
        </Button>
        <Button full variant="ghost" icon="Plus" onClick={() => router.push("/create")}>
          Upload another
        </Button>
      </div>
    </div>
  );
}

function InfoNote({ text }: { text: string }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "13px 14px", borderRadius: "var(--radius-input)", background: "var(--surface-card)", border: "1px solid var(--border-hairline)" }}>
      <Icon name="Info" size={15} color="var(--text-muted)" style={{ marginTop: 1 }} />
      <span style={{ flex: 1, fontSize: 12.5, lineHeight: 1.5, color: "var(--text-secondary)" }}>{text}</span>
    </div>
  );
}

function contentPublish(payload: { type: ContentType; title: string; price: number }): Promise<void> {
  return import("@/lib/api/content").then(({ contentApi }) =>
    contentApi.publish({
      type: payload.type,
      title: payload.title,
      meta: `${CONTENT_TYPE_META[payload.type].label} · ${payload.price > 0 ? formatNaira(payload.price) : "free"}`,
      price: payload.price,
    }).then(() => undefined),
  );
}
