"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CONTENT_TYPE_META, type ContentType } from "@/types/content";
import { PLANS } from "@/types/subscription";
import { currentSession } from "@/lib/api/mocks/session";
import { creatorGates } from "@/lib/auth/gates";
import { formatNaira } from "@/lib/format";
import { FlowHeader } from "@/components/layout/FlowHeader";
import { Button } from "@/components/ui/Button";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { NairaInput } from "@/components/ui/NairaInput";
import { StatusPill } from "@/components/ui/StatusPill";
import { ErrorState } from "@/components/ui/Feedback";
import { ContentGridCard } from "@/components/ui/ContentCard";

const stepIcons: Record<ContentType, IconName> = {
  video: "Play",
  course: "GraduationCap",
  audio: "Headphones",
  pdf: "BookOpen",
  image: "Image",
  template: "LayoutTemplate",
};

const previewRatio: Record<ContentType, string> = {
  video: "16 / 9",
  course: "16 / 9",
  audio: "16 / 9",
  pdf: "3 / 4",
  image: "1 / 1",
  template: "3 / 4",
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
  /** Set when re-entering the wizard to fix and resubmit a rejected item. */
  resubmit?: { id: string; title: string };
}

export function PublishingWizard({ type, firstUpload, resubmit }: PublishingWizardProps) {
  const router = useRouter();
  const meta = CONTENT_TYPE_META[type];
  const file = uploadMeta[type];
  const [step, setStep] = useState(0);
  const [paid, setPaid] = useState(!firstUpload);
  const [price, setPrice] = useState(1500);
  const [title, setTitle] = useState(resubmit ? resubmit.title : firstUpload ? "" : "The trader's playbook");
  const [submitted, setSubmitted] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  // D7 desktop only — the mobile flow doesn't step through a dedicated free
  // preview screen for non-PDF types, but the desktop right rail shows the
  // choice inline, so it needs its own bit of state.
  const [previewChoice, setPreviewChoice] = useState<"90s" | "3min" | "none">("90s");

  const steps = ["Upload", "Free preview", "Details", "Price"];
  const stepLabel = `Step ${step + 1} of 4`;

  const tier = currentSession.creator?.tier ?? "basic";
  const tierIsPro = tier === "pro";
  const keep = PLANS[tier].split;
  const youEarn = Math.round((price * keep) / 100);
  const wawuTakes = price - youEarn;
  const proEarn = Math.round(price * 0.9);
  const gates = creatorGates(currentSession);
  // The slot this upload would land in, ahead of publishing.
  const nextSlot = Math.min(gates.slotsUsed + 1, gates.slotsTotal);

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

  const desktopPrice = paid && !firstUpload ? price : 0;

  // D7 desktop header · 3-pill progress summary. The mobile `step` pointer
  // (Upload → Free preview → Details → Price) is a literal current-screen
  // index that doesn't map onto the desktop layout, which collapses those
  // into two simultaneous columns with nothing gated behind a "current
  // step". So the desktop pills read logical completion off the same
  // fields the mobile Details/Price steps collect instead of mirroring
  // `step` directly — a step is "done" once its data is filled in, and the
  // first not-yet-filled step is the one shown as current.
  const desktopStepsFilled = [
    true, // Upload — the file is already attached the moment this screen renders
    title.trim().length > 0, // Details
    firstUpload || !paid || price > 0, // Price — first upload is auto-free; otherwise needs a price once "Paid" is chosen
  ];
  let desktopCurrentStep = desktopStepsFilled.findIndex((filled) => !filled);
  if (desktopCurrentStep === -1) desktopCurrentStep = desktopStepsFilled.length - 1;
  const desktopStepLabels = ["Upload", "Details", "Price"];

  return (
    <>
    <div className="flex flex-col min-h-[100vh] max-w-[var(--mobile-column)] m-0 xl:hidden">
      <FlowHeader title={step === 0 ? (resubmit ? `Fix · ${meta.label}` : meta.label) : steps[step]} right={<span className="text-[12.5px] font-semibold text-[var(--text-muted)] [font-feature-settings:var(--font-feature-tabular)]">{stepLabel}</span>} />

      <div className="flex-1 py-[18px] px-[16px] flex flex-col gap-[18px]">
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

      <div className="pt-[14px] px-[16px] pb-[24px] border-t border-t-[var(--border-hairline)] flex flex-col gap-[10px]">
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
              {resubmit ? "Resubmit for review" : firstUpload ? "Publish free" : "Submit for review"}
            </Button>
            <span className="text-[12px] text-[var(--text-muted)] self-center">
              {resubmit
                ? "Reviewed again before it goes live."
                : firstUpload
                  ? "Reviewed before it goes live."
                  : "Reviewed before it goes live, same as any upload."}
            </span>
          </>
        ) : null}
      </div>
    </div>

    {/* D7 · Publishing, desktop — the mobile 5-step wizard collapses into two
        columns: upload + details on the left, price + a live buyer-facing
        preview on the right, updating as the form fills in. */}
    <div className="hidden xl:flex xl:h-full xl:min-h-0 xl:flex-col">
      <div className="flex h-[68px] shrink-0 items-center gap-4 border-b border-hairline bg-[rgba(19,19,22,0.86)] px-[26px] backdrop-blur">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-[9px] border-none bg-transparent p-0 text-[14px] font-semibold text-text-secondary cursor-pointer"
        >
          <Icon name="X" size={18} color="var(--text-secondary)" />
          Discard
        </button>
        <span className="flex-1" />
        <div className="flex items-center gap-5">
          {desktopStepLabels.map((label, i) => {
            const active = i <= desktopCurrentStep;
            return (
              <span
                key={label}
                className={`flex items-center gap-2 text-[13.5px] font-semibold ${active ? "text-text-primary" : "text-text-muted"}`}
              >
                <span
                  className={`grid h-[22px] w-[22px] place-items-center rounded-full text-[11.5px] font-bold ${
                    active ? "bg-accent text-on-accent" : "bg-tag"
                  }`}
                >
                  {i + 1}
                </span>
                {label}
              </span>
            );
          })}
        </div>
        <span className="flex-1" />
        {publishError ? (
          <span className="text-[13px] text-danger">{publishError}</span>
        ) : null}
        <Button size="sm" variant="secondary">
          Save draft
        </Button>
        <Button size="sm" iconRight="ArrowRight" loading={publishing} onClick={submit}>
          {resubmit ? "Resubmit for review" : firstUpload ? "Publish free" : "Publish"}
        </Button>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[1fr_420px] gap-[26px] overflow-y-auto p-[26px]">
        <div className="flex min-w-0 flex-col gap-[20px]">
          <div className="flex flex-col gap-[14px] rounded-[var(--radius-card)] border border-hairline bg-card p-[22px]">
            <div className="flex items-center gap-[14px]">
              <div className="grid h-[96px] w-[150px] shrink-0 place-items-center rounded-[var(--radius-media)] border border-hairline bg-elevated">
                <Icon name={stepIcons[type]} size={22} color="var(--text-muted)" />
              </div>
              <div className="flex flex-1 flex-col gap-[9px]">
                <div className="flex justify-between text-[13.5px]">
                  <span className="font-semibold text-text-primary">{file.file}</span>
                  <span className="text-text-muted [font-feature-settings:var(--font-feature-tabular)]">{file.meta}</span>
                </div>
                <div className="h-[6px] rounded-full bg-tag">
                  <div className="h-full w-[68%] rounded-full bg-[linear-gradient(90deg,#5A0B7D,var(--accent))]" />
                </div>
                <span className="text-[12.5px] text-text-muted">
                  Keep this tab open until it finishes. You can fill in the details now.
                </span>
              </div>
            </div>
            {type === "video" ? (
              <div className="flex gap-[10px] border-t border-hairline pt-[14px]">
                <div className="h-[64px] w-[104px] rounded-xl border-[1.5px] border-accent bg-elevated" />
                <div className="h-[64px] w-[104px] rounded-xl border border-hairline bg-elevated" />
                <div className="h-[64px] w-[104px] rounded-xl border border-hairline bg-elevated" />
                <div className="flex flex-1 items-center pl-[6px]">
                  <span className="text-[12.5px] text-text-muted">Pick the cover frame — or upload your own</span>
                </div>
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-[16px] rounded-[var(--radius-card)] border border-hairline bg-card p-[22px]">
            <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-text-muted">Details</span>
            <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
            <div className="flex flex-col gap-2">
              <span className="text-[13px] font-semibold text-text-secondary">Description</span>
              <div className="flex min-h-[74px] rounded-input border border-hairline bg-input px-4 py-[14px] text-[14.5px] leading-[1.5] text-text-primary">
                What will someone be able to do after watching?
              </div>
            </div>
            <div className="flex flex-col gap-[9px]">
              <span className="text-[12.5px] font-semibold text-text-secondary">Category</span>
              <span className="text-[12px] leading-[1.5] text-text-muted">
                Learn and Question are temporarily disabled due to misuse. They will return soon. Opportunity, Event
                and Research publish after an admin check.
              </span>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-accent px-[14px] py-2 text-[13px] font-semibold text-on-accent">
                  Construction
                </span>
                {["Sell", "Event · admin review", "Opportunity · admin review", "Research · admin review"].map((c) => (
                  <span key={c} className="rounded-full bg-tag px-[14px] py-2 text-[13px] text-text-secondary">
                    {c}
                  </span>
                ))}
                {["Learn", "Question"].map((c) => (
                  <span
                    key={c}
                    className="inline-flex items-center gap-[7px] rounded-full border border-dashed border-hairline bg-tag px-[14px] py-2 text-[13px] text-text-muted"
                  >
                    <Icon name="Ban" size={14} color="var(--text-muted)" />
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-[16px]">
          <div className="flex flex-col gap-[14px] rounded-[var(--radius-card)] border border-accent bg-card p-[22px]">
            <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-text-muted">Price</span>
            {firstUpload ? (
              <div className="flex flex-col gap-[11px] rounded-[var(--radius-card)] border border-accent bg-elevated p-[16px]">
                <span className="text-[15px] font-semibold text-text-primary">Your first one is free</span>
                <p className="m-0 text-[13px] leading-[1.5] text-text-secondary">
                  Nobody has bought from you yet. Give this one away, then price everything after it.
                </p>
                <div className="flex">
                  <StatusPill kind="info">Free · set for you</StatusPill>
                </div>
              </div>
            ) : (
              <>
                <div className="flex gap-1 rounded-full border border-hairline bg-tag p-1">
                  {["Free", "Paid"].map((label) => {
                    const active = (label === "Paid") === paid;
                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() => setPaid(label === "Paid")}
                        className={`h-[38px] flex-1 rounded-full border-none text-[13.5px] font-semibold ${
                          active ? "bg-accent text-on-accent" : "bg-transparent text-text-secondary"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
                {paid ? (
                  <>
                    <NairaInput
                      label="What buyers pay"
                      value={price}
                      onChange={setPrice}
                      presets={[500, 1000, 1500, 2500]}
                      hint={`Most pieces in this category sell between ${formatNaira(500)} and ${formatNaira(2500)}.`}
                    />
                    <div className="flex flex-col gap-[9px] border-t border-hairline pt-[14px]">
                      <div className="flex justify-between text-[13.5px] text-text-secondary">
                        <span>You keep {keep}% on {tierIsPro ? "Pro" : "Basic"}</span>
                        <span className="font-bold text-text-primary [font-feature-settings:var(--font-feature-tabular)]">
                          {formatNaira(youEarn)}
                        </span>
                      </div>
                      {!tierIsPro ? (
                        <div className="flex justify-between text-[13px] text-text-muted">
                          <span>On Pro you would keep</span>
                          <span className="[font-feature-settings:var(--font-feature-tabular)]">{formatNaira(proEarn)}</span>
                        </div>
                      ) : null}
                      <div className="flex items-center gap-[9px] pt-1">
                        <Icon name="Info" size={15} color="var(--warning)" />
                        <span className="text-[12.5px] text-[#FFD37A]">
                          Uses slot {nextSlot} of {gates.slotsTotal} · resets on renewal
                        </span>
                      </div>
                    </div>
                  </>
                ) : null}
              </>
            )}
          </div>

          <div className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-hairline bg-card p-[22px]">
            <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-text-muted">Free preview</span>
            <span className="text-[13.5px] leading-[1.5] text-text-secondary">
              You choose the giveaway. First 90 seconds is the default.
            </span>
            <div className="flex gap-2">
              {(["90s", "3min", "none"] as const).map((choice) => (
                <button
                  key={choice}
                  type="button"
                  onClick={() => setPreviewChoice(choice)}
                  className={`rounded-full px-[14px] py-2 text-[13px] font-semibold ${
                    previewChoice === choice ? "bg-accent text-on-accent" : "bg-tag text-text-secondary"
                  }`}
                >
                  {choice === "90s" ? "90s" : choice === "3min" ? "3 min" : "None"}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-auto flex flex-col gap-[10px] rounded-[var(--radius-card)] border border-hairline bg-card p-[18px]">
            <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-text-muted">Preview as a buyer</span>
            <ContentGridCard
              state={desktopPrice > 0 ? "locked" : "free"}
              title={title || meta.label}
              price={desktopPrice > 0 ? desktopPrice : undefined}
              contentType={type}
              count={meta.label}
              ratio={previewRatio[type]}
            />
          </div>
        </div>
      </div>
    </div>
    </>
  );
}

function UploadStep({ type }: { type: ContentType }) {
  const file = uploadMeta[type];
  const isStream = CONTENT_TYPE_META[type].group === "stream";
  return (
    <>
      <div className="flex flex-col gap-[12px] p-[16px] rounded-[var(--radius-card)] bg-[var(--surface-card)] border border-[var(--border-hairline)]">
        <div className="flex items-center gap-[12px]">
          <span className="grid place-items-center w-[42px] h-[42px] rounded-[13] bg-[var(--accent-tint)] border border-[var(--border-accent)] shrink-0">
            <Icon name={stepIcons[type]} size={18} strokeWidth={2} color="var(--accent)" />
          </span>
          <div className="flex-1 min-w-0 flex flex-col gap-[3px]">
            <span className="text-[14.5px] font-semibold whitespace-nowrap overflow-hidden text-ellipsis text-[var(--text-primary)]">
              {file.file}
            </span>
            <span className="text-[12px] text-[var(--text-muted)] [font-feature-settings:var(--font-feature-tabular)]">{file.meta}</span>
          </div>
          <span className="text-[13px] font-bold [font-feature-settings:var(--font-feature-tabular)]">68%</span>
        </div>
        <div className="h-[5px] rounded-[999] bg-[var(--surface-tag)] overflow-hidden">
          <div className="w-[68%] h-full rounded-[999] bg-[var(--accent)]" />
        </div>
        <div className="flex items-center gap-[8px]">
          <span className="flex-1 text-[12px] text-[var(--text-muted)]">Uploading — you can keep filling in the rest</span>
          <span className="text-[12px] font-semibold text-[var(--accent)]">Cancel</span>
        </div>
      </div>

      {type === "video" ? (
        <div className="flex flex-col gap-[11px]">
          <span className="text-[13px] font-semibold text-[var(--text-secondary)]">Thumbnail</span>
          <div className="flex gap-[10px]">
            <div className="flex-1 relative aspect-[16_/_10] rounded-[var(--radius-media)] bg-[repeating-linear-gradient(135deg,_var(--surface-tag)_0_12px,_var(--surface-card)_12px_24px)] border border-[var(--accent)]">
              <span className="absolute top-[8px] left-[8px] inline-flex items-center h-[22px] py-0 px-[8px] rounded-[999] bg-[var(--accent)] text-[#fff] text-[10.5px] font-bold">
                Chosen
              </span>
            </div>
            <div className="flex-1 aspect-[16_/_10] rounded-[var(--radius-media)] bg-[repeating-linear-gradient(135deg,_var(--surface-tag)_0_12px,_var(--surface-card)_12px_24px)] border border-[var(--border-hairline)]" />
            <div className="flex-1 aspect-[16_/_10] rounded-[var(--radius-media)] bg-[repeating-linear-gradient(135deg,_var(--surface-tag)_0_12px,_var(--surface-card)_12px_24px)] border border-[var(--border-hairline)]" />
          </div>
          <div className="flex items-center gap-[10px]">
            <span className="flex-1 text-[12px] text-[var(--text-muted)]">Pulled from your video</span>
            <Button size="sm" variant="secondary" icon="Upload">
              Upload one
            </Button>
          </div>
        </div>
      ) : null}

      {type === "pdf" ? (
        <div className="flex flex-col items-center justify-center gap-[12px] py-[30px] px-[20px] rounded-[var(--radius-media)] bg-[repeating-linear-gradient(135deg,_var(--surface-tag)_0_12px,_var(--surface-card)_12px_24px)] border-[1px_dashed_var(--border-strong)]">
          <span className="grid place-items-center w-[48px] h-[48px] rounded-[15] bg-[var(--surface-card)] border border-[var(--border-hairline)]">
            <Icon name="Plus" size={20} strokeWidth={2.2} color="var(--text-secondary)" />
          </span>
          <span className="text-[14px] font-semibold text-[var(--text-primary)]">Add a cover</span>
          <span className="text-[12.5px] text-[var(--text-muted)] text-center">
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
      <p className="m-0 text-[14px] leading-[1.5] text-[var(--text-secondary)]">
        Anyone can see this much for free. Give away enough that they can tell it is good.
      </p>

      {isPdf ? (
        <div className="flex flex-col gap-[13px] p-[16px] rounded-[var(--radius-card)] bg-[var(--surface-card)] border border-[var(--border-hairline)]">
          <div className="flex items-baseline gap-[12px]">
            <span className="flex-1 text-[14px] font-semibold text-[var(--text-primary)]">Pages shown free</span>
            <span className="text-[22px] font-bold tracking-[-0.02em] [font-feature-settings:var(--font-feature-tabular)]">4</span>
          </div>
          <input type="range" min={1} max={10} defaultValue={4} className="w-full h-[24px] cursor-pointer accent-[var(--accent)]" />
          <div className="flex justify-between text-[11.5px] text-[var(--text-muted)] [font-feature-settings:var(--font-feature-tabular)]">
            <span>1 page</span>
            <span>10 pages</span>
          </div>
          <span className="text-[12.5px] text-[var(--text-muted)] pt-[11px] border-t border-t-[var(--border-hairline)]">
            Pages 5 to 34 stay locked until someone buys.
          </span>
        </div>
      ) : null}

      <div className="flex flex-col gap-[11px]">
        <span className="text-[13px] font-semibold text-[var(--text-secondary)]">How it will look</span>
        <div className="flex gap-[9px]">
          <div className="flex-1 aspect-[3_/_4] rounded-[10] bg-[repeating-linear-gradient(135deg,_var(--surface-tag)_0_12px,_var(--surface-card)_12px_24px)] border border-[var(--border-hairline)]" />
          <div className="flex-1 aspect-[3_/_4] rounded-[10] bg-[repeating-linear-gradient(135deg,_var(--surface-tag)_0_12px,_var(--surface-card)_12px_24px)] border border-[var(--border-hairline)]" />
          <div className="relative flex-1 aspect-[3_/_4] rounded-[10] overflow-hidden border border-[var(--border-hairline)]">
            <div className="absolute inset-0 bg-[repeating-linear-gradient(135deg,_var(--surface-tag)_0_12px,_var(--surface-card)_12px_24px)] blur-[8px] scale-[1.12]" />
            <div className="absolute inset-0 bg-[var(--locked-veil)] grid place-items-center">
              <Icon name="Lock" size={16} strokeWidth={2.2} color="#fff" />
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
    <div className="flex flex-col gap-[16px]">
      <Input label="Title" value={title} onChange={(e) => onTitle(e.target.value)} />
      <div className="flex flex-col gap-[8px]">
        <span className="text-[13px] font-semibold text-[var(--text-secondary)]">Description</span>
        <div className="flex min-h-[104px] py-[14px] px-[16px] rounded-[var(--radius-input)] bg-[var(--surface-input)] border border-[var(--border-hairline)] text-[14.5px] leading-[1.5] text-[var(--text-primary)]">
          Everything I learned running a stall for nine years — stock, margin, spoilage, and what to do on a slow day.
        </div>
        <span className="text-[12px] text-[var(--text-muted)]">Say who it is for and what they will be able to do after.</span>
      </div>
      <div className="flex flex-col gap-[8px]">
        <span className="text-[13px] font-semibold text-[var(--text-secondary)]">Category</span>
        <button
          type="button"
          className="flex items-center gap-[10px] h-[52px] py-0 px-[16px] rounded-[var(--radius-input)] bg-[var(--surface-input)] border border-[var(--border-hairline)] text-[var(--text-primary)] text-[15px] cursor-pointer text-left font-[var(--font-sans)]"
        >
          <span className="flex-1">Business</span>
          <Icon name="ChevronDown" size={16} strokeWidth={2.2} color="var(--text-muted)" />
        </button>
      </div>
      <div className="flex flex-col gap-[9px]">
        <span className="text-[13px] font-semibold text-[var(--text-secondary)]">Tags</span>
        <div className="flex flex-wrap gap-[8px]">
          {["trading", "pricing"].map((t) => (
            <span key={t} className="inline-flex items-center gap-[7px] h-[34px] py-0 px-[12px] rounded-[999] bg-[var(--accent-tint)] border border-[var(--border-accent)] text-[var(--text-primary)] text-[13px] font-semibold">
              {t}
              <Icon name="X" size={12} strokeWidth={2.6} color="var(--accent)" />
            </span>
          ))}
          <span className="inline-flex items-center gap-[6px] h-[34px] py-0 px-[12px] rounded-[999] bg-[var(--surface-tag)] border-[1px_dashed_var(--border-hairline)] text-[var(--text-muted)] text-[13px] font-medium">
            <Icon name="Plus" size={13} strokeWidth={2.2} color="var(--text-muted)" />
            Add
          </span>
        </div>
        <span className="text-[12px] text-[var(--text-muted)]">Up to 5. Tags are how people find you in search.</span>
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
        <div className="flex flex-col gap-[14px] p-0 rounded-[var(--radius-card)] bg-[var(--surface-elevated)] border border-[var(--border-accent)]">
          <span className="grid place-items-center w-[46px] h-[46px] rounded-[14] bg-[var(--accent-tint)] border border-[var(--border-accent)]">
            <Icon name="Gift" size={20} strokeWidth={2} color="var(--accent)" />
          </span>
          <div className="flex flex-col gap-[7px]">
            <span className="text-[19px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">Your first one is free</span>
            <p className="m-0 text-[13.5px] leading-[1.5] text-[var(--text-secondary)]">
              Nobody has bought from you yet, so nobody knows the work is worth paying for. Give this one away, then price everything after it.
            </p>
          </div>
          <div className="flex">
            <StatusPill kind="info">Free · set for you</StatusPill>
          </div>
        </div>
      ) : null}

      <div className={`flex gap-[4px] p-[4px] rounded-[999] bg-[var(--surface-tag)] border border-[var(--border-hairline)] ${firstUpload ? "opacity-[0.55]" : "opacity-100"}`}>
        {["Free", "Paid"].map((label) => {
          const active = (label === "Paid") === paid;
          return (
            <button
              key={label}
              type="button"
              disabled={firstUpload && label === "Paid"}
              onClick={() => onPaid(label === "Paid")}
              className={`flex-1 grid place-items-center h-[40px] rounded-[999] border-[none] text-[13.5px] font-semibold font-[var(--font-sans)] ${
                active
                  ? "bg-[var(--accent)] text-[var(--text-on-accent)]"
                  : firstUpload && label === "Paid"
                    ? "bg-transparent text-[var(--text-disabled)]"
                    : "bg-transparent text-[var(--text-secondary)]"
              } ${firstUpload && label === "Paid" ? "cursor-not-allowed" : "cursor-pointer"}`}
            >
              {firstUpload && label === "Paid" ? (
                <span className="inline-flex items-center gap-[7px]">
                  <Icon name="Lock" size={14} strokeWidth={2.2} color="var(--text-disabled)" />
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
        <div className="flex flex-col gap-[11px] p-[16px] rounded-[var(--radius-card)] bg-[var(--surface-card)] border border-[var(--border-hairline)]">
          <span className="text-[11px] font-bold tracking-[0.06em] uppercase text-[var(--text-muted)]">What happens next</span>
          <div className="flex gap-[11px]">
            <span className="grid place-items-center w-[22px] h-[22px] rounded-[999] bg-[var(--accent)] text-[#fff] text-[11px] font-bold shrink-0">1</span>
            <span className="flex-1 text-[13px] leading-[1.45] text-[var(--text-secondary)]">This goes live free and starts pulling people to your profile.</span>
          </div>
          <div className="flex gap-[11px]">
            <span className="grid place-items-center w-[22px] h-[22px] rounded-[999] bg-[var(--accent)] text-[#fff] text-[11px] font-bold shrink-0">2</span>
            <span className="flex-1 text-[13px] leading-[1.45] text-[var(--text-secondary)]">Your next upload can carry any price from {formatNaira(100)} to {formatNaira(5000)}.</span>
          </div>
        </div>
      ) : paid ? (
        <>
          <NairaInput
            label="Price per sale"
            value={price}
            onChange={onPrice}
            presets={[500, 1000, 1500, 2500]}
            hint={`Most PDFs on WAWU sell between ${formatNaira(500)} and ${formatNaira(2000)}.`}
          />
          <div className="flex flex-col gap-[12px] p-[18px] rounded-[var(--radius-card)] bg-[var(--surface-elevated)] border border-[var(--border-accent)]">
            <span className="text-[11px] font-bold tracking-[0.06em] uppercase text-[var(--text-muted)]">You earn per sale</span>
            <span className="text-[34px] font-bold tracking-[-0.035em] leading-[1] [font-feature-settings:var(--font-feature-tabular)]">
              {formatNaira(youEarn)}
            </span>
            <div className="flex items-center gap-[10px] pt-[13px] border-t border-t-[var(--border-hairline)]">
              <span className="flex-1 text-[13px] text-[var(--text-secondary)]">Buyer pays</span>
              <span className="text-[13.5px] font-semibold [font-feature-settings:var(--font-feature-tabular)]">{formatNaira(price)}</span>
            </div>
            <div className="flex items-center gap-[10px]">
              <span className="flex-1 text-[13px] text-[var(--text-secondary)]">WAWU takes {100 - keep}%</span>
              <span className="text-[13.5px] font-semibold text-[var(--text-muted)] [font-feature-settings:var(--font-feature-tabular)]">−{formatNaira(wawuTakes)}</span>
            </div>
            {!tierIsPro ? (
              <div className="flex items-center gap-[9px] pt-[12px] border-t border-t-[var(--border-hairline)]">
                <Icon name="TrendingUp" size={15} strokeWidth={2.2} color="var(--accent)" />
                <span className="flex-1 text-[12.5px] leading-[1.45] text-[var(--text-secondary)]">
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
    <div className="flex flex-col min-h-[100vh] max-w-[var(--mobile-column)] m-0">
      <div className="flex-1 flex flex-col items-center justify-center gap-[18px] py-[40px] px-[28px] text-center">
        <span className="grid place-items-center w-[88px] h-[88px] rounded-[999] bg-[var(--warning-tint)] border border-[rgba(255,183,3,0.3)]">
          <Icon name="Clock" size={36} strokeWidth={2.2} color="var(--warning)" />
        </span>
        <h2 className="m-0 text-[26px] font-bold tracking-[-0.03em] text-[var(--text-primary)]">Under review</h2>
        <p className="m-0 text-[15px] leading-[1.55] text-[var(--text-secondary)] max-w-[290px]">
          Usually within a day. We will notify you when it goes live.
        </p>
        <div className="flex gap-[13px] w-full p-[15px] rounded-[var(--radius-card)] bg-[var(--surface-card)] border border-[var(--border-hairline)] text-left">
          <div className="w-[52px] h-[66px] rounded-[10] shrink-0 bg-[repeating-linear-gradient(135deg,_var(--surface-tag)_0_12px,_var(--surface-card)_12px_24px)] border border-[var(--border-hairline)]" />
          <div className="flex-1 min-w-0 flex flex-col gap-[5px]">
            <span className="text-[14.5px] font-semibold text-[var(--text-primary)]">{title || "Untitled"}</span>
            <span className="text-[12.5px] text-[var(--text-secondary)]">
              {CONTENT_TYPE_META[type].label} · {price > 0 ? `${formatNaira(price)}` : "Free"}
            </span>
            <div className="flex">
              <StatusPill kind="warning" size="xs">Pending review</StatusPill>
            </div>
          </div>
        </div>
        <span className="text-[12.5px] leading-[1.5] text-[var(--text-muted)] max-w-[290px]">
          Your slot is already counted. If it is rejected the slot comes back.
        </span>
      </div>
      <div className="flex flex-col gap-[10px] pt-[14px] px-[16px] pb-[24px] border-t border-t-[var(--border-hairline)]">
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
    <div className="flex items-start gap-[10px] py-[13px] px-[14px] rounded-[var(--radius-input)] bg-[var(--surface-card)] border border-[var(--border-hairline)]">
      <Icon name="Info" size={15} color="var(--text-muted)" className="mt-[1px]" />
      <span className="flex-1 text-[12.5px] leading-[1.5] text-[var(--text-secondary)]">{text}</span>
    </div>
  );
}

function contentPublish(payload: { type: ContentType; title: string; price: number }): Promise<void> {
  return import("@/lib/api/creator-content").then(({ contentApi }) =>
    contentApi.publish({
      type: payload.type,
      title: payload.title,
      meta: `${CONTENT_TYPE_META[payload.type].label} · ${payload.price > 0 ? formatNaira(payload.price) : "free"}`,
      price: payload.price,
    }).then(() => undefined),
  );
}
