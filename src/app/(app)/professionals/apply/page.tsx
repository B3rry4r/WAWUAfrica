"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";
import {
  applyAsProfessional,
  getMyApplications,
} from "@/lib/api/professionals";
import {
  CREDENTIAL_LABEL,
  isRegulatedCategory,
  type CredentialKind,
  type MyProfessionalApplication,
  type ProfessionalApplicationDraft,
} from "@/types/professional";
import { useCreatorState } from "@/lib/auth/use-creator-state";
import { creatorGates } from "@/lib/auth/gates";
import { FlowHeader } from "@/components/layout/FlowHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Icon } from "@/components/ui/Icon";
import { Callout } from "@/components/ui/Callout";
import { ChoiceChips, TaxonomyPicker } from "@/components/ui";
import { FilePicker } from "@/components/ui/FilePicker";
import { Skeleton } from "@/components/ui/Skeleton";

function categoryName(id: string): string {
  return CATEGORIES.find((c) => c.id === id)?.name ?? id.replace(/_/g, " ");
}

const EMPTY: ProfessionalApplicationDraft = {
  categories: [],
  headline: "",
  about: "",
  services: [],
  credentialKind: "portfolio",
  licenceNumber: "",
  issuingBody: "",
  documents: [],
};

/** Mirrors the API's own minimums, so the button explains itself before a 400. */
const MIN_HEADLINE = 8;
const MIN_ABOUT = 40;

