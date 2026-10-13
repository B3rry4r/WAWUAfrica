"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui";
import { describeError } from "@/lib/api/errors";
import {
  createEmailTemplate,
  deleteEmailTemplate,
  listEmailTemplates,
  previewEmail,
  sendTestEmail,
  updateEmailTemplate,
} from "@/lib/api/email-campaigns";
import type { EmailPreview, EmailTemplate } from "@/lib/api/email-campaigns";

const STARTER = {
  name: "Join invite",
  subject: "Hi {{first_name}}, your place at WAWU is waiting",
  previewText: "Register for the launch and the conference",
  body:
    "Hi {{first_name}},\n\nYou signed up on a WAWU platform, so you are among the first to hear this. Register for the launch and the conference here:\n\n[Join WAWU]({{join_link}})\n\nSee you there.",
};

type Draft = typeof STARTER;
type Width = "phone" | "desktop";

const field =
  "w-full rounded-input border border-hairline bg-input px-3.5 py-3 text-[14px] leading-relaxed text-text-primary placeholder:text-text-muted focus:border-strong focus:outline-none";

/** Template list, editor and a live preview of the final email. */
export function EmailTemplates() {
  const [templates, setTemplates] = useState<EmailTemplate[] | null>(null);
  const [selected, setSelected] = useState<string | "new">("new");
  const [version, setVersion] = useState<number | undefined>(undefined);
  const [draft, setDraft] = useState<Draft>(STARTER);
  const [saved, setSaved] = useState<Draft>(STARTER);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const [width, setWidth] = useState<Width>("phone");
  const [sampleName, setSampleName] = useState("Ada");
  const [preview, setPreview] = useState<EmailPreview | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const [testTo, setTestTo] = useState("");
  const [testNote, setTestNote] = useState<string | null>(null);
  const [testBusy, setTestBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setTemplates(await listEmailTemplates());
    } catch (e) {
      setError(describeError(e).body);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  // The preview is the Hub's own render, so it is what recipients get.
  const seq = useRef(0);
  useEffect(() => {
    const mine = ++seq.current;
    const t = setTimeout(() => {
      previewEmail({ subject: draft.subject, previewText: draft.previewText, body: draft.body, firstName: sampleName.trim() || undefined })
        .then((p) => {
          if (seq.current !== mine) return;
          setPreview(p);
          setPreviewError(null);
        })
        .catch((e) => {
          if (seq.current === mine) setPreviewError(describeError(e).body);
        });
    }, 350);
    return () => clearTimeout(t);
  }, [draft, sampleName]);

  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);

  function open(t: EmailTemplate | "new") {
    setError(null);
    setNote(null);
    setTestNote(null);
    if (t === "new") {
      setSelected("new");
      setVersion(undefined);
      setDraft(STARTER);
      setSaved(STARTER);
      return;
    }
    const d = { name: t.name, subject: t.subject, previewText: t.previewText, body: t.body };
    setSelected(t.id);
    setVersion(t.version);
    setDraft(d);
    setSaved(d);
  }

  async function save() {
    setBusy(true);
    setError(null);
    setNote(null);
    try {
      const row =
        selected === "new"
          ? await createEmailTemplate(draft)
          : await updateEmailTemplate(selected, { ...draft, version });
      setSelected(row.id);
      setVersion(row.version);
      setSaved(draft);
      setNote("Saved.");
      await load();
    } catch (e) {
      setError(describeError(e).body);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (selected === "new") return;
    if (!window.confirm("Delete this template? Campaigns already built from it are not changed.")) return;
    setBusy(true);
    try {
      await deleteEmailTemplate(selected);
      open("new");
      await load();
    } catch (e) {
      setError(describeError(e).body);
    } finally {
      setBusy(false);
    }
  }

  async function test() {
    setTestBusy(true);
    setTestNote(null);
    try {
      await sendTestEmail({
        subject: draft.subject,
        previewText: draft.previewText,
        body: draft.body,
        firstName: sampleName.trim() || undefined,
        to: testTo.trim(),
      });
      setTestNote(`Test sent to ${testTo.trim()}.`);
    } catch (e) {
      setTestNote(describeError(e).body);
    } finally {
      setTestBusy(false);
    }
  }

  const set = (k: keyof Draft) => (e: { target: { value: string } }) =>
    setDraft((d) => ({ ...d, [k]: e.target.value }));

  return (
    <div className="grid gap-5 dt:grid-cols-[220px_minmax(0,1fr)_minmax(0,1fr)]">
      <aside className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => open("new")}
          className={`rounded-button border px-3.5 py-2.5 text-left text-[13.5px] font-semibold transition-colors ${
            selected === "new" ? "border-accent bg-accent-tint text-text-primary" : "border-hairline bg-card text-text-secondary hover:bg-elevated"
          }`}
        >
          + New template
        </button>
        {templates === null ? (
          <p className="m-0 px-1 text-[13px] text-text-muted">Loading...</p>
        ) : templates.length === 0 ? (
          <p className="m-0 px-1 text-[13px] text-text-muted">No saved templates yet.</p>
        ) : (
          templates.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => open(t)}
              className={`rounded-button border px-3.5 py-2.5 text-left transition-colors ${
                selected === t.id ? "border-accent bg-accent-tint" : "border-hairline bg-card hover:bg-elevated"
              }`}
            >
              <span className="block truncate text-[13.5px] font-semibold text-text-primary">{t.name}</span>
              <span className="block truncate text-[12px] text-text-muted">{t.subject}</span>
            </button>
          ))
        )}
      </aside>

      <section className="flex flex-col gap-3.5 rounded-card border border-hairline bg-card p-4">
        <Input label="Template name" value={draft.name} onChange={set("name")} maxLength={120} />
        <Input label="Subject" value={draft.subject} onChange={set("subject")} maxLength={200} />
        <Input
          label="Preview text"
          hint="The grey line next to the subject in an inbox."
          value={draft.previewText}
          onChange={set("previewText")}
          maxLength={200}
        />
        <div className="flex flex-col gap-2">
          <label htmlFor="email-body" className="text-[13px] font-semibold text-text-secondary">
            Message
          </label>
          <textarea id="email-body" rows={12} value={draft.body} onChange={set("body")} className={field} maxLength={20000} />
          <p className="m-0 text-[12px] leading-relaxed text-text-muted">
            Fields: {"{{first_name}}"} and {"{{join_link}}"}. Write **bold**, *italic*, [text](link) and lines starting with
            &quot;- &quot; for a list. A link on its own line becomes the purple button.
          </p>
        </div>
        {error ? <p className="m-0 text-[13px] text-danger">{error}</p> : null}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={save}
            disabled={busy || (!dirty && selected !== "new") || !draft.name.trim() || !draft.subject.trim() || !draft.body.trim()}
            className="h-[42px] rounded-button bg-accent px-5 text-[14px] font-semibold text-on-accent transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "Saving..." : selected === "new" ? "Save template" : "Save changes"}
          </button>
          {selected !== "new" ? (
            <button
              type="button"
              onClick={remove}
              disabled={busy}
              className="h-[42px] rounded-button border border-hairline px-4 text-[13.5px] font-semibold text-text-secondary hover:bg-elevated disabled:opacity-50"
            >
              Delete
            </button>
          ) : null}
          {note ? <span className="text-[13px] text-success">{note}</span> : null}
        </div>
        <div className="mt-1 flex flex-col gap-2 border-t border-hairline pt-3.5">
          <Input
            label="Send a test to yourself"
            type="email"
            inputMode="email"
            placeholder="you@example.com"
            value={testTo}
            onChange={(e) => setTestTo(e.target.value)}
          />
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={test}
              disabled={testBusy || !/^\S+@\S+\.\S+$/.test(testTo.trim())}
              className="h-[40px] rounded-button border border-strong bg-elevated px-4 text-[13.5px] font-semibold text-text-primary hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {testBusy ? "Sending..." : "Send test"}
            </button>
            {testNote ? <span className="text-[13px] text-text-secondary">{testNote}</span> : null}
          </div>
        </div>
      </section>

      <section className="flex min-w-0 flex-col gap-3 rounded-card border border-hairline bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="m-0 text-[15px] font-semibold text-text-primary">Live preview</h2>
          <div className="flex rounded-button border border-hairline p-0.5" role="group" aria-label="Preview width">
            {(["phone", "desktop"] as const).map((w) => (
              <button
                key={w}
                type="button"
                aria-pressed={width === w}
                onClick={() => setWidth(w)}
                className={`rounded-button px-3 py-1.5 text-[12.5px] font-semibold ${
                  width === w ? "bg-accent text-on-accent" : "text-text-secondary hover:bg-elevated"
                }`}
              >
                {w === "phone" ? "Phone" : "Desktop"}
              </button>
            ))}
          </div>
        </div>
        <Input label="First name in the preview" value={sampleName} onChange={(e) => setSampleName(e.target.value)} maxLength={40} />
        <div className="rounded-input border border-hairline bg-elevated px-3.5 py-2.5">
          <p className="m-0 text-[11.5px] font-semibold uppercase tracking-wide text-text-muted">Subject</p>
          <p className="m-0 mt-0.5 text-[14px] font-semibold text-text-primary">{preview?.subject ?? "..."}</p>
        </div>
        {previewError ? <p className="m-0 text-[13px] text-danger">{previewError}</p> : null}
        <div className="flex justify-center overflow-x-auto rounded-input bg-page p-3">
          <iframe
            title="Email preview"
            sandbox=""
            srcDoc={preview?.html ?? ""}
            className={`h-[620px] rounded-input border border-hairline bg-page ${width === "phone" ? "w-[375px] max-w-full" : "w-full min-w-[560px]"}`}
          />
        </div>
      </section>
    </div>
  );
}
