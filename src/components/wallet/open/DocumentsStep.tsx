"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { Button, Callout, FilePicker, Icon, StatusPill } from "@/components/ui";
import type { IconName } from "@/components/ui";
import { ApiError } from "@/lib/api/client";
import { describeError } from "@/lib/api/errors";
import { reasonCodeOf, retryAfterOf, uploadIdentityDocument } from "@/lib/api/money";
import type { IdentityDocument, IdentityDocumentKind, IdentityDocuments } from "@/lib/api/money";
import { documentOf, fileProblem, needsFile, refusalWords, sidesProblem, sizeLabel, typesLabel } from "@/lib/wallet-opening";
import { StepFrame } from "./StepFrame";

type Problem = { title: string; body: string };

const PILL: Record<IdentityDocument["state"], { kind: "success" | "info" | "neutral" | "warning" | "danger"; label: string }> = {
  uploaded: { kind: "success", label: "Sent" },
  confirming: { kind: "info", label: "Confirming" },
  missing: { kind: "neutral", label: "Needed" },
  send_again: { kind: "warning", label: "Send again" },
  not_accepted: { kind: "warning", label: "Not accepted" },
  needs_new: { kind: "danger", label: "New file needed" },
};

/**
 * Refusals after which the server's own record may have moved (the document
 * may be confirming, or the opening may be closed), so the view is read again
 * instead of trusting what was on screen.
 */
const READ_AGAIN = new Set<string>(["documents_closed", "provider_unreachable", "document_in_progress"]);

const STATE_WORDS: Partial<Record<IdentityDocument["state"], string>> = {
  confirming: "We're confirming your upload. This takes a moment.",
  send_again: "We didn't get that file. Choose it again and send it.",
  not_accepted: "We couldn't read the last file. Choose another one.",
  needs_new: "Our reviewers couldn't verify this document. Send a clear new photo or file.",
};

export interface DocumentsStepProps {
  docs: IdentityDocuments;
  /** The documents view after an upload. */
  onDocs: (docs: IdentityDocuments) => void;
  /** Read the wallet and the documents again (after the last one goes, the opening moves on by itself). */
  onRefresh: () => Promise<void>;
}

/**
 * Step 2, "Documents": an ID (front, and back where it has one) and a proof
 * of address.
 *
 * A chosen file is checked here first, against the limits the server states
 * (`maxBytes`, `acceptedTypes`), so a file that is too large or the wrong
 * type is refused on the page before a byte is sent. The server still reads
 * the bytes and has the last word; each of its refusals is shown in plain
 * words from its `reason.code`.
 *
 * The two sides of an ID go in one request (the server keeps no copy of a
 * file to wait for the other side), so the front is held here until the person
 * sends. Nothing is kept in storage: the files are in this component's state
 * until they are sent.
 */