export default function ApplyProfessionalPage() {
  const router = useRouter();
  const { creator, resolved } = useCreatorState();
  const gates = creatorGates({ creator });

  const [draft, setDraft] = useState<ProfessionalApplicationDraft>(EMPTY);
  const [serviceInput, setServiceInput] = useState("");
  const [mine, setMine] = useState<MyProfessionalApplication[] | null>(null);
  const [state, setState] = useState<"idle" | "saving" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMyApplications()
      .then(setMine)
      .catch(() => setMine([]));
  }, []);

  // If ANY picked category is regulated, the shared credential fields below
  // lock to a licence — the one submission per regulated category actually
  // needs it, and reusing the same fields on an unregulated pick alongside it
  // is a fair trade against making someone fill in the whole form twice.
  const anyRegulated = draft.categories.some(isRegulatedCategory);

  /**
   * A regulated field accepts a licence and nothing else, so the choice is
   * removed rather than offered and then rejected. Outside those, a licence
   * is still a legitimate answer — plenty of unregulated trades certify.
   */
  const credentialOptions = useMemo(
    () =>
      (anyRegulated
        ? (["licence"] as CredentialKind[])
        : (["portfolio", "qualification", "licence"] as CredentialKind[])
      ).map((k) => ({ value: k, label: CREDENTIAL_LABEL[k] })),
    [anyRegulated],
  );

  useEffect(() => {
    if (anyRegulated && draft.credentialKind !== "licence") {
      setDraft((d) => ({ ...d, credentialKind: "licence" }));
    }
  }, [anyRegulated, draft.credentialKind]);

  /** Any selected category that already has an application on file. */
  const alreadyIn = draft.categories
    .map((c) => mine?.find((m) => m.category === c))
    .filter((m): m is MyProfessionalApplication => Boolean(m));

  const hasPendingDuplicate = alreadyIn.some((m) => m.status === "pending");

  const complete =
    draft.categories.length > 0 &&
    draft.headline.trim().length >= MIN_HEADLINE &&
    draft.about.trim().length >= MIN_ABOUT &&
    (!anyRegulated ||
      (draft.licenceNumber.trim().length > 0 && draft.issuingBody.trim().length > 0));

  async function submit() {
    setState("saving");
    setError(null);
    // One call per category — the API's own unit, see applyAsProfessional.
    const results = await Promise.allSettled(
      draft.categories.map((category) =>
        applyAsProfessional(draft, category, isRegulatedCategory(category)),
      ),
    );
    const failedCategories = draft.categories.filter((_, i) => results[i].status === "rejected");
    if (failedCategories.length === 0) {
      router.push("/professionals/mine");
      return;
    }
    setState("error");
    if (failedCategories.length === results.length) {
      const first = results[0] as PromiseRejectedResult;
      setError(
        first.reason instanceof Error
          ? first.reason.message
          : "We could not send your application. Try again.",
      );
      return;
    }
    // Some categories went through, some did not. Staying on the page (rather
    // than navigating to "mine", where the successful ones now also show)
    // means the draft — and the retry — is still right here for the rest.
    setDraft((d) => ({ ...d, categories: failedCategories }));
    setError(
      `${results.length - failedCategories.length} of ${results.length} categories were submitted. The rest did not go through, try again below.`,
    );
  }

  if (!resolved) {
    return (
      <div className="flex flex-col gap-3 p-4">
        <Skeleton variant="row" className="h-12" />
        <Skeleton variant="row" className="h-40" />
      </div>
    );
  }

  // Being listed is a way to get paid, and payment is a creator activity —
  // the API refuses a buyer account outright, so say so here rather than
  // letting someone fill in the whole form for a 403.
  if (!gates.isCreator) {
    return (
      <div className="flex min-h-[100dvh] flex-col">
        <FlowHeader title="Offer your services" />
        <div className="flex flex-col gap-[14px] p-[16px]">
          <Callout tone="info" title="This needs a creator account">
            Listing yourself as a professional is how you get paid for your
            time, and that runs on a creator account. Switching is in Settings.
          </Callout>
          <Button href="/settings" variant="secondary" full>
            Go to Settings
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <FlowHeader title="Offer your services" />

      <div className="mx-auto flex w-full max-w-[620px] flex-col gap-[18px] p-[16px_16px_120px]">
        <p className="text-[13.5px] leading-[1.55] text-[var(--text-secondary)]">
          Get listed in a category so people looking for your work can find
          you. They pay to send the first message; you and they arrange
          everything after that.
        </p>

        {mine && mine.length > 0 ? (
          <Link
            href="/professionals/mine"
            className="flex items-center gap-[10px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[13px] no-underline text-inherit hover:border-strong hover:bg-surface-hover"
          >
            <Icon name="FileText" size={17} color="var(--text-secondary)" strokeWidth={2} />
            <span className="flex-1 text-[13.5px] text-[var(--text-secondary)]">
              You have {mine.length} application{mine.length === 1 ? "" : "s"}
            </span>
            <Icon name="ChevronRight" size={16} color="var(--text-muted)" strokeWidth={2} />
          </Link>
        ) : null}

        <section className="flex flex-col gap-[9px]">
          {/*
            Build brief C5. This was twenty-five rounded pills wrapped into a
            vertical wall, which is the exact screen the owner called
            unprofessional (refs/reject-offer-services-pillwall.jpg). It is now
            the same sheet-and-rows control the upload wizard uses, so there is
            one way to pick from a taxonomy in this app rather than two.

            The ids are still the flat 25-category list, not C1's 21
            professional categories: the regulated-category rules (which fields
            legally require a licence) are keyed to these ids on the backend,
            and re-deriving that mapping is a liability decision, not a rename.
            See DECISIONS.md D7.
          */}
          <TaxonomyPicker
            role="professional"
            label="Which fields?"
            hint="Pick as many as apply. Each one is a separate application."
            emptyHint="No fields chosen yet. Pick the ones you actually practise in: each becomes its own application, reviewed on its own."
            options={CATEGORIES.map((c) => ({ id: c.id, label: c.name }))}
            value={draft.categories}
            onChange={(next) =>
              setDraft((d) => ({ ...d, categories: next as typeof d.categories }))
            }
          />
          {alreadyIn.map((m) => (
            <Callout
              key={m.category}
              tone={m.status === "rejected" ? "warning" : "info"}
              title={
                m.status === "approved"
                  ? `You are already listed under ${categoryName(m.category)}`
                  : m.status === "pending"
                    ? `You already have an application under review in ${categoryName(m.category)}`
                    : `Your ${categoryName(m.category)} application was turned down`
              }
            >
              {m.status === "rejected"
                ? (m.rejectionReason ??
                  "Fix what was raised and send it again. This replaces the old one.")
                : "Deselect it, or manage this one from your applications."}
            </Callout>
          ))}
        </section>

        {anyRegulated ? (
          <Callout tone="warning" title="This field is regulated">
            We confirm your practising licence with the body that issued it
            before you go live. A portfolio cannot stand in for one here.
          </Callout>
        ) : null}

        <Input
          label="One line about what you do"
          placeholder="Corporate lawyer, 11 years"
          value={draft.headline}
          onChange={(e) => setDraft((d) => ({ ...d, headline: e.target.value }))}
          hint="Shown under your name in the directory."
        />

        <label className="flex flex-col gap-[7px]">
          <span className="text-[13px] font-semibold text-text-secondary">
            About your work
          </span>
          <textarea
            value={draft.about}
            onChange={(e) => setDraft((d) => ({ ...d, about: e.target.value }))}
            placeholder="What you do, who you usually work with, and anything someone should know before contacting you."
            className="min-h-[130px] w-full resize-none rounded-[var(--radius-input)] border border-hairline bg-input px-4 py-3 text-[15px] text-text-primary outline-none transition-colors placeholder:text-[var(--text-disabled)] focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
          <span className="text-[12px] text-text-muted">
            {draft.about.trim().length < MIN_ABOUT
              ? `${MIN_ABOUT - draft.about.trim().length} more characters needed`
              : "Looks good."}
          </span>
        </label>

        <section className="flex flex-col gap-[9px]">
          <span className="text-[13px] font-semibold text-text-secondary">
            What do you take on?
          </span>
          <div className="flex gap-[8px]">
            <Input
              placeholder="Contract review"
              value={serviceInput}
              onChange={(e) => setServiceInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== "Enter") return;
                e.preventDefault();
                const v = serviceInput.trim();
                if (!v || draft.services.includes(v) || draft.services.length >= 12) return;
                setDraft((d) => ({ ...d, services: [...d.services, v] }));
                setServiceInput("");
              }}
            />
            <Button
              variant="secondary"
              onClick={() => {
                const v = serviceInput.trim();
                if (!v || draft.services.includes(v) || draft.services.length >= 12) return;
                setDraft((d) => ({ ...d, services: [...d.services, v] }));
                setServiceInput("");
              }}
            >
              Add
            </Button>
          </div>
          {draft.services.length > 0 ? (
            <div className="flex flex-wrap gap-[7px]">
              {draft.services.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() =>
                    setDraft((d) => ({ ...d, services: d.services.filter((x) => x !== s) }))
                  }
                  className="inline-flex h-8 cursor-pointer items-center gap-[6px] rounded-full border border-[var(--border-selected)] bg-[var(--selected-tint)] px-[13px] text-[12.5px] font-semibold text-accent"
                >
                  {s}
                  <Icon name="X" size={12} color="var(--accent)" strokeWidth={2.4} />
                </button>
              ))}
            </div>
          ) : null}
        </section>

        <section className="flex flex-col gap-[9px]">
          <span className="text-[13px] font-semibold text-text-secondary">
            What are you showing us?
          </span>
          <ChoiceChips
            ariaLabel="What are you showing us?"
            options={credentialOptions}
            value={draft.credentialKind}
            onSelect={(value) => setDraft((d) => ({ ...d, credentialKind: value }))}
          />
        </section>

        {anyRegulated ? (
          <>
            <Input
              label="Licence number"
              placeholder="SCN/2014/10233"
              value={draft.licenceNumber}
              onChange={(e) => setDraft((d) => ({ ...d, licenceNumber: e.target.value }))}
              hint="Never shown publicly. Only our reviewer sees it."
            />
            <Input
              label="Who issued it"
              placeholder="Nigerian Bar Association"
              value={draft.issuingBody}
              onChange={(e) => setDraft((d) => ({ ...d, issuingBody: e.target.value }))}
              hint="This one IS shown, so people can check the register themselves."
            />
          </>
        ) : null}

        <FilePicker
          folder="professional/document"
          accept="image/*,application/pdf"
          label="Upload your certificate or licence"
          hint="Optional for a portfolio application, expected for a licence."
          onUploaded={(file) =>
            setDraft((d) => ({ ...d, documents: [...d.documents, file.fileUrl] }))
          }
        />
        {draft.documents.length > 0 ? (
          <span className="text-[12.5px] text-text-muted">
            {draft.documents.length} document
            {draft.documents.length === 1 ? "" : "s"} attached
          </span>
        ) : null}

        {error ? (
          <Callout tone="danger" title="That did not go through">
            {error}
          </Callout>
        ) : null}

        <Button
          full
          onClick={submit}
          disabled={!complete || state === "saving" || hasPendingDuplicate}
        >
          {state === "saving"
            ? "Sending…"
            : draft.categories.length > 1
              ? `Send ${draft.categories.length} applications`
              : "Send application"}
        </Button>
        <span className="text-center text-[12px] leading-[1.5] text-text-muted">
          A person reviews this. You will see the outcome under your
          applications, with a reason if it is turned down.
        </span>
      </div>
    </div>
  );
}
