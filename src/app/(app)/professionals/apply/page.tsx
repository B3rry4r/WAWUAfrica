"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CATEGORIES, type CategoryId } from "@/lib/categories";
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
import { ChoiceChips } from "@/components/ui/ChoiceChips";
import { FilePicker } from "@/components/ui/FilePicker";
import { Skeleton } from "@/components/ui/Skeleton";

const EMPTY: ProfessionalApplicationDraft = {
  category: "",
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

  const regulated = isRegulatedCategory(draft.category);

  /**
   * A regulated field accepts a licence and nothing else, so the choice is
   * removed rather than offered and then rejected. Outside those, a licence
   * is still a legitimate answer — plenty of unregulated trades certify.
   */
  const credentialOptions = useMemo(
    () =>
      (regulated
        ? (["licence"] as CredentialKind[])
        : (["portfolio", "qualification", "licence"] as CredentialKind[])
      ).map((k) => ({ value: k, label: CREDENTIAL_LABEL[k] })),
    [regulated],
  );

  useEffect(() => {
    if (regulated && draft.credentialKind !== "licence") {
      setDraft((d) => ({ ...d, credentialKind: "licence" }));
    }
  }, [regulated, draft.credentialKind]);

  const alreadyIn = draft.category
    ? mine?.find((m) => m.category === draft.category)
    : undefined;

  const complete =
    draft.category !== "" &&
    draft.headline.trim().length >= MIN_HEADLINE &&
    draft.about.trim().length >= MIN_ABOUT &&
    (!regulated ||
      (draft.licenceNumber.trim().length > 0 && draft.issuingBody.trim().length > 0));

  async function submit() {
    setState("saving");
    setError(null);
    try {
      await applyAsProfessional(draft, regulated);
      router.push("/professionals/mine");
    } catch (e) {
      setState("error");
      setError(
        e instanceof Error
          ? e.message
          : "We could not send your application. Try again.",
      );
    }
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
          <span className="text-[13px] font-semibold text-text-secondary">
            Which field?
          </span>
          <ChoiceChips
            ariaLabel="Which field?"
            options={CATEGORIES.map((c) => ({ value: c.id, label: c.name }))}
            value={(draft.category || null) as CategoryId | null}
            onSelect={(value) => setDraft((d) => ({ ...d, category: value }))}
          />
          {alreadyIn ? (
            <Callout
              tone={alreadyIn.status === "rejected" ? "warning" : "info"}
              title={
                alreadyIn.status === "approved"
                  ? "You are already listed here"
                  : alreadyIn.status === "pending"
                    ? "You already have an application under review here"
                    : "This application was turned down"
              }
            >
              {alreadyIn.status === "rejected"
                ? (alreadyIn.rejectionReason ??
                  "Fix what was raised and send it again. This replaces the old one.")
                : "Pick a different field, or manage this one from your applications."}
            </Callout>
          ) : null}
        </section>

        {regulated ? (
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

        {regulated ? (
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
          disabled={!complete || state === "saving" || alreadyIn?.status === "pending"}
        >
          {state === "saving" ? "Sending…" : "Send application"}
        </Button>
        <span className="text-center text-[12px] leading-[1.5] text-text-muted">
          A person reviews this. You will see the outcome under your
          applications, with a reason if it is turned down.
        </span>
      </div>
    </div>
  );
}
