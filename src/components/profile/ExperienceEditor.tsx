"use client";

import { useState } from "react";
import { Button, Icon, Input } from "@/components/ui";
import {
  addExperience,
  editExperience,
  removeExperience,
  type ExperienceDraft,
} from "@/lib/api/verification";
import type { ProfileExperience } from "@/types/profile";

/**
 * Adding, changing and removing roles on the profile editor.
 *
 * ── WHY THIS SAVES ON ITS OWN ──────────────────────────────────────────────
 *
 * Every other field on the edit screen is part of one draft that goes up in a
 * single PATCH when you press Save. These do not: each row is written by its
 * own request the moment you confirm it.
 *
 * That is not inconsistency for its own sake. A list folded into the page
 * draft means the whole list is resent on every save, so "delete the third
 * one" becomes a read-modify-write and two open tabs quietly overwrite each
 * other. It also means a role you carefully typed is lost if an unrelated
 * field fails validation. Row-at-a-time writes make each change independent,
 * which is what a list of independent things needs.
 *
 * The cost is that a half-typed row is not saved by pressing Save on the page,
 * so the form says so rather than leaving people to discover it.
 *
 * ── THE MONTH FIELDS ───────────────────────────────────────────────────────
 *
 * `type="month"` gives a real month picker on every platform and produces
 * exactly the "YYYY-MM" the API wants, with no parsing on either side and no
 * day component for anybody to invent.
 */

const BLANK: ExperienceDraft = {
  title: "",
  company: "",
  location: "",
  startedOn: "",
  endedOn: "",
  description: "",
};

/** "2023-03" to "Mar 2023", for the rows that are not being edited. */
function monthLabel(month: string): string {
  const [year, mon] = month.split("-");
  const NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const name = NAMES[Number(mon) - 1];
  return name ? `${name} ${year}` : year;
}

export interface ExperienceEditorProps {
  experience: ProfileExperience[];
  /** Called with the new list after any successful write. */
  onChange: (next: ProfileExperience[]) => void;
}

