"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button, FilePicker, Icon, Input, TaxonomyPicker } from "@/components/ui";
import type { IconName } from "@/components/ui";
import type { UploadedFile } from "@/lib/api/uploads";
import { uploadFile, UploadError } from "@/lib/api/uploads";
import { createPiece, readPriceList, releaseUpload, sentenceFor } from "@/lib/api/site-upload";
import { creatorSplitPercent } from "@/lib/format";
import { shrinkImage, ShrinkError } from "@/lib/site-upload/shrink-image";
import {
  COVER_ACCEPT,
  COVER_MAX_BYTES,
  COVER_TOO_LARGE,
  KIND_ACCEPT,
  KIND_HINT,
  KIND_LABEL,
  KIND_NOUN,
  DRAFT_KEY,
  SITE_KINDS,
  nairaText,
  sizeText,
  type SiteKind,
} from "@/lib/site-upload/rules";
import { useUploadAccess } from "./UploadAccess";

const KIND_ICON: Record<SiteKind, IconName> = { video: "Video", audio: "Music", pdf: "FileText", image: "Image" };

const STEPS = ["File", "Cover", "Details", "Price"] as const;

type Pricing = "paid" | "none";

/**
 * Upload, as the join-only site draws it (WEB-UPLOAD, R-126). Four steps: the file, the cover, the details and the
 * price. It follows the app's rules, which the Hub enforces for this client:
 *  - the price is picked from the Hub's price list, never typed (a price off the list cannot be sent);
 *  - a piece can be at no charge (R-8);
 *  - there is no preview step: the Hub cuts the preview of audio, video and PDF; a picture sends its own smaller copy,
 *    which this makes itself;
 *  - there is no course.
 * Every call it makes carries the `site` marker (src/lib/api/site-upload.ts, src/lib/api/uploads.ts).
 */