export function DocumentsStep({ docs, onDocs, onRefresh }: DocumentsStepProps) {
  const [idFront, setIdFront] = useState<File | null>(null);
  const [idBack, setIdBack] = useState<File | null>(null);
  const [poa, setPoa] = useState<File | null>(null);
  const [problems, setProblems] = useState<Partial<Record<IdentityDocumentKind, Problem>>>({});
  const [sending, setSending] = useState(false);

  const idDoc = documentOf(docs, "identity");
  const poaDoc = documentOf(docs, "proof_of_address");
  const limits = { maxBytes: docs.maxBytes, acceptedTypes: docs.acceptedTypes };
  const check = (file: File) => fileProblem(file, limits);
  const accept = docs.acceptedTypes.join(",");

  const idNeeds = needsFile(idDoc);
  const poaNeeds = needsFile(poaDoc);
  const mixedSides = idNeeds ? sidesProblem(idFront, idBack) : null;
  const anyToSend = !mixedSides && ((idNeeds && idFront !== null) || (poaNeeds && poa !== null));
  const nothingToSend = !idNeeds && !poaNeeds;

  const fail = (kind: IdentityDocumentKind, e: unknown) => {
    const code = reasonCodeOf(e);
    const words = refusalWords(code, retryAfterOf(e));
    let problem: Problem;
    // A refused file's own sentence is the specific one ("Use the same file type for both sides."): it wins.
    if (code === "document_file_invalid" && e instanceof ApiError && e.reason?.message) {
      problem = { title: "We can't use that file", body: e.reason.message };
    } else if (words) problem = words;
    else {
      const d = describeError(e);
      problem = { title: d.title, body: d.body };
    }
    setProblems((p) => ({ ...p, [kind]: problem }));
    // A refused file is gone for good (the server kept nothing): choose another. A busy or unreachable
    // server is no fault of the file, so it stays for another try.
    if (code === "document_not_accepted" || code === "document_file_invalid" || code === "document_request_invalid") {
      if (kind === "identity") {
        setIdFront(null);
        setIdBack(null);
      } else setPoa(null);
    }
    return code;
  };

  const send = async () => {
    if (sending) return;
    setSending(true);
    setProblems({});
    try {
      let reload = false;
      if (idNeeds && idFront) {
        try {
          onDocs(await uploadIdentityDocument({ kind: "identity", file: idFront, fileBack: idBack ?? undefined }));
          setIdFront(null);
          setIdBack(null);
          reload = true;
        } catch (e) {
          if (READ_AGAIN.has(fail("identity", e) ?? "")) reload = true;
        }
      }
      if (poaNeeds && poa) {
        try {
          onDocs(await uploadIdentityDocument({ kind: "proof_of_address", file: poa }));
          setPoa(null);
          reload = true;
        } catch (e) {
          if (READ_AGAIN.has(fail("proof_of_address", e) ?? "")) reload = true;
        }
      }
      // After the last document is in, the server sends the opening for review by itself; reading the
      // wallet again is what moves the page on.
      if (reload) await onRefresh();
    } finally {
      setSending(false);
    }
  };

  return (
    <StepFrame
      stickyFooter
      footer={
        nothingToSend ? (
          <Button full size="lg" iconRight="ArrowRight" loading={sending} onClick={() => void onRefresh()}>
            Continue
          </Button>
        ) : (
          <Button full size="lg" iconRight="Send" loading={sending} disabled={!anyToSend} onClick={() => void send()}>
            Send documents
          </Button>
        )
      }
    >
      <div className="flex flex-col gap-[8px]">
        <h2 className="m-0 text-[24px] font-bold tracking-[-0.025em]">Add your documents</h2>
        <p className="m-0 text-[14px] leading-[1.5] text-[var(--text-secondary)]">
          A clear photo or scan of each. {typesLabel(docs.acceptedTypes)}, up to {sizeLabel(docs.maxBytes)} each.
        </p>
      </div>

      <DocumentCard
        icon="IdCard"
        title="Your ID"
        caption="Front, and the back if it has one. All four corners in frame, no glare."
        doc={idDoc}
        problem={problems.identity ?? (mixedSides ? { title: "The two sides don't match", body: mixedSides } : undefined)}
      >
        {idNeeds ? (
          <div className="flex flex-col gap-[10px]">
            <FilePicker
              accept={accept}
              label="Front of your ID"
              hint={`${typesLabel(docs.acceptedTypes)}, up to ${sizeLabel(docs.maxBytes)}`}
              hold={{ file: idFront, onChange: setIdFront, check }}
              disabled={sending}
            />
            <FilePicker
              accept={accept}
              label="Back of your ID (if it has one)"
              hint="Leave this out if your ID has only one side"
              hold={{ file: idBack, onChange: setIdBack, check }}
              disabled={sending}
            />
          </div>
        ) : null}
      </DocumentCard>

      <DocumentCard
        icon="FileText"
        title="Proof of address"
        caption="A utility bill or bank statement from the last 3 months, with your name and address on it."
        doc={poaDoc}
        problem={problems.proof_of_address}
      >
        {poaNeeds ? (
          <FilePicker
            accept={accept}
            label="Your proof of address"
            hint={`${typesLabel(docs.acceptedTypes)}, up to ${sizeLabel(docs.maxBytes)}`}
            hold={{ file: poa, onChange: setPoa, check }}
            disabled={sending}
          />
        ) : null}
      </DocumentCard>

      {nothingToSend && !docs.submitted && idDoc?.state === "uploaded" && poaDoc?.state === "uploaded" ? (
        <Callout tone="info" full>
          Your documents are in. We&apos;ll send everything for review as soon as the last step is done.
        </Callout>
      ) : null}
    </StepFrame>
  );
}

function DocumentCard({
  icon,
  title,
  caption,
  doc,
  problem,
  children,
}: {
  icon: IconName;
  title: string;
  caption: string;
  doc: IdentityDocument | undefined;
  problem?: Problem;
  children?: ReactNode;
}) {
  const state = doc?.state ?? "missing";
  const pill = PILL[state];
  const words = STATE_WORDS[state];
  return (
    <section
      aria-label={title}
      className="flex flex-col gap-[14px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[16px] xl:p-[20px]"
    >
      <div className="flex items-start gap-[12px]">
        <span className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-[11px] border border-[var(--border-decor)] bg-[var(--decor-tint)]">
          <Icon name={state === "uploaded" ? "Check" : icon} size={17} color={state === "uploaded" ? "var(--success)" : "var(--decor-icon)"} strokeWidth={state === "uploaded" ? 2.6 : 2} />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
          <span className="flex items-center justify-between gap-[10px]">
            <h3 className="m-0 text-[15px] font-semibold">{title}</h3>
            <StatusPill kind={pill.kind} size="sm">
              {pill.label}
            </StatusPill>
          </span>
          <span className="text-[12.5px] leading-[1.45] text-[var(--text-muted)]">{caption}</span>
        </span>
      </div>

      {state === "uploaded" && doc ? (
        <p className="m-0 text-[13.5px] leading-[1.5] text-[var(--text-secondary)]">
          {doc.sides.includes("back") ? "Front and back sent" : "Sent"}
          {doc.uploadedAt ? ` on ${new Date(doc.uploadedAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}.` : "."}
        </p>
      ) : words ? (
        <p className="m-0 text-[13.5px] leading-[1.5] text-[var(--text-secondary)]">{words}</p>
      ) : null}

      {problem && state !== "confirming" && state !== "send_again" ? (
        <Callout tone="danger" title={problem.title} full>
          {problem.body}
        </Callout>
      ) : null}

      {children}
    </section>
  );
}