export function ExperienceEditor({ experience, onChange }: ExperienceEditorProps) {
  /** The row being edited, or "new" while adding, or null. */
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [form, setForm] = useState<ExperienceDraft>(BLANK);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openNew = () => {
    setForm(BLANK);
    setEditing("new");
    setError(null);
  };

  const openEdit = (role: ProfileExperience) => {
    setForm({
      title: role.title,
      company: role.company,
      location: role.location ?? "",
      startedOn: role.startedOn,
      endedOn: role.endedOn ?? "",
      description: role.description ?? "",
    });
    setEditing(role.id);
    setError(null);
  };

  const close = () => {
    setEditing(null);
    setForm(BLANK);
    setError(null);
  };

  // Checked here as well as on the server, so the common mistake is caught
  // before a round trip. The server still checks: this is a convenience, not
  // the rule.
  const invalid =
    !form.title.trim() ||
    !form.company.trim() ||
    !form.startedOn ||
    Boolean(form.endedOn && form.endedOn < form.startedOn);

  const save = async () => {
    if (invalid || busy) return;
    setBusy(true);
    setError(null);
    const payload: ExperienceDraft = {
      title: form.title.trim(),
      company: form.company.trim(),
      // "" is not a location; it is the absence of one, and the column is
      // nullable so it should hold null rather than an empty string.
      location: form.location?.trim() ? form.location.trim() : null,
      startedOn: form.startedOn,
      endedOn: form.endedOn ? form.endedOn : null,
      description: form.description?.trim() ? form.description.trim() : null,
    };
    try {
      if (editing === "new") {
        const row = await addExperience(payload);
        onChange(sorted([...experience, row]));
      } else if (editing) {
        const row = await editExperience(editing, payload);
        onChange(sorted(experience.map((r) => (r.id === editing ? row : r))));
      }
      close();
    } catch (e) {
      setError(e instanceof Error ? e.message : "That did not save. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const drop = async (id: string) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await removeExperience(id);
      onChange(experience.filter((r) => r.id !== id));
      if (editing === id) close();
    } catch (e) {
      setError(e instanceof Error ? e.message : "That did not delete. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section id="experience" className="flex flex-col gap-[10px]">
      <div className="flex items-baseline justify-between gap-[10px]">
        <span className="text-[13px] font-semibold text-text-secondary">Experience</span>
        <span className="text-[12px] text-text-muted">
          {experience.length === 0 ? "None added" : `${experience.length} added`}
        </span>
      </div>
      <span className="text-[12px] leading-[1.45] text-text-muted">
        Roles save one at a time, as soon as you confirm each one. They do not
        wait for the Save button at the bottom.
      </span>

      {experience.length > 0 ? (
        <ul className="m-0 flex list-none flex-col gap-[8px] p-0">
          {experience.map((role) => (
            <li
              key={role.id}
              className="flex items-start gap-[10px] rounded-[var(--radius-input)] border border-hairline bg-tag p-[12px]"
            >
              <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
                <span className="text-[13px] font-semibold leading-[1.3] text-text-primary">
                  {role.title}
                </span>
                <span className="text-[12.5px] leading-[1.35] text-text-secondary">
                  {role.location ? `${role.company} · ${role.location}` : role.company}
                </span>
                <span className="text-[11.5px] text-text-muted">
                  {monthLabel(role.startedOn)} to{" "}
                  {role.endedOn ? monthLabel(role.endedOn) : "Present"}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-[4px]">
                <button
                  type="button"
                  onClick={() => openEdit(role)}
                  aria-label={`Edit ${role.title}`}
                  className="grid h-[30px] w-[30px] place-items-center rounded-full border border-hairline bg-card text-text-secondary transition-colors hover:border-[var(--accent)] hover:text-text-primary"
                >
                  <Icon name="Pencil" size={13} color="currentColor" strokeWidth={2.1} />
                </button>
                <button
                  type="button"
                  onClick={() => void drop(role.id)}
                  disabled={busy}
                  aria-label={`Remove ${role.title}`}
                  className="grid h-[30px] w-[30px] place-items-center rounded-full border border-hairline bg-card text-text-secondary transition-colors hover:border-danger hover:text-danger disabled:opacity-50"
                >
                  <Icon name="Trash2" size={13} color="currentColor" strokeWidth={2.1} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {editing ? (
        <div className="flex flex-col gap-[10px] rounded-[var(--radius-input)] border border-hairline bg-card p-[14px]">
          <Input
            label="Title"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="Chief Steward"
          />
          <Input
            label="Company"
            value={form.company}
            onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
            placeholder="WAWU Africa"
          />
          <Input
            label="Location"
            value={form.location ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
            placeholder="Lagos, Nigeria"
            hint="Optional. Leave it empty if the role has no one place."
          />
          <div className="grid grid-cols-2 gap-[10px]">
            <Input
              label="Started"
              type="month"
              value={form.startedOn}
              onChange={(e) => setForm((f) => ({ ...f, startedOn: e.target.value }))}
            />
            <Input
              label="Ended"
              type="month"
              value={form.endedOn ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, endedOn: e.target.value }))}
              hint="Leave empty if you are still there."
            />
          </div>
          <label className="flex flex-col gap-2">
            <span className="text-[13px] font-semibold text-text-secondary">What you did</span>
            <textarea
              value={form.description ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
              placeholder="Optional. One or two lines."
              className="min-h-[76px] w-full resize-none rounded-[var(--radius-input)] border border-hairline bg-input px-4 py-3 text-[14px] text-text-primary outline-none transition-colors placeholder:text-[var(--text-disabled)] focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </label>

          {/* Stated, not just disabled: a button that will not press with no
              reason given is the thing people report as broken. */}
          {form.endedOn && form.startedOn && form.endedOn < form.startedOn ? (
            <span className="text-[12px] text-danger">
              The end date is before the start date.
            </span>
          ) : null}
          {error ? <span className="text-[12px] text-danger">{error}</span> : null}

          <div className="flex items-center gap-[8px]">
            <Button onClick={() => void save()} disabled={invalid || busy} size="sm">
              {busy ? "Saving" : editing === "new" ? "Add role" : "Save role"}
            </Button>
            <Button onClick={close} variant="secondary" size="sm" disabled={busy}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button onClick={openNew} variant="secondary" size="sm" icon="Plus">
          Add a role
        </Button>
      )}
    </section>
  );
}

/**
 * The SERVER'S order, kept locally so the list does not jump when the page is
 * next read: current roles first, then newest first.
 */
function sorted(rows: ProfileExperience[]): ProfileExperience[] {
  return [...rows].sort((a, b) => {
    if (a.current !== b.current) return a.current ? -1 : 1;
    return b.startedOn.localeCompare(a.startedOn);
  });
}