export function UploadWizard() {
  const { reload } = useUploadAccess();
  const [step, setStepState] = useState(0);
  const [restored, setRestored] = useState(false);
  const [kind, setKind] = useState<SiteKind>("video");
  const [asset, setAsset] = useState<UploadedFile | null>(null);
  const pickedFile = useRef<File | null>(null);
  const [cover, setCover] = useState<UploadedFile | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [pricing, setPricing] = useState<Pricing>("paid");
  const [price, setPrice] = useState<number | null>(null);
  const [prices, setPrices] = useState<number[] | null>(null);
  const [pricesError, setPricesError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  /*
    THE STEP LIVES IN THE BROWSER'S HISTORY. Moving forward pushes an entry (?step=n); the Back and Forward buttons of the
    browser, and this screen's own Back button, then move one step and the page keeps everything typed and uploaded: the state
    below is never reset by a step change. Without this, Back on any step left for My uploads and lost the draft.
  */
  const goTo = useCallback((next: number) => {
    setStepState(next);
    try {
      const url = new URL(window.location.href);
      if (next === 0) url.searchParams.delete("step");
      else url.searchParams.set("step", String(next));
      window.history.pushState({ wizardStep: next }, "", `${url.pathname}${url.search}`);
    } catch {
      // history unavailable: the step still changes, only the Back button is not tied to it
    }
  }, []);
  const back = useCallback(() => {
    if (step > 0) window.history.back();
  }, [step]);

  useEffect(() => {
    // A reload or a pasted ?step= address starts at the first step, with the draft restored below.
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.has("step")) {
        url.searchParams.delete("step");
        window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}`);
      }
    } catch {
      // nothing to tidy
    }
    const onPop = () => {
      const n = Number(new URL(window.location.href).searchParams.get("step") ?? "0");
      setStepState(Number.isInteger(n) && n >= 0 && n <= 3 ? n : 0);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // The draft: what was typed and uploaded stays for this tab, so leaving and coming back loses nothing. The picked
  // picture file itself cannot be kept, so a picture piece asks for the picture again.
  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(DRAFT_KEY);
      if (raw) {
        const d = JSON.parse(raw) as {
          kind: SiteKind; asset: UploadedFile | null; cover: UploadedFile | null; title: string; description: string;
          specializations: string[]; pricing: Pricing; price: number | null;
        };
        if (SITE_KINDS.includes(d.kind)) {
          setKind(d.kind);
          // The picked picture file cannot be kept, so a picture draft cannot send its uploaded file: give that file back.
          if (d.kind === "image" && d.asset) void releaseUpload(d.asset.key).catch(() => undefined);
          setAsset(d.kind === "image" ? null : d.asset);
          setCover(d.cover);
          setTitle(d.title ?? "");
          setDescription(d.description ?? "");
          setSpecializations(d.specializations ?? []);
          setPricing(d.pricing === "none" ? "none" : "paid");
          setPrice(d.price ?? null);
          if (d.asset || d.cover || d.title || d.description) setRestored(true);
        }
      }
    } catch {
      // no storage: the draft just lives in the page
    }
  }, []);
  const draftReady = useRef(false);
  useEffect(() => {
    if (!draftReady.current) {
      draftReady.current = true;
      return;
    }
    try {
      if (done) window.sessionStorage.removeItem(DRAFT_KEY);
      else window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ kind, asset, cover, title, description, specializations, pricing, price }));
    } catch {
      // no storage
    }
  }, [kind, asset, cover, title, description, specializations, pricing, price, done]);

  const startAgain = async () => {
    // Files already uploaded for the draft count in the person's storage until a piece uses them or they are given back.
    for (const f of [asset, cover]) if (f) await releaseUpload(f.key).catch(() => undefined);
    try {
      window.sessionStorage.removeItem(DRAFT_KEY);
    } catch {
      // no storage
    }
    setAsset(null);
    pickedFile.current = null;
    setCover(null);
    setTitle("");
    setDescription("");
    setSpecializations([]);
    setPricing("paid");
    setPrice(null);
    setRestored(false);
  };

  const loadPrices = useCallback(() => {
    setPricesError(null);
    readPriceList()
      .then((list) => {
        if (list.length === 0) setPricesError("The price list is empty right now. Try again in a moment.");
        setPrices(list);
      })
      .catch((e) => setPricesError(sentenceFor(e)));
  }, []);

  useEffect(() => {
    if (step === 3 && prices === null && pricesError === null) loadPrices();
  }, [step, prices, pricesError, loadPrices]);

  const chooseKind = (next: SiteKind) => {
    if (next === kind) return;
    setKind(next);
    if (asset) void releaseUpload(asset.key).catch(() => undefined);
    setAsset(null);
    pickedFile.current = null;
  };

  const detailsOk = title.trim().length > 0 && description.trim().length > 0;
  const priceOk = pricing === "none" || (price !== null && (prices ?? []).includes(price));
  const keep = creatorSplitPercent();

  const send = async () => {
    if (!asset || sending || !detailsOk || !priceOk) return;
    setSending(true);
    setSendError(null);
    try {
      let previewAsset: string | undefined;
      // A picture sold for a price needs its own smaller copy as the preview. At no charge the whole piece is open, so none.
      if (kind === "image" && pricing === "paid") {
        const file = pickedFile.current;
        if (!file) throw new ShrinkError("Choose your picture again.");
        const small = await shrinkImage(file);
        const uploaded = await uploadFile(small, "content/preview", undefined, undefined, { client: "site" });
        previewAsset = uploaded.fileUrl;
      }
      await createPiece({
        contentType: kind,
        title: title.trim(),
        description: description.trim(),
        category: "business_entrepreneurship",
        specializations,
        accessType: pricing === "paid" ? "paid" : "free",
        price: pricing === "paid" ? (price ?? 0) : 0,
        fullAsset: asset.fileUrl,
        ...(previewAsset ? { previewAsset } : {}),
        ...(cover ? { coverAsset: cover.fileUrl } : {}),
      });
      // The places are read again when the person leaves this screen, not now: a piece that fills the
      // last place would otherwise swap this screen for "places are full" before they see it was sent.
      setDone(true);
    } catch (e) {
      setSendError(e instanceof UploadError || e instanceof ShrinkError ? e.message : sentenceFor(e));
    } finally {
      setSending(false);
    }
  };

  if (done) {
    return (
      <section className="flex flex-col gap-5 rounded-card border border-hairline bg-card p-6 text-center" aria-label="Sent for review">
        <span className="mx-auto grid h-[72px] w-[72px] place-items-center rounded-button border border-decor bg-decor-tint">
          <Icon name="Check" size={32} color="var(--accent)" strokeWidth={2.6} />
        </span>
        <div className="flex flex-col gap-2">
          <h2 className="m-0 text-[24px] font-bold tracking-[-0.025em] text-text-primary">Sent for review</h2>
          <p className="m-0 text-[14.5px] leading-[1.55] text-text-secondary">
            We check every piece before it goes live. Once it is approved, it goes live when you open your wallet in the WAWU app.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button full variant="secondary" size="lg" href="/create/library">
            My uploads
          </Button>
          <Button
            full
            size="lg"
            onClick={() => {
              reload();
              setDone(false);
              setStepState(0);
              try {
                const u = new URL(window.location.href);
                u.searchParams.delete("step");
                window.history.replaceState(window.history.state, "", `${u.pathname}${u.search}`);
              } catch {
                // nothing to tidy
              }
              setAsset(null);
              pickedFile.current = null;
              setCover(null);
              setTitle("");
              setDescription("");
              setSpecializations([]);
              setPricing("paid");
              setPrice(null);
              setSendError(null);
            }}
          >
            Upload another
          </Button>
        </div>
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <h1 className="m-0 text-[26px] font-bold leading-[1.15] tracking-[-0.03em] text-text-primary">Upload a piece</h1>
        <ol className="m-0 flex list-none gap-2 p-0" aria-label="Steps">
          {STEPS.map((label, i) => (
            <li key={label} className="flex flex-1 flex-col gap-1.5" aria-current={i === step ? "step" : undefined}>
              <span className={`h-[4px] rounded-full ${i <= step ? "bg-accent" : "bg-tag"}`} />
              <span className={`text-[12px] font-semibold ${i === step ? "text-text-primary" : "text-text-muted"}`}>
                {i + 1}. {label}
              </span>
            </li>
          ))}
        </ol>
      </div>

      <section className="flex flex-col gap-5 rounded-card border border-hairline bg-card p-4 sm:p-6">
        {step === 0 ? (
          <>
            <div className="flex flex-col gap-3">
              <span className="text-[13px] font-semibold text-text-secondary">What are you uploading?</span>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4" role="radiogroup" aria-label="Kind of piece">
                {SITE_KINDS.map((k) => {
                  const on = k === kind;
                  return (
                    <button
                      key={k}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => chooseKind(k)}
                      className={`flex h-[84px] flex-col items-center justify-center gap-2 rounded-input border text-[14px] font-semibold transition-colors ${
                        on
                          ? "border-selected bg-decor-tint text-text-primary"
                          : "border-hairline bg-tag text-text-secondary hover:bg-surface-hover active:bg-surface-press"
                      }`}
                    >
                      <Icon name={KIND_ICON[k]} size={22} color={on ? "var(--accent)" : "var(--text-secondary)"} strokeWidth={2} />
                      {KIND_LABEL[k]}
                    </button>
                  );
                })}
              </div>
            </div>
            {restored ? (
              <div className="flex items-start justify-between gap-3 rounded-input border border-hairline bg-tag px-3.5 py-3">
                <span className="text-[13px] leading-[1.45] text-text-secondary">
                  We kept what you had started. {kind === "image" ? "Choose your picture again to continue." : "Your file and details are still here."}
                </span>
                <button type="button" onClick={startAgain} className="shrink-0 text-[13px] font-semibold text-accent hover:text-text-primary">
                  Start again
                </button>
              </div>
            ) : null}
            {asset ? (
              <Attached file={asset} onRemove={() => { void releaseUpload(asset.key).catch(() => undefined); setAsset(null); pickedFile.current = null; }} />
            ) : (
            <FilePicker
              key={kind}
              folder="content/full"
              accept={KIND_ACCEPT[kind]}
              label={asset ? "Replace file" : `Choose your ${KIND_NOUN[kind]} file`}
              hint={KIND_HINT[kind]}
              client="site"
              onPicked={(f) => {
                pickedFile.current = f;
              }}
              onUploaded={setAsset}
              onCleared={() => {
                setAsset(null);
                pickedFile.current = null;
              }}
            />
            )}
            <Button full size="lg" iconRight="ArrowRight" disabled={!asset} onClick={() => goTo(1)}>
              {asset ? "Next: cover" : "Choose a file to continue"}
            </Button>
          </>
        ) : null}

        {step === 1 ? (
          <>
            <div className="flex flex-col gap-1.5">
              <h2 className="m-0 text-[18px] font-bold tracking-[-0.02em] text-text-primary">Add a cover</h2>
              <p className="m-0 text-[14px] leading-[1.5] text-text-secondary">
                The picture people see first. A cover is optional, and you can add one later in the app.
              </p>
            </div>
            {cover ? (
              <Attached file={cover} onRemove={() => { void releaseUpload(cover.key).catch(() => undefined); setCover(null); }} />
            ) : (
            <FilePicker
              folder="content/cover"
              accept={COVER_ACCEPT}
              label={cover ? "Replace the cover" : "Choose a cover picture"}
              hint="PNG, JPEG or WebP, up to 5 MB."
              client="site"
              maxBytes={COVER_MAX_BYTES}
              tooLargeMessage={COVER_TOO_LARGE}
              onUploaded={setCover}
              onCleared={() => setCover(null)}
            />
            )}
            <div className="flex flex-col gap-3 sm:flex-row-reverse">
              <Button full size="lg" iconRight="ArrowRight" onClick={() => goTo(2)}>
                {cover ? "Next: details" : "Skip the cover"}
              </Button>
              <Button full variant="secondary" size="lg" icon="ArrowLeft" onClick={back}>
                Back
              </Button>
            </div>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <Input label="Title" value={title} maxLength={200} onChange={(e) => setTitle(e.target.value)} />
            <div className="flex flex-col gap-2">
              <label htmlFor="piece-description" className="text-[13px] font-semibold text-text-secondary">
                Description
              </label>
              <textarea
                id="piece-description"
                value={description}
                maxLength={5000}
                onChange={(e) => setDescription(e.target.value)}
                className="flex min-h-[112px] resize-none rounded-input border border-hairline bg-[var(--surface-input)] px-4 py-3.5 font-[var(--font-sans)] text-[16px] leading-[1.5] text-text-primary placeholder:text-text-muted"
              />
              <span className="text-[12px] text-text-muted">Say who it is for and what they can do after.</span>
            </div>
            <TaxonomyPicker
              role="creator"
              value={specializations}
              onChange={setSpecializations}
              max={3}
              label="What is this?"
              hint="Pick up to three. This is how people find the piece."
            />
            <div className="flex flex-col gap-3 sm:flex-row-reverse">
              <Button full size="lg" iconRight="ArrowRight" disabled={!detailsOk} onClick={() => goTo(3)}>
                Next: price
              </Button>
              <Button full variant="secondary" size="lg" icon="ArrowLeft" onClick={back}>
                Back
              </Button>
            </div>
          </>
        ) : null}

        {step === 3 ? (
          <>
            <div className="flex flex-col gap-1.5">
              <h2 className="m-0 text-[18px] font-bold tracking-[-0.02em] text-text-primary">Set the price</h2>
              <p className="m-0 text-[14px] leading-[1.5] text-text-secondary">
                Pick a price from the list. You keep {keep}% of every sale.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 rounded-full border border-hairline bg-tag p-1" role="radiogroup" aria-label="Price or no charge">
              {(
                [
                  ["paid", "Paid"],
                  ["none", "At no charge"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={pricing === value}
                  onClick={() => {
                    setPricing(value);
                    setSendError(null);
                  }}
                  className={`h-[40px] rounded-full text-[14px] font-semibold transition-colors ${
                    pricing === value ? "bg-accent text-on-accent" : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {pricing === "paid" ? (
              pricesError ? (
                <div className="flex flex-col items-start gap-3">
                  <p className="m-0 text-[13.5px] font-medium text-danger">{pricesError}</p>
                  <Button variant="secondary" size="sm" onClick={loadPrices}>
                    Try again
                  </Button>
                </div>
              ) : prices === null ? (
                <p className="m-0 text-[13.5px] text-text-muted">Loading the price list…</p>
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Price list">
                    {prices.map((p) => (
                      <button
                        key={p}
                        type="button"
                        role="radio"
                        aria-checked={price === p}
                        onClick={() => {
                          setPrice(p);
                          setSendError(null);
                        }}
                        className={`inline-flex h-[40px] items-center rounded-full px-4 text-[14px] font-semibold [font-feature-settings:var(--font-feature-tabular)] transition-colors ${
                          price === p
                            ? "bg-accent text-on-accent"
                            : "border border-hairline bg-tag text-text-secondary hover:bg-surface-hover active:bg-surface-press"
                        }`}
                      >
                        {nairaText(p)}
                      </button>
                    ))}
                  </div>
                  {price !== null ? (
                    <p className="m-0 text-[13.5px] text-text-secondary">
                      You keep {nairaText(Math.round((price * keep) / 100))} of {nairaText(price)}.
                    </p>
                  ) : null}
                </div>
              )
            ) : (
              <p className="m-0 text-[13.5px] leading-[1.5] text-text-secondary">
                Anyone can open it at no charge. People can still send you a tip.
              </p>
            )}
            {sendError ? (
              <p role="alert" className="m-0 rounded-input border border-danger bg-danger-tint px-3.5 py-3 text-[13.5px] leading-[1.45] text-danger">
                {sendError}
              </p>
            ) : null}
            <div className="flex flex-col gap-3 sm:flex-row-reverse">
              <Button full size="lg" loading={sending} disabled={!priceOk || !detailsOk || !asset} onClick={send}>
                Send for review
              </Button>
              <Button full variant="secondary" size="lg" icon="ArrowLeft" disabled={sending} onClick={back}>
                Back
              </Button>
            </div>
            <p className="m-0 text-center text-[12.5px] text-text-muted">We review every piece before it goes live.</p>
          </>
        ) : null}
      </section>
    </div>
  );
}

/** A file already uploaded for this draft, shown again when a person steps back to it. */
function Attached({ file, onRemove }: { file: UploadedFile; onRemove: () => void }) {
  return (
    <div className="flex items-center gap-3 rounded-input border border-decor bg-decor-tint p-[13px_14px]">
      <span className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-[11px] bg-card">
        <Icon name="Check" size={17} color="var(--accent)" strokeWidth={2.6} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-[14px] font-semibold text-text-primary">{file.name}</span>
        <span className="text-[12px] text-text-muted">{sizeText(file.size)} · uploaded</span>
      </span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${file.name}`}
        className="grid h-[32px] w-[32px] shrink-0 cursor-pointer place-items-center rounded-full border-0 bg-transparent text-text-muted hover:bg-state-hover hover:text-danger active:bg-state-press"
      >
        <Icon name="X" size={16} strokeWidth={2.2} />
      </button>
    </div>
  );
}
