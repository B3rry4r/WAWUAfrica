"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { MOCK_SERVICES } from "@/lib/api/mocks/services";
import { applyForPartnerService, type PartnerServiceKind } from "@/lib/api/lifestyle";
import { ProfileBackButton } from "@/components/profile/ProfileBackButton";
import { Button, ErrorState, FilePicker, Icon, StatusPill } from "@/components/ui";

const PARTNER_KINDS: PartnerServiceKind[] = ["loans", "pension"];

/**
 * The shared apply form for the partner services carried over from the
 * previous platform (Loans/EasyBuy, Pensions).
 *
 * CAC and NEPC keep their own bespoke forms because they collect specific
 * filing details. These four never did: the old flow was "submit a short
 * request, the partner reviews it", so one form serves all four rather than
 * four near-identical copies.
 */
export default function PartnerApplyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: kind } = use(params);
  const router = useRouter();

  const service = MOCK_SERVICES.find((s) => s.id === kind);
  const isPartnerKind = PARTNER_KINDS.includes(kind as PartnerServiceKind);

  const [note, setNote] = useState("");
  const [documents, setDocuments] = useState<{ url: string; name: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);

  if (!service || !isPartnerKind) {
    return (
      <div className="mx-auto flex w-full flex-col gap-[18px] p-[16px_16px_96px] xl:max-w-[900px] xl:gap-[22px] xl:p-[30px_28px_64px]">
        <ProfileBackButton />
        <ErrorState
          title="Not available"
          body="That service does not have an application form here."
          onRetry={() => router.push("/services")}
          retryLabel="Back to services"
        />
      </div>
    );
  }

  async function submit() {
    if (note.trim().length < 10) {
      setError("Tell the partner a little more about what you need.");
      return;
    }
    setBusy(true); setError(null);
    try {
      const created = await applyForPartnerService({
        kind: kind as PartnerServiceKind,
        note: note.trim(),
        documents: documents.map((d) => d.url),
      });
      setReference(created.reference);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send that request.");
    } finally {
      setBusy(false);
    }
  }

  if (reference) {
    return (
      <div className="mx-auto flex w-full flex-col gap-[18px] p-[16px_16px_96px] xl:max-w-[900px] xl:gap-[22px] xl:p-[30px_28px_64px]">
        <div className="flex flex-col items-center gap-[10px] rounded-[var(--radius-card)] border border-[var(--border-accent)] bg-[var(--surface-card)] p-[26px] text-center">
          <span className="grid h-[54px] w-[54px] place-items-center rounded-full bg-[var(--accent-tint)]">
            <Icon name="Check" size={26} color="var(--accent)" strokeWidth={2.4} />
          </span>
          <span className="text-[19px] font-bold text-[var(--text-primary)]">Request sent</span>
          <span className="text-[14px] leading-[1.5] text-[var(--text-secondary)]">
            {service.partner} is reviewing your {service.name.toLowerCase()} request. We will let you know as soon as
            they come back.
          </span>
          <span className="text-[12.5px] text-[var(--text-muted)]">Reference {reference}</span>
          <Button className="mt-2" onClick={() => router.push("/services")}>Back to services</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full flex-col gap-[18px] p-[16px_16px_96px] xl:max-w-[900px] xl:gap-[22px] xl:p-[30px_28px_64px]">
      <ProfileBackButton />

      <div className="flex flex-col gap-[6px]">
        <div className="flex items-center gap-[10px]">
          <h1 className="m-0 text-[24px] font-bold tracking-[-0.02em] text-[var(--text-primary)]">{service.name}</h1>
          {service.partner ? <StatusPill kind="info">{service.partner}</StatusPill> : null}
        </div>
        <p className="m-0 text-[14px] leading-[1.5] text-[var(--text-secondary)]">{service.blurb}</p>
      </div>

      {error ? <ErrorState title="Something went wrong" body={error} /> : null}

      {service.eligibility?.length ? (
        <div className="flex flex-col gap-[9px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[16px]">
          <span className="text-[13px] font-semibold text-[var(--text-secondary)]">What you need</span>
          {service.eligibility.map((e) => (
            <span key={e} className="flex items-start gap-2 text-[13.5px] leading-[1.45] text-[var(--text-secondary)]">
              <Icon name="Check" size={14} color="var(--accent)" strokeWidth={2.4} className="mt-[3px] shrink-0" />
              {e}
            </span>
          ))}
        </div>
      ) : null}

      <div className="flex flex-col gap-[12px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[16px]">
        <span className="text-[13px] font-semibold text-[var(--text-secondary)]">What do you need?</span>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={placeholderFor(kind)}
          className="flex min-h-[120px] resize-none rounded-[var(--radius-input)] border border-[var(--border-hairline)] bg-[var(--surface-input)] px-[16px] py-[14px] font-[var(--font-sans)] text-[14.5px] leading-[1.5] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
        />

        {documents.map((d) => (
          <span key={d.url} className="flex items-center gap-2 text-[13.5px] text-[var(--text-secondary)]">
            <Icon name="Check" size={15} color="var(--accent)" strokeWidth={2.4} />
            {d.name}
          </span>
        ))}
        <FilePicker
          folder="service-application/document"
          accept="image/*,application/pdf"
          label={documents.length ? "Add another document" : "Attach a document (optional)"}
          hint="ID, bank statement, or anything the partner asked for."
          onUploaded={(f) => setDocuments((list) => [...list, { url: f.fileUrl, name: f.name }])}
          disabled={busy}
        />
      </div>

      <Button full onClick={submit} disabled={busy}>
        {busy ? "Sending…" : "Send request"}
      </Button>
      <span className="text-[12px] leading-[1.5] text-[var(--text-muted)]">
        Nothing is charged for this. {service.partner} reviews your request and onboards you directly.
      </span>
    </div>
  );
}

function placeholderFor(kind: string): string {
  switch (kind) {
    case "pension":
      return "Tell us about your income and how much you would like to contribute.";
    case "loans":
      return "What do you need to finance, and roughly what does it cost?";
    default:
      return "Tell the partner what you need.";
  }
}
