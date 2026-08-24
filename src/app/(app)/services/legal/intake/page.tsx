"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  completeLegalIntake,
  getLegalMatters,
  saveLegalIntakeAnswers,
  startLegalIntake,
} from "@/lib/api/legal-intake";
import type {
  IntakeQuestion,
  LegalIntake,
  LegalMatterOption,
} from "@/types/legal-intake";
import { FlowHeader } from "@/components/layout/FlowHeader";
import { IntakeQuestionField } from "@/components/legal/IntakeQuestionField";
import { Button } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";
import { ErrorState } from "@/components/ui/ErrorState";
import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";

type Answer = string | string[] | null;

/**
 * Legal profiling — the client's side.
 *
 * The ordering this screen exists to enforce: nobody is shown a price until
 * they have been asked what they need. Before it, the legal service opened on
 * a catalogue with consultation fees against each line, so the first thing
 * WAWU said to a person with a legal problem was a number.
 *
 * One STEP per screen rather than one question, because the steps are already
 * small and paging through eighteen single questions feels longer than
 * answering eighteen questions in nine groups. Answers save on every change,
 * so a closed tab costs nothing.
 */
export default function LegalIntakePage() {
  const router = useRouter();

  const [matters, setMatters] = useState<LegalMatterOption[] | null>(null);
  const [intake, setIntake] = useState<LegalIntake | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [failed, setFailed] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [finishError, setFinishError] = useState<string | null>(null);

  /** Local answers, so a tap paints immediately and the save trails it. */
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [documents, setDocuments] = useState<string[]>([]);

  useEffect(() => {
    getLegalMatters()
      .then(setMatters)
      .catch(() => setFailed("We could not load the legal service just now."));
  }, []);

  /* ---- saving ---------------------------------------------------------- */

  const pending = useRef<Record<string, Answer>>({});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Answers are batched for a moment before saving.
   *
   * Somebody moving quickly through tap-to-answer questions produces one
   * request per tap otherwise, and they arrive out of order. The server
   * merges, so a batch is safe and the last write wins on the field it
   * touched rather than on the whole intake.
   */
  const queueSave = useCallback(
    (id: string, patch: Record<string, Answer>, docs?: string[]) => {
      pending.current = { ...pending.current, ...patch };
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        const batch = pending.current;
        pending.current = {};
        saveLegalIntakeAnswers(id, batch, docs)
          .then((fresh) => {
            // Take the server's question list — answering can reveal a new
            // question — but keep local answers, which may already be ahead.
            setIntake((prev) =>
              prev ? { ...fresh, answers: { ...fresh.answers } } : fresh,
            );
          })
          .catch(() => setFinishError("Your last answer did not save. Check your connection."));
      }, 500);
    },
    [],
  );

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  /* ---- steps ----------------------------------------------------------- */

  const steps = useMemo(() => {
    if (!intake) return [] as Array<{ step: number; title: string; questions: IntakeQuestion[] }>;
    const grouped = new Map<number, { step: number; title: string; questions: IntakeQuestion[] }>();
    for (const q of intake.questions) {
      const entry = grouped.get(q.step) ?? { step: q.step, title: q.stepTitle, questions: [] };
      entry.questions.push(q);
      grouped.set(q.step, entry);
    }
    return [...grouped.values()].sort((a, b) => a.step - b.step);
  }, [intake]);

  const current = steps[stepIndex];
  const isLast = stepIndex === steps.length - 1;

  /** Required questions on THIS step that are still unanswered. */
  const stepBlocked = useMemo(() => {
    if (!current) return false;
    return current.questions.some((q) => {
      if (q.level !== "required") return false;
      const v = answers[q.id];
      if (v === null || v === undefined || v === "") return true;
      if (Array.isArray(v) && v.length === 0) return true;
      return false;
    });
  }, [current, answers]);

  async function begin(matter: string) {
    setBusy(true);
    setFailed(null);
    try {
      const started = await startLegalIntake(matter);
      setIntake(started);
      // Resuming: rehydrate whatever was already answered.
      setAnswers(started.answers as Record<string, Answer>);
      setDocuments(started.documents);
      setStepIndex(0);
    } catch {
      setFailed("We could not start this just now. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function finish() {
    if (!intake) return;
    setBusy(true);
    setFinishError(null);
    // Flush anything still batched, so the brief is written from every answer.
    if (timer.current) clearTimeout(timer.current);
    try {
      if (Object.keys(pending.current).length > 0 || documents.length > 0) {
        await saveLegalIntakeAnswers(intake.id, pending.current, documents);
        pending.current = {};
      }
      const done = await completeLegalIntake(intake.id);
      setIntake(done);
      setStepIndex(steps.length); // the "you're all set" screen
    } catch (e) {
      setFinishError(
        e instanceof Error
          ? e.message
          : "We could not prepare your summary. Your answers are saved — try again in a moment.",
      );
    } finally {
      setBusy(false);
    }
  }

  /* ---- render ---------------------------------------------------------- */

  if (failed) {
    return (
      <div className="flex min-h-[100dvh] flex-col">
        <FlowHeader title="WAWU Legal" />
        <div className="p-[16px]">
          <ErrorState title="Something went wrong" body={failed} />
        </div>
      </div>
    );
  }

  // Step 1 — what do you need help with?
  if (!intake) {
    return (
      <div className="flex min-h-[100dvh] flex-col">
        <FlowHeader title="WAWU Legal" />
        <div className="mx-auto flex w-full max-w-[620px] flex-col gap-[16px] p-[16px_16px_110px]">
          <div className="flex flex-col gap-[6px]">
            <h1 className="text-[21px] font-bold leading-[1.2] text-text-primary">
              What do you need help with?
            </h1>
            <p className="text-[13.5px] leading-[1.55] text-text-secondary">
              A few quick questions — about two minutes. Your consultant reads
              your answers before you speak, so you never have to start from
              the beginning.
            </p>
          </div>

          {matters === null ? (
            <div className="flex flex-col gap-2">
              <Skeleton variant="row" className="h-12" />
              <Skeleton variant="row" className="h-12" />
              <Skeleton variant="row" className="h-12" />
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {matters.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  disabled={busy}
                  onClick={() => void begin(m.value)}
                  className="flex items-center gap-3 rounded-[14px] border border-hairline bg-card px-4 py-3.5 text-left text-[15px] font-semibold text-text-primary transition-colors hover:border-strong hover:bg-surface-hover active:bg-surface-press disabled:opacity-60"
                >
                  <span className="flex-1">{m.label}</span>
                  <Icon name="ChevronRight" size={17} color="var(--text-muted)" strokeWidth={2} />
                </button>
              ))}
            </div>
          )}

          <p className="text-[12.5px] leading-[1.5] text-text-muted">
            Nothing is charged for this, and no price is quoted until a
            consultant has read what you need.
          </p>
        </div>
      </div>
    );
  }

  // The "you're all set" screen.
  if (intake.status !== "in_progress" || stepIndex >= steps.length) {
    return (
      <div className="flex min-h-[100dvh] flex-col">
        <FlowHeader title="WAWU Legal" />
        <div className="mx-auto flex w-full max-w-[560px] flex-col gap-[18px] p-[16px_16px_110px]">
          <div className="flex flex-col items-center gap-[12px] pt-[18px] text-center">
            <span className="grid h-[62px] w-[62px] place-items-center rounded-full border border-[var(--border-selected)] bg-[var(--selected-tint)]">
              <Icon name="Check" size={28} color="var(--accent)" strokeWidth={2.4} />
            </span>
            <h1 className="text-[22px] font-bold leading-[1.2] text-text-primary">
              You&rsquo;re all set
            </h1>
            <p className="max-w-[44ch] text-[14px] leading-[1.55] text-text-secondary">
              We&rsquo;ve prepared a summary of your {intake.matterLabel.toLowerCase()}{" "}
              matter for your legal consultant. They will read it before your
              consultation, so you don&rsquo;t have to start from the beginning.
            </p>
          </div>

          {intake.brief ? (
            <div className="flex flex-col gap-[10px] rounded-[var(--radius-card)] border border-hairline bg-card p-[16px]">
              <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-text-muted">
                What we&rsquo;re sending
              </span>
              <p className="text-[13.5px] leading-[1.55] text-text-secondary">
                {intake.brief.analysis.summary}
              </p>
              {intake.brief.facts.length > 0 ? (
                <span className="text-[12.5px] text-text-muted">
                  Plus your {intake.brief.facts.length} answers
                  {intake.brief.documentCount > 0
                    ? ` and ${intake.brief.documentCount} document${intake.brief.documentCount === 1 ? "" : "s"}`
                    : ""}
                  .
                </span>
              ) : null}
            </div>
          ) : null}

          <Button full onClick={() => router.push("/services/legal")}>
            Continue to your consultant
          </Button>
        </div>
      </div>
    );
  }

  const stepNumber = stepIndex + 1;

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <FlowHeader title={intake.matterLabel} />

      <div className="mx-auto flex w-full max-w-[620px] flex-col gap-[18px] p-[16px_16px_130px]">
        {/* Progress. Knowing there are nine short steps is most of why
            somebody finishes the fourth one. */}
        <div className="flex flex-col gap-[7px]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-text-muted">
              {current?.title}
            </span>
            <span className="text-[12px] text-text-muted">
              {stepNumber} of {steps.length}
            </span>
          </div>
          <div className="h-[3px] w-full overflow-hidden rounded-full bg-tag">
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-300"
              style={{ width: `${(stepNumber / steps.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="flex flex-col gap-[22px]">
          {current?.questions.map((q) => (
            <IntakeQuestionField
              key={q.id}
              question={q}
              value={answers[q.id] ?? null}
              onChange={(next) => {
                setAnswers((prev) => ({ ...prev, [q.id]: next }));
                queueSave(intake.id, { [q.id]: next });
              }}
              documents={documents}
              onDocumentsChange={(docs) => {
                setDocuments(docs);
                queueSave(intake.id, {}, docs);
              }}
            />
          ))}
        </div>

        {finishError ? (
          <Callout tone="danger" title="That didn&rsquo;t go through">
            {finishError}
          </Callout>
        ) : null}
      </div>

      {/* Fixed footer, so the way forward is always reachable without
          scrolling past a long step. */}
      <div className="fixed inset-x-0 bottom-0 border-t border-hairline bg-[var(--surface-chrome)] p-[12px_16px_16px] backdrop-blur">
        <div className="mx-auto flex w-full max-w-[620px] items-center gap-[10px]">
          {stepIndex > 0 ? (
            <Button
              variant="secondary"
              onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
              disabled={busy}
            >
              Back
            </Button>
          ) : null}
          <div className="flex-1">
            <Button
              full
              disabled={stepBlocked || busy}
              onClick={() => {
                if (isLast) void finish();
                else setStepIndex((i) => i + 1);
              }}
            >
              {busy
                ? isLast
                  ? "Preparing your summary…"
                  : "Saving…"
                : isLast
                  ? "Finish"
                  : "Continue"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
