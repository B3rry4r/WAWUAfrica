"use client";

import { useState } from "react";
import { CATEGORIES, type CategoryId } from "@/lib/categories";
import { useRouter } from "next/navigation";
import { CONTENT_TYPE_META, type ContentType } from "@/types/content";
import { PLANS } from "@/types/subscription";
import { useCreatorState } from "@/lib/auth/use-creator-state";
import { creatorGates } from "@/lib/auth/gates";
import { formatNaira } from "@/lib/format";
import { FlowHeader } from "@/components/layout/FlowHeader";
import { Button } from "@/components/ui/Button";
import { FilePicker } from "@/components/ui/FilePicker";
import type { UploadedFile } from "@/lib/api/uploads";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { NairaInput } from "@/components/ui/NairaInput";
import { StatusPill } from "@/components/ui/StatusPill";
import { Sheet } from "@/components/ui/Sheet";
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

/**
 * The one line of guidance under each type's file picker.
 *
 * This used to be a `uploadMeta` table carrying a fake filename and a fake
 * size for every type ("stall-pricing-final.mp4", "invoice-starter.xlsx",
 * "248 MB · 12:08"). Nothing read them — FilePicker reports the real file's
 * name and real byte progress — so they were dead fixtures pretending to be
 * state, and one of them advertised a template. Only the note is real.
 */
const UPLOAD_NOTE: Record<ContentType, string> = {
  video: "MP4 or MOV, up to 2 GB. Landscape reads better in the feed.",
  course: "Courses stream lesson by lesson. Buyers get the whole thing.",
  audio: "MP3 or WAV, up to 200 MB. The preview is a 30 to 60 second clip.",
  pdf: "Buyers download the file and keep it. Do not upload anything you do not own the rights to.",
  image: "PNG or JPG, up to 50 MB. Keep it sharp, it is what people buy.",
  // Kept so an already-published piece of this type can still be fixed and
  // resubmitted; the picker no longer offers it (PUBLISHABLE_CONTENT_TYPES).
  template: "Spreadsheets, forms and editable files. Buyers download and keep them.",
};

