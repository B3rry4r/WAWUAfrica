"use client";

import { useState } from "react";
import { CATEGORIES, type CategoryId } from "@/lib/categories";
import { useRouter } from "next/navigation";
import { CONTENT_TYPE_META, type ContentType } from "@/types/content";
import { useCreatorState } from "@/lib/auth/use-creator-state";
import { creatorGates } from "@/lib/auth/gates";
import { creatorSplitRate, formatNaira } from "@/lib/format";
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
import { ContentThumb } from "@/components/ui/ContentThumb";
import { TaxonomyPicker } from "@/components/ui";

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
  /** Set when re-entering the wizard to fix and resubmit a rejected item. */
  resubmit?: { id: string; title: string };
}

export function PublishingWizard({ type, resubmit }: PublishingWizardProps) {
  const router = useRouter();
  const meta = CONTENT_TYPE_META[type];
  const [step, setStep] = useState(0);
  // Every listing carries a price (build brief B2). There is no ₦0 path here
  // any more: no first-upload allowance, no plan slots, no Free/Paid toggle.
  // `null` means "not set yet" and is what blocks submission; no figure is
  // seeded, because the product does not name a default, a floor or a ceiling.
  const [price, setPrice] = useState<number | null>(null);
  const [title, setTitle] = useState(resubmit ? resubmit.title : "");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<CategoryId>("business_entrepreneurship");
  // Specialization ids from the C1 taxonomy, persisted by POST /api/hub/content
  // (ContentPiece.specializations). `category` above is the deprecated flat
  // list and still goes with them: rows published before this column existed
  // only carry a category, so the backend keeps requiring one.
  const [specializations, setSpecializations] = useState<string[]>([]);
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
  // asset to anyone who reads the URL. Required on every piece, since every
  // piece is sold.
  const [preview, setPreview] = useState<UploadedFile | null>(null);

  const steps = ["Upload", "Preview", "Details", "Price"];
  const stepLabel = `Step ${step + 1} of 4`;

  // Live creator state, not the session's sign-in-time snapshot, because the
  // slot count on this screen has to be current.
  //
  // The split no longer comes from here at all. creatorSplitRate() takes no
  // argument and returns the single 85/15 rate: the 90/10 went with the Pro
  // plan that sold it, and there is no tier left for it to key off.
  const { creator } = useCreatorState();
  const gates = creatorGates({ creator });
  const keep = Math.round(creatorSplitRate() * 100);
  const priceValue = price ?? 0;
  /** The one publish condition the price field carries: greater than zero. */
  const priceSet = priceValue > 0;
  const youEarn = Math.round((priceValue * keep) / 100);
  const wawuTakes = priceValue - youEarn;
  // The slot this upload would land in, ahead of publishing. A resubmitted
  // piece already owns the slot it was first published into, so it must not be
  // counted against the cap a second time.
  const nextSlot = Math.min(resubmit ? Math.max(gates.slotsUsed, 1) : gates.slotsUsed + 1, gates.slotsTotal);

  const submit = async () => {
    if (publishing) return;
    if (!asset) {
      setPublishError("Attach your file first. Nothing can be published without it.");
      return;
    }
    if (!priceSet) {
      setPublishError("Set a price above ₦0. Every listing is sold, so a price is required.");
      return;
    }
    if (!preview) {
      setPublishError("Add a preview. Buyers need a cover or short sample to see what they are paying for.");
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
        specializations,
        price: priceValue,
        // The preview is served publicly, so it is always a separate file:
        // reusing the sold asset here would hand the whole thing to anyone who
        // reads the URL.
        previewAssetUrl: preview.fileUrl,
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
    return (
      <Submitted
        type={type}
        title={title}
        price={priceValue}
        previewUrl={preview?.fileUrl}
      />
    );
  }

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
    priceSet, // Price — always required now, and never satisfied by ₦0
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
            {step === 1 ? <PreviewStep type={type} preview={preview} onPreview={setPreview} /> : null}
            {step === 2 ? (
              <DetailsStep
                title={title}
                onTitle={setTitle}
                description={description}
                onDescription={setDescription}
                specializations={specializations}
                onSpecializations={setSpecializations}
              />
            ) : null}
            {step === 3 ? (
              <PriceStep
                price={price}
                onPrice={setPrice}
                keep={keep}
                youEarn={youEarn}
                wawuTakes={wawuTakes}
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
            <Button full size="lg" loading={publishing} disabled={!priceSet} onClick={submit}>
              {resubmit ? "Resubmit for review" : "Submit for review"}
            </Button>
            <span className="text-[12px] text-[var(--text-muted)] self-center">
              {priceSet
                ? resubmit
                  ? "Reviewed again before it goes live."
                  : "Reviewed before it goes live, same as any upload."
                : "Set a price above ₦0 to send this for review."}
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
        <Button size="sm" iconRight="ArrowRight" loading={publishing} disabled={!priceSet} onClick={submit}>
          {resubmit ? "Resubmit for review" : "Publish"}
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
                Was 25 rounded chips in a flex-wrap: the pill wall the product
                owner rejected as unprofessional, rendering a flat taxonomy
                that C1 replaced. Now the real Role -> Category ->
                Specialization picker over all 557 entries, searchable and
                progressively disclosed. Capped at three because this is what
                a buyer filters on, and a piece tagged with ten things is
                tagged with none.
              */}
              <TaxonomyPicker
                role="creator"
                value={specializations}
                onChange={setSpecializations}
                max={3}
                label="What is this?"
                hint="Pick up to three. This is how buyers find the piece in search and browse."
              />
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
            <NairaInput
              label="What buyers pay"
              value={price}
              onValueChange={setPrice}
              presets={[500, 1000, 1500, 2500]}
              hint={`Most pieces in this category sell between ${formatNaira(500)} and ${formatNaira(2500)}.`}
              error={price !== null && !priceSet ? "A price has to be more than ₦0." : undefined}
            />
            {priceSet ? (
              <div className="flex flex-col gap-[9px] border-t border-hairline pt-[14px]">
                <div className="flex justify-between text-[13.5px] text-text-secondary">
                  <span>You keep {keep}%</span>
                  <span className="font-bold text-text-primary [font-feature-settings:var(--font-feature-tabular)]">
                    {formatNaira(youEarn)}
                  </span>
                </div>
                <div className="flex items-center gap-[9px] pt-1">
                  <Icon name="Info" size={15} color="var(--warning)" />
                  <span className="text-[12.5px] text-[var(--warning)]">
                    Uses slot {nextSlot} of {gates.slotsTotal}
                  </span>
                </div>
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-hairline bg-card p-[22px]">
            <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-text-muted">Preview</span>
            <span className="text-[13.5px] leading-[1.5] text-text-secondary">
              You choose what buyers see before they pay: the clip, cover or extract.
            </span>
            {/* The picker the desktop pane was missing: submit() requires a
                separate preview, so without this control desktop creators hit
                an error naming a field they could not see. */}
            <FilePicker
              folder="content/preview"
              accept="image/png,image/jpeg,image/webp,video/mp4,application/pdf"
              label={preview ? "Replace the preview" : "Add a preview"}
              hint="Required: a cover or short sample buyers see before paying."
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
              state="locked"
              title={title || meta.label}
              price={priceValue}
              contentType={type}
              count={meta.label}
              ratio={previewRatio[type]}
              previewUrl={preview?.fileUrl}
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
  preview,
  onPreview,
}: {
  type: ContentType;
  preview: UploadedFile | null;
  onPreview: (f: UploadedFile | null) => void;
}) {
  const isPdf = type === "pdf";
  // Only an image can be drawn as a thumbnail here. A video or PDF preview is
  // uploaded and real, but has no frame to show without decoding it, so those
  // are named in words below rather than faked with a picture.
  // ContentThumb draws images AND video first frames, so anything with a
  // visual goes to it. Only a PDF has no frame to show.
  const previewVisual =
    preview && !/\.pdf$/i.test(preview.name) ? preview.fileUrl : null;
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
        hint="Required: a cover image or a short sample. Buyers see this before paying."
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
        <span className="text-[13px] font-semibold text-[var(--text-secondary)]">
          {preview ? "How it will look" : "How it will look once you add a preview"}
        </span>
        {/*
          THE CREATOR'S OWN FILE, once there is one.

          These three cards used to be striped placeholders in every state, so
          somebody who had just uploaded a cover still saw hatching and
          reasonably asked whether they were meant to see their own work here.
          The first two now show the real preview, and the third shows it
          blurred behind the lock, which is exactly what a buyer sees before
          paying. The placeholders remain for the state that genuinely has
          nothing to show yet.
        */}
        <div className="flex gap-[9px]">
          {[0, 1].map((i) => (
            <ContentThumb key={i} src={previewVisual} alt="" rounded="10px" className="aspect-[3/4] flex-1" />
          ))}
          <ContentThumb src={previewVisual} alt="" locked rounded="10px" className="aspect-[3/4] flex-1" />
        </div>
        {preview && !previewVisual ? (
          <span className="text-[12px] leading-[1.45] text-[var(--text-muted)]">
            {preview.name} is uploaded. A PDF has no frame to show here, but buyers
            will get it as the preview.
          </span>
        ) : null}
      </div>

      {/* This was a ternary whose two branches were the same sentence, so it
          told an audio creator about courses and a course creator about audio.
          It now says the one thing that applies. */}
      <InfoNote
        text={
          type === "audio"
            ? "For audio the preview is a 30 to 60 second clip."
            : type === "course"
              ? "For a course the preview is the first lesson."
              : "Buyers see the preview before paying. The full file stays locked until they buy."
        }
      />
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
  specializations,
  onSpecializations,
}: {
  title: string;
  onTitle: (v: string) => void;
  description: string;
  onDescription: (v: string) => void;
  specializations: readonly string[];
  onSpecializations: (v: string[]) => void;
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
      {/*
        Was a native <select> over the deprecated flat 25-category list. The
        C1 taxonomy is 557 specializations, and a native select over that is
        a scroll wheel with no search: the same unusable shape as the pill
        wall, just vertical. Same picker as the desktop column, so the two
        cannot drift.
      */}
      <TaxonomyPicker
        role="creator"
        value={specializations}
        onChange={onSpecializations}
        max={3}
        label="What is this?"
        hint="Pick up to three. This is how buyers find the piece in search and browse."
      />
      {/* The tag chips that used to sit here were hardcoded ("trading",
          "pricing") and had no editor and no field in the publish payload —
          removed rather than left looking editable. Restore when the publish
          call carries tags. */}
    </div>
  );
}

function PriceStep({
  price,
  onPrice,
  keep,
  youEarn,
  wawuTakes,
}: {
  price: number | null;
  onPrice: (v: number | null) => void;
  keep: number;
  youEarn: number;
  wawuTakes: number;
}) {
  // Greater than zero is the whole rule. No floor, no ceiling, no default:
  // the product names none of those, so this step does not invent one.
  const priceSet = (price ?? 0) > 0;
  return (
    <>
      <p className="m-0 text-[13.5px] leading-[1.5] text-[var(--text-secondary)]">
        Everything published here is sold, so this piece needs a price before it can go for review.
      </p>

      <NairaInput
        label="Price per sale"
        value={price}
        onValueChange={onPrice}
        presets={[500, 1000, 1500, 2500]}
        hint={`Most PDFs on WAWU sell between ${formatNaira(500)} and ${formatNaira(2000)}.`}
        error={price !== null && !priceSet ? "A price has to be more than ₦0." : undefined}
      />

      {priceSet ? (
        <div className="flex flex-col gap-[12px] p-[18px] rounded-[var(--radius-card)] bg-[var(--surface-elevated)] border border-[var(--border-accent)]">
          <span className="text-[11px] font-bold tracking-[0.06em] uppercase text-[var(--text-muted)]">You earn per sale</span>
          <span className="text-[34px] font-bold tracking-[-0.035em] leading-[1] [font-feature-settings:var(--font-feature-tabular)]">
            {formatNaira(youEarn)}
          </span>
          <div className="flex items-center gap-[10px] pt-[13px] border-t border-t-[var(--border-hairline)]">
            <span className="flex-1 text-[13px] text-[var(--text-secondary)]">Buyer pays</span>
            <span className="text-[13.5px] font-semibold [font-feature-settings:var(--font-feature-tabular)]">{formatNaira(price ?? 0)}</span>
          </div>
          <div className="flex items-center gap-[10px]">
            <span className="flex-1 text-[13px] text-[var(--text-secondary)]">WAWU takes {100 - keep}%</span>
            <span className="text-[13.5px] font-semibold text-[var(--text-muted)] [font-feature-settings:var(--font-feature-tabular)]">−{formatNaira(wawuTakes)}</span>
          </div>
        </div>
      ) : null}
    </>
  );
}

function Submitted({
  type,
  title,
  price,
  previewUrl,
}: {
  type: ContentType;
  title: string;
  price: number;
  previewUrl?: string | null;
}) {
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
          {/* The cover they just uploaded, which is the screen the product
              owner asked about: this was a bare gradient, so the last thing a
              creator saw after publishing was a placeholder of their own work. */}
          <ContentThumb src={previewUrl} alt="" rounded="10px" className="h-[66px] w-[52px] shrink-0" />
          <div className="flex-1 min-w-0 flex flex-col gap-[5px]">
            <span className="text-[14.5px] font-semibold text-[var(--text-primary)]">{title || "Untitled"}</span>
            <span className="text-[12.5px] text-[var(--text-secondary)]">
              {CONTENT_TYPE_META[type].label} · {formatNaira(price)}
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
  specializations: string[];
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
      specializations: payload.specializations,
      previewAssetUrl: payload.previewAssetUrl,
      fullAssetUrl: payload.fullAssetUrl,
    }).then(() => undefined),
  );
}
