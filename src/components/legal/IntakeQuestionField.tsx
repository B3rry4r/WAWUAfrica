"use client";

import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { ChoiceChips } from "@/components/ui/ChoiceChips";
import { FilePicker } from "@/components/ui/FilePicker";
import type { IntakeQuestion } from "@/types/legal-intake";

type Answer = string | string[] | null;

/**
 * One question, rendered from whatever the server said it is.
 *
 * The app deliberately knows nothing about which questions exist — it is
 * handed a list and draws it. That is what lets the backend add a
 * matter-specific question without shipping an app release, and what keeps
 * the wording a client sees identical to the wording in the consultant's
 * brief.
 *
 * Single-choice answers commit on tap with no confirm step. This intake is
 * meant to take two to three minutes, and a Next button under every one of
 * eighteen questions is most of why forms like this get abandoned.
 */
export function IntakeQuestionField({
  question,
  value,
  onChange,
  documents,
  onDocumentsChange,
}: {
  question: IntakeQuestion;
  value: Answer;
  onChange: (value: Answer) => void;
  documents: string[];
  onDocumentsChange: (documents: string[]) => void;
}) {
  const optional = question.level === "optional";

  return (
    <div className="flex flex-col gap-[10px]">
      <div className="flex flex-col gap-[3px]">
        <span className="text-[16px] font-semibold leading-[1.35] text-text-primary">
          {question.prompt}
          {optional ? (
            <span className="ml-[7px] align-middle text-[12px] font-medium text-text-muted">
              Optional
            </span>
          ) : null}
        </span>
        {question.helper ? (
          <span className="text-[13px] leading-[1.45] text-text-secondary">
            {question.helper}
          </span>
        ) : null}
      </div>

      {question.kind === "single" && question.options ? (
        <ChoiceChips
          ariaLabel={question.prompt}
          options={question.options.map((o) => ({ value: o.value, label: o.label }))}
          value={typeof value === "string" ? value : null}
          onSelect={(next) => onChange(next)}
        />
      ) : null}

      {question.kind === "multi" && question.options ? (
        <div className="flex flex-wrap gap-2" role="group" aria-label={question.prompt}>
          {question.options.map((option) => {
            const selected = Array.isArray(value) && value.includes(option.value);
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={selected}
                onClick={() => {
                  const current = Array.isArray(value) ? value : [];
                  onChange(
                    selected
                      ? current.filter((v) => v !== option.value)
                      : [...current, option.value],
                  );
                }}
                className={[
                  "inline-flex h-9 items-center gap-[6px] rounded-full border px-[13px] text-[13px] font-semibold transition-colors",
                  selected
                    ? "border-[var(--border-selected)] bg-[var(--selected-tint)] text-accent"
                    : "border-hairline bg-card font-medium text-text-secondary hover:border-strong hover:bg-surface-hover active:bg-surface-press",
                ].join(" ")}
              >
                {option.label}
                {selected ? (
                  <Icon name="Check" size={13} color="var(--accent)" strokeWidth={2.6} />
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}

      {question.kind === "text" ? (
        <div className="flex flex-col gap-[9px]">
          <textarea
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={question.placeholder}
            rows={4}
            className="w-full resize-none rounded-[var(--radius-input)] border border-hairline bg-input px-4 py-3 text-[15px] leading-relaxed text-text-primary outline-none transition-colors placeholder:text-[var(--text-disabled)] focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
          {/*
            Openers, not answers. Somebody staring at an empty box describing
            a legal problem writes either three words or nine paragraphs;
            tapping one of these gives them a first line to edit.
          */}
          {question.suggestions && question.suggestions.length > 0 ? (
            <div className="flex flex-wrap gap-[7px]">
              {question.suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    const current = typeof value === "string" ? value : "";
                    onChange(current.trim().length > 0 ? current : s);
                  }}
                  className="inline-flex h-8 items-center rounded-full border border-hairline bg-tag px-[12px] text-[12.5px] font-medium text-text-secondary hover:border-strong hover:bg-surface-hover active:bg-surface-press"
                >
                  {s}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {question.kind === "date" ? (
        <Input
          type="date"
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : null}

      {question.kind === "documents" ? (
        <div className="flex flex-col gap-[8px]">
          <FilePicker
            folder="legal/document"
            accept="image/*,application/pdf"
            label="Attach a document"
            hint="Only your consultant sees these. You can also send them later."
            onUploaded={(file) => onDocumentsChange([...documents, file.fileUrl])}
          />
          {documents.length > 0 ? (
            <span className="text-[12.5px] text-text-muted">
              {documents.length} attached
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