/** `accept` per content type, so the picker offers the right files. */
const UPLOAD_ACCEPT: Record<ContentType, string> = {
  video: "video/mp4,video/quicktime,video/*",
  course: "video/*,application/pdf,application/zip",
  audio: "audio/mpeg,audio/wav,audio/*",
  pdf: "application/pdf",
  image: "image/png,image/jpeg,image/webp",
  template: ".xlsx,.docx,.pptx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

export interface PublishingWizardProps {
  type: ContentType;
  firstUpload: boolean;
  /**
   * No-charge slots still available on this creator's plan (Basic 1, Pro 2),
   * excluding the piece being written now.
   *
   * The wizard used to model this as the single boolean above, so EVERY
   * upload after the first was forced to be paid — a Pro creator silently lost
   * the second no-charge slot their plan includes. The server has always
   * allowed it (UPLOAD_ALLOWANCE_BY_TIER in the API), so the two disagreed and
   * the UI was the stricter one.
   */
  noChargeSlotsLeft: number;
  /** Set when re-entering the wizard to fix and resubmit a rejected item. */
  resubmit?: { id: string; title: string };
}

export function PublishingWizard({ type, firstUpload, noChargeSlotsLeft, resubmit }: PublishingWizardProps) {
  const router = useRouter();
  const meta = CONTENT_TYPE_META[type];
  const [step, setStep] = useState(0);
  const [paid, setPaid] = useState(!firstUpload);
  // The first upload is forced to ₦0; after that it is a choice, but only
  // while the plan still has a no-charge slot to spend.
  const canChooseNoCharge = !firstUpload && noChargeSlotsLeft > 0;
  const [price, setPrice] = useState(1500);
  const [title, setTitle] = useState(resubmit ? resubmit.title : firstUpload ? "" : "The trader's playbook");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<CategoryId>("business_entrepreneurship");
  const [submitted, setSubmitted] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [discarding, setDiscarding] = useState(false);
  // The real uploaded asset. Publishing is blocked until this exists: the
  // backend requires a URL (CreateContentDto previewAsset is @IsUrl), so an
  // unattached upload previously guaranteed a 400.
  const [asset, setAsset] = useState<UploadedFile | null>(null);
  // A genuinely separate, freely-viewable preview (cover image or sample clip).
  // `previewAsset` is public — the backend returns it to everyone, including
  // anonymous callers — so reusing the paid file here would hand the full
  // asset to anyone who reads the URL. Required for paid pieces.
  const [preview, setPreview] = useState<UploadedFile | null>(null);

  const steps = ["Upload", "Preview", "Details", "Price"];
  const stepLabel = `Step ${step + 1} of 4`;

  // Live creator state, not the session's sign-in-time snapshot: tier decides
  // the split shown on the price step (85/15 vs Pro's 90/10) and slot numbers,
  // and a creator who upgraded after signing in was quoted the wrong one.
  const { creator } = useCreatorState();
  const gates = creatorGates({ creator });
  const tier = gates.tier ?? "basic";
  const tierIsPro = tier === "pro";
  // The plan's own name: `tierIsPro` is a boolean and there are three tiers,
  // so it called every Pro Max creator "Basic".
  const tierName = PLANS[tier].name;
  const keep = PLANS[tier].split;
  const youEarn = Math.round((price * keep) / 100);
  const wawuTakes = price - youEarn;
  const proEarn = Math.round(price * 0.9);
  // The slot this upload would land in, ahead of publishing.
  const nextSlot = Math.min(gates.slotsUsed + 1, gates.slotsTotal);

  const submit = async () => {
    if (publishing) return;
    if (!asset) {
      setPublishError("Attach your file first. Nothing can be published without it.");
      return;
    }
    const isPaid = paid && !firstUpload;
    if (isPaid && !preview) {
      setPublishError("Paid pieces need a preview. Add a cover or short sample so buyers can see what they're paying for.");
      return;
    }
    setPublishing(true);
    setPublishError(null);
    try {
      await contentPublish({
        type,
        title,
        description,
        category,
        price: isPaid ? price : 0,
        // Free pieces are wholly public, so the file may serve as its own
        // preview. Paid pieces must carry a distinct, openly viewable preview.
        previewAssetUrl: preview?.fileUrl ?? asset.fileUrl,
        fullAssetUrl: asset.fileUrl,
      });
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
  // (Upload → Preview → Details → Price) is a literal current-screen
  // index that doesn't map onto the desktop layout, which collapses those
  // into two simultaneous columns with nothing gated behind a "current
  // step". So the desktop pills read logical completion off the same
  // fields the mobile Details/Price steps collect instead of mirroring
  // `step` directly — a step is "done" once its data is filled in, and the
  // first not-yet-filled step is the one shown as current.
  const desktopStepsFilled = [
    asset !== null, // Upload — genuinely attached, not assumed
    title.trim().length > 0, // Details
    firstUpload || !paid || price > 0, // Price — first upload is auto-free; otherwise needs a price once "Paid" is chosen
  ];
  let desktopCurrentStep = desktopStepsFilled.findIndex((filled) => !filled);
  if (desktopCurrentStep === -1) desktopCurrentStep = desktopStepsFilled.length - 1;
  const desktopStepLabels = ["Upload", "Details", "Price"];

  return (
    <>
    <div className="flex flex-col min-h-[100vh] max-w-[var(--mobile-column)] m-0 dt:hidden">
      {/* Back walks the wizard backwards. It used to be FlowHeader's default
          router.back(), which from step 3 threw you out of the upload
          entirely and lost every field — there was no way back to step 2. */}
      <FlowHeader
        title={step === 0 ? (resubmit ? `Fix · ${meta.label}` : meta.label) : steps[step]}
        backLabel={step === 0 ? "Back" : `Back to ${steps[step - 1].toLowerCase()}`}
        onBack={() => {
          if (publishError) {
            setPublishError(null);
            return;
          }
          if (step > 0) {
            setStep(step - 1);
            return;
          }
          if (asset || preview || title.trim() || description.trim()) {
            setDiscarding(true);
            return;
          }
          router.push("/create");
        }}
        right={<span className="text-[12.5px] font-semibold text-[var(--text-muted)] [font-feature-settings:var(--font-feature-tabular)]">{stepLabel}</span>}
      />

      <div className="flex-1 py-[18px] px-[16px] flex flex-col gap-[18px]">
        {publishError ? (
          <ErrorState
            title="Could not submit"
            description={publishError}
            onRetry={submit}
          />
        ) : (
          <>
            {step === 0 ? <UploadStep type={type} asset={asset} onAsset={setAsset} /> : null}
            {step === 1 ? <PreviewStep type={type} isPaid={paid && !firstUpload} preview={preview} onPreview={setPreview} /> : null}
            {step === 2 ? (
              <DetailsStep
                title={title}
                onTitle={setTitle}
                description={description}
                onDescription={setDescription}
                category={category}
                onCategory={setCategory}
              />
            ) : null}
            {step === 3 ? (
              <PriceStep
                firstUpload={firstUpload}
                canChooseNoCharge={canChooseNoCharge}
                noChargeSlotsLeft={noChargeSlotsLeft}
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
              {resubmit ? "Resubmit for review" : firstUpload ? "Publish at ₦0" : "Submit for review"}
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
    <div className="hidden dt:flex dt:h-full dt:min-h-0 dt:flex-col">
      <div className="flex h-[68px] shrink-0 items-center gap-4 border-b border-hairline bg-[rgba(19,19,22,0.86)] px-[26px] backdrop-blur">
        {/* Was a bare router.back() — one click binned a finished upload with
            no warning, and on a direct load of /create/new there was nothing
            behind it to go back to. Now it confirms when there is work to
            lose and always lands on the picker. */}
        <button
          type="button"
          onClick={() => setDiscarding(true)}
          className="flex cursor-pointer items-center gap-[9px] border-none bg-transparent p-0 text-[14px] font-semibold text-text-secondary hover:text-text-primary"
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
        {/* The publish error used to be a bare span wedged into this 68px
            header between two flex spacers, where a full sentence squashed
            the step rail and the button. It now renders as a real alert at
            the top of the money column, next to the fields it names. */}
        {/* "Save draft" (design D7) removed — there is no draft-persistence
            endpoint anywhere in this API layer, so a wired version would
            need to fake success. A dead button with no onClick is worse
            (looks real, does nothing silently); cutting it until a real
            drafts resource exists is the honest option. */}
        <Button size="sm" iconRight="ArrowRight" loading={publishing} onClick={submit}>
          {resubmit ? "Resubmit for review" : firstUpload ? "Publish at ₦0" : "Publish"}
        </Button>
      </div>

      {/*
          A fixed `1fr 420px` split assumed a wide monitor. At 1024–1280 —
          an ordinary laptop, or any screen at Windows' 125%/150% scaling —
          the app Sidebar takes 244px and the rail took 420 of what was
          left, so the upload/details column collapsed to ~280px: a title
          field and 25 category chips in a phone-width strip next to a
          half-empty rail. The rail is now 320px until there is genuinely
          room for the design's 420, and the whole flow is width-capped so
          it does not smear across an ultrawide either.
        */}
        <div className="mx-auto grid min-h-0 w-full max-w-[1560px] flex-1 grid-cols-[minmax(0,1fr)_320px] gap-[20px] overflow-y-auto p-[20px] [@media(min-width:1360px)]:grid-cols-[minmax(0,1fr)_420px] [@media(min-width:1360px)]:gap-[26px] [@media(min-width:1360px)]:p-[26px]">
        <div className="flex min-w-0 flex-col gap-[20px]">
          <div className="flex flex-col gap-[14px] rounded-[var(--radius-card)] border border-hairline bg-card p-[22px]">
            <span className="text-[14px] font-semibold text-text-primary">Your file</span>
            <FilePicker
              folder="content/full"
              accept={UPLOAD_ACCEPT[type]}
              label={asset ? "Replace file" : `Choose your ${meta.label.toLowerCase()} file`}
              hint={UPLOAD_NOTE[type]}
              onUploaded={setAsset}
              onCleared={() => setAsset(null)}
            />
          </div>

          <div className="flex flex-col gap-[16px] rounded-[var(--radius-card)] border border-hairline bg-card p-[22px]">
            <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-text-muted">Details</span>
            <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
            <div className="flex flex-col gap-2">
              <span className="text-[13px] font-semibold text-text-secondary">Description</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What will someone be able to do after watching?"
                className="flex min-h-[74px] resize-none rounded-input border border-hairline bg-input px-4 py-[14px] text-[14.5px] leading-[1.5] text-text-primary font-[var(--font-sans)] placeholder:text-text-muted"
              />
            </div>
            <div className="flex flex-col gap-[9px]">
              <span className="text-[12.5px] font-semibold text-text-secondary">Category</span>
              <span className="text-[12px] leading-[1.5] text-text-muted">
                This is how readers find you in Explore. Pick the one someone browsing for your work would open.
              </span>
              {/*
                Was a stale list of the old post categories (Construction, Sell,
                Event, Opportunity, Research, plus disabled Learn/Question).
                Events and Opportunities do not exist in this product at all,
                and the rest predate the taxonomy, so this now renders the same
                25 categories the mobile step and Explore use.
              */}
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategory(c.id)}
                    className={`rounded-full px-[14px] py-2 text-[13px] ${
                      category === c.id
                        ? "bg-accent font-semibold text-on-accent"
                        : "bg-tag text-text-secondary hover:bg-surface-hover active:bg-surface-press"
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-[16px]">
          {publishError ? (
            <div
              role="alert"
              className="flex items-start gap-[10px] rounded-card border border-[rgba(255,92,92,0.28)] bg-[var(--danger-tint)] px-[14px] py-[13px]"
            >
              <Icon name="TriangleAlert" size={15} color="var(--danger)" className="mt-[1px] shrink-0" />
              <span className="flex-1 text-[12.5px] leading-[1.5] text-text-secondary">{publishError}</span>
            </div>
          ) : null}
          <div className="flex flex-col gap-[14px] rounded-[var(--radius-card)] border border-accent bg-card p-[22px]">
            <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-text-muted">Price</span>
            {firstUpload ? (
              <div className="flex flex-col gap-[11px] rounded-[var(--radius-card)] border border-accent bg-elevated p-[16px]">
                <span className="text-[15px] font-semibold text-text-primary">Your first one goes out at ₦0</span>
                <p className="m-0 text-[13px] leading-[1.5] text-text-secondary">
                  Nobody has bought from you yet. Give this one away, then price everything after it.
                </p>
                <div className="flex">
                  <StatusPill kind="info">₦0 · set for you</StatusPill>
                </div>
              </div>
            ) : (
              <>
                <div className="flex gap-1 rounded-full border border-hairline bg-tag p-1">
                  {["No charge", "Paid"].map((label) => {
                    const active = (label === "Paid") === paid;
                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() => setPaid(label === "Paid")}
                        className={`h-[38px] flex-1 rounded-full border-none text-[13.5px] font-semibold ${
                          active
                            ? "bg-accent text-on-accent"
                            : "bg-transparent text-text-secondary hover:bg-state-hover active:bg-state-press"
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
                        <span>You keep {keep}% on {tierName}</span>
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
                        <span className="text-[12.5px] text-[var(--warning)]">
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
            <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-text-muted">Preview</span>
            <span className="text-[13.5px] leading-[1.5] text-text-secondary">
              You choose the giveaway. The clip, cover or extract buyers get before they pay.
            </span>
            {/* The picker the desktop pane was missing: submit() requires a
                separate preview for paid pieces, so without this control
                desktop creators hit an error naming a field they could not
                see. */}
            <FilePicker
              folder="content/preview"
              accept="image/png,image/jpeg,image/webp,video/mp4,application/pdf"
              label={preview ? "Replace the preview" : "Add a preview"}
              hint={
                desktopPrice > 0
                  ? "Required for paid pieces: a cover or short sample buyers see before paying."
                  : "Optional when the piece is ₦0."
              }
              onUploaded={setPreview}
              onCleared={() => setPreview(null)}
            />
            {/* The 90s / 3 min / None chips that used to sit here set state
                nothing ever submitted — the publish payload carries a preview
                asset URL, not a duration. The FilePicker above is the real
                control. */}
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

    {/* Shared by both widths: leaving an upload half-finished should ask
        first, and should always land on a real screen. */}
    <Sheet
      desktop="modal"
      open={discarding}
      onClose={() => setDiscarding(false)}
      title="Discard this upload?"
      caption="Your file, price and details are not saved anywhere yet. Closing now loses them."
    >
      <div className="flex flex-col gap-[10px]">
        <Button full size="lg" variant="danger" onClick={() => router.push("/create")}>
          Discard it
        </Button>
        <Button full size="lg" variant="secondary" onClick={() => setDiscarding(false)}>
          Keep working on it
        </Button>
      </div>
    </Sheet>
    </>
  );
}

function UploadStep({
  type,
  asset,
  onAsset,
}: {
  type: ContentType;
  asset: UploadedFile | null;
  onAsset: (file: UploadedFile | null) => void;
}) {
  return (
    <>
      <FilePicker
        folder="content/full"
        accept={UPLOAD_ACCEPT[type]}
        label={asset ? "Replace file" : `Choose your ${CONTENT_TYPE_META[type].label.toLowerCase()} file`}
        hint={UPLOAD_NOTE[type]}
        onUploaded={onAsset}
        onCleared={() => onAsset(null)}
      />
      {!asset ? <InfoNote text="Nothing is published until your file finishes uploading." /> : null}
    </>
  );
}

function PreviewStep({
  type,
  isPaid,
  preview,
  onPreview,
}: {
  type: ContentType;
  isPaid: boolean;
  preview: UploadedFile | null;
  onPreview: (f: UploadedFile | null) => void;
}) {
  const isPdf = type === "pdf";
  return (
    <>
      <p className="m-0 text-[14px] leading-[1.5] text-[var(--text-secondary)]">
        Anyone can see this much before paying. Give away enough that they can tell it is good.
      </p>

      {/* A real, separate preview file. This is served publicly, so it must
          never be the paid asset itself — that would make the paywall
          meaningless for anyone who reads the URL. */}
      <FilePicker
        folder="content/preview"
        accept="image/png,image/jpeg,image/webp,video/mp4,application/pdf"
        label={preview ? "Replace the preview" : "Add a preview"}
        hint={
          isPaid
            ? "Required for paid pieces: a cover image or a short sample. Buyers see this before paying."
            : "Optional at ₦0. Your file is already public."
        }
        onUploaded={onPreview}
        onCleared={() => onPreview(null)}
      />

      {isPdf ? (
        <div className="flex flex-col gap-[13px] p-[16px] rounded-[var(--radius-card)] bg-[var(--surface-card)] border border-[var(--border-hairline)]">
          <span className="text-[14px] font-semibold text-[var(--text-primary)]">Which pages people see before paying</span>
          {/* Was a "pages shown at no charge" slider stuck on 4: page-range previews
              aren't part of the publish payload (CreateContentDto carries a
              previewAsset URL, nothing page-based), so the honest control is
              the preview file above — upload the extract you want to give away. */}
          <span className="text-[12.5px] leading-[1.5] text-[var(--text-muted)]">
            Upload the extract you want to give away as the preview above. The full file stays locked until someone buys.
          </span>
        </div>
      ) : null}

      <div className="flex flex-col gap-[11px]">
        <span className="text-[13px] font-semibold text-[var(--text-secondary)]">How it will look</span>
        <div className="flex gap-[9px]">
          <div className="flex-1 aspect-[3_/_4] rounded-[10px] bg-[repeating-linear-gradient(135deg,_var(--surface-tag)_0_12px,_var(--surface-card)_12px_24px)] border border-[var(--border-hairline)]" />
          <div className="flex-1 aspect-[3_/_4] rounded-[10px] bg-[repeating-linear-gradient(135deg,_var(--surface-tag)_0_12px,_var(--surface-card)_12px_24px)] border border-[var(--border-hairline)]" />
          <div className="relative flex-1 aspect-[3_/_4] rounded-[10px] overflow-hidden border border-[var(--border-hairline)]">
            <div className="absolute inset-0 bg-[repeating-linear-gradient(135deg,_var(--surface-tag)_0_12px,_var(--surface-card)_12px_24px)] blur-[8px] scale-[1.12]" />
            <div className="absolute inset-0 bg-[var(--locked-veil)] grid place-items-center">
              <Icon name="Lock" size={16} strokeWidth={2.2} color="var(--text-on-accent)" />
            </div>
          </div>
        </div>
      </div>

      <InfoNote text={type === "audio" ? "For audio the preview is a 30 to 60 second clip. For a course it is the first lesson." : "For audio the preview is a 30 to 60 second clip. For a course it is the first lesson."} />
    </>
  );
}

/**
 * The create entry point for the category taxonomy. Every one of the 25
 * categories a reader can browse has to be selectable here, or it is a filter
 * nothing can ever land in. The value sent to the API is the id, not the
 * display name, so renaming a category later never orphans published content.
 */

function DetailsStep({
  title,
  onTitle,
  description,
  onDescription,
  category,
  onCategory,
}: {
  title: string;
  onTitle: (v: string) => void;
  description: string;
  onDescription: (v: string) => void;
  category: CategoryId;
  onCategory: (v: CategoryId) => void;
}) {
  return (
    <div className="flex flex-col gap-[16px]">
      <Input label="Title" value={title} onChange={(e) => onTitle(e.target.value)} />
      <div className="flex flex-col gap-[8px]">
        <span className="text-[13px] font-semibold text-[var(--text-secondary)]">Description</span>
        <textarea
          value={description}
          onChange={(e) => onDescription(e.target.value)}
          placeholder="Everything I learned running a stall for nine years: stock, margin, spoilage, and what to do on a slow day."
          className="flex min-h-[104px] py-[14px] px-[16px] rounded-[var(--radius-input)] bg-[var(--surface-input)] border border-[var(--border-hairline)] text-[14.5px] leading-[1.5] text-[var(--text-primary)] resize-none font-[var(--font-sans)] placeholder:text-[var(--text-muted)]"
        />
        <span className="text-[12px] text-[var(--text-muted)]">Say who it is for and what they will be able to do after.</span>
      </div>
      <div className="flex flex-col gap-[8px]">
        <span className="text-[13px] font-semibold text-[var(--text-secondary)]">Category</span>
        <div className="relative">
          <select
            value={category}
            onChange={(e) => onCategory(e.target.value as CategoryId)}
            className="flex w-full items-center gap-[10px] h-[52px] py-0 px-[16px] rounded-[var(--radius-input)] bg-[var(--surface-input)] border border-[var(--border-hairline)] text-[var(--text-primary)] text-[15px] cursor-pointer appearance-none font-[var(--font-sans)]"
          >
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
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
      {/* The tag chips that used to sit here were hardcoded ("trading",
          "pricing") and had no editor and no field in the publish payload —
          removed rather than left looking editable. Restore when the publish
          call carries tags. */}
    </div>
  );
}

function PriceStep({
  firstUpload,
  canChooseNoCharge,
  noChargeSlotsLeft,
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
  canChooseNoCharge: boolean;
  noChargeSlotsLeft: number;
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
          <span className="grid place-items-center w-[46px] h-[46px] rounded-[14px] bg-[var(--accent-tint)] border border-[var(--border-accent)]">
            <Icon name="Gift" size={20} strokeWidth={2} color="var(--accent)" />
          </span>
          <div className="flex flex-col gap-[7px]">
            <span className="text-[19px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">Your first one goes out at ₦0</span>
            <p className="m-0 text-[13.5px] leading-[1.5] text-[var(--text-secondary)]">
              Nobody has bought from you yet, so nobody knows the work is worth paying for. Give this one away, then price everything after it.
            </p>
          </div>
          <div className="flex">
            <StatusPill kind="info">₦0 · set for you</StatusPill>
          </div>
        </div>
      ) : null}

      {/* Not the first upload, but the plan's no-charge slots are spent. Say so,
          rather than presenting a dead control with no explanation. */}
      {!firstUpload && noChargeSlotsLeft <= 0 ? (
        <p className="m-0 text-[13px] leading-[1.5] text-[var(--text-muted)]">
          Your plan&rsquo;s no-charge uploads are used up, so this one carries a price. Moving up to Pro adds another.
        </p>
      ) : null}

      <div className={`flex gap-[4px] p-[4px] rounded-[999px] bg-[var(--surface-tag)] border border-[var(--border-hairline)] ${firstUpload ? "opacity-[0.55]" : "opacity-100"}`}>
        {["No charge", "Paid"].map((label) => {
          const active = (label === "Paid") === paid;
          // The first upload can only be ₦0; once the plan's no-charge slots
          // are gone, only "Paid" is left.
          const locked = label === "Paid" ? firstUpload : !firstUpload && !canChooseNoCharge;
          return (
            <button
              key={label}
              type="button"
              disabled={locked}
              onClick={() => onPaid(label === "Paid")}
              className={`flex-1 grid place-items-center h-[40px] rounded-[999px] border-[none] text-[13.5px] font-semibold font-[var(--font-sans)] ${
                active
                  ? "bg-[var(--accent)] text-[var(--text-on-accent)]"
                  : locked
                    ? "bg-transparent text-[var(--text-disabled)]"
                    : "bg-transparent text-[var(--text-secondary)] hover:bg-state-hover active:bg-state-press"
              } ${locked ? "cursor-not-allowed" : "cursor-pointer"}`}
            >
              {locked ? (
                <span className="inline-flex items-center gap-[7px]">
                  <Icon name="Lock" size={14} strokeWidth={2.2} color="var(--text-disabled)" />
                  {label}
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
            <span className="grid place-items-center w-[22px] h-[22px] rounded-[999px] bg-[var(--accent)] text-[var(--text-on-accent)] text-[11px] font-bold shrink-0">1</span>
            <span className="flex-1 text-[13px] leading-[1.45] text-[var(--text-secondary)]">This goes live at ₦0 and starts pulling people to your profile.</span>
          </div>
          <div className="flex gap-[11px]">
            <span className="grid place-items-center w-[22px] h-[22px] rounded-[999px] bg-[var(--accent)] text-[var(--text-on-accent)] text-[11px] font-bold shrink-0">2</span>
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
                  On Pro you would keep {formatNaira(proEarn)}, 90% instead of 85%.
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
    <div className="mx-auto flex min-h-[100vh] w-full max-w-[var(--mobile-column)] flex-col dt:my-0 dt:max-w-[560px] dt:justify-center">
      <div className="flex-1 flex flex-col items-center justify-center gap-[18px] py-[40px] px-[28px] text-center">
        <span className="grid place-items-center w-[88px] h-[88px] rounded-[999px] bg-[var(--warning-tint)] border border-[rgba(255,183,3,0.3)]">
          <Icon name="Clock" size={36} strokeWidth={2.2} color="var(--warning)" />
        </span>
        <h2 className="m-0 text-[26px] font-bold tracking-[-0.03em] text-[var(--text-primary)]">Under review</h2>
        <p className="m-0 text-[15px] leading-[1.55] text-[var(--text-secondary)] max-w-[290px]">
          Usually within a day. We will notify you when it goes live.
        </p>
        <div className="flex gap-[13px] w-full p-[15px] rounded-[var(--radius-card)] bg-[var(--surface-card)] border border-[var(--border-hairline)] text-left">
          <div className="w-[52px] h-[66px] rounded-[10px] shrink-0 bg-[repeating-linear-gradient(135deg,_var(--surface-tag)_0_12px,_var(--surface-card)_12px_24px)] border border-[var(--border-hairline)]" />
          <div className="flex-1 min-w-0 flex flex-col gap-[5px]">
            <span className="text-[14.5px] font-semibold text-[var(--text-primary)]">{title || "Untitled"}</span>
            <span className="text-[12.5px] text-[var(--text-secondary)]">
              {CONTENT_TYPE_META[type].label} · {price > 0 ? `${formatNaira(price)}` : "No charge"}
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

function contentPublish(payload: {
  type: ContentType;
  title: string;
  description: string;
  category: string;
  price: number;
  previewAssetUrl: string;
  fullAssetUrl: string;
}): Promise<void> {
  return import("@/lib/api/creator-content").then(({ contentApi }) =>
    contentApi.publish({
      type: payload.type,
      title: payload.title,
      meta: `${CONTENT_TYPE_META[payload.type].label} · ${formatNaira(payload.price)}`,
      price: payload.price,
      description: payload.description,
      category: payload.category,
      previewAssetUrl: payload.previewAssetUrl,
      fullAssetUrl: payload.fullAssetUrl,
    }).then(() => undefined),
  );
}
