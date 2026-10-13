"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui";
import { describeError } from "@/lib/api/errors";
import {
  countRegistrants,
  createCsvCampaign,
  createRegistrantCampaign,
  listEmailTemplates,
  sendTestEmail,
  startEmailCampaign,
} from "@/lib/api/email-campaigns";
import type { EmailAudienceCount, EmailCampaign, EmailTemplate, RegistrantFilter } from "@/lib/api/email-campaigns";

const FILTERS: { value: RegistrantFilter; label: string }[] = [
  { value: "all", label: "Everyone who registered" },
  { value: "paid", label: "Paid" },
  { value: "not_paid", label: "Not paid" },
  { value: "opted_in", label: "Opted in to updates" },
];

const n = (v: number) => v.toLocaleString("en-NG");
const field =
  "w-full rounded-input border border-hairline bg-input px-3.5 py-3 text-[14px] text-text-primary focus:border-strong focus:outline-none";

function Tile({ label, value, tone = "text-text-primary" }: { label: string; value: number; tone?: string }) {
  return (
    <div className="rounded-card border border-hairline bg-elevated px-4 py-3">
      <p className={`m-0 text-[24px] font-semibold tracking-[-0.02em] ${tone}`}>{n(value)}</p>
      <p className="m-0 text-[12.5px] text-text-secondary">{label}</p>
    </div>
  );
}

/** Choose a template and an audience, check the number, test, then send. */
export function EmailSend({ onStarted }: { onStarted: (campaignId: string) => void }) {
  const [templates, setTemplates] = useState<EmailTemplate[] | null>(null);
  const [templateId, setTemplateId] = useState("");
  const [source, setSource] = useState<"csv" | "registrants">("csv");
  const [file, setFile] = useState<File | null>(null);
  const [filter, setFilter] = useState<RegistrantFilter>("all");
  const [limit, setLimit] = useState("");
  const [count, setCount] = useState<EmailAudienceCount | null>(null);
  const [prepared, setPrepared] = useState<EmailCampaign | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [testTo, setTestTo] = useState("");
  const [testNote, setTestNote] = useState<string | null>(null);
  const [testBusy, setTestBusy] = useState(false);

  const limitN = limit.trim() ? Math.max(1, Math.floor(Number(limit))) : undefined;
  const limitBad = limit.trim() !== "" && !Number.isFinite(Number(limit));
  const template = templates?.find((t) => t.id === templateId) ?? null;

  useEffect(() => {
    listEmailTemplates()
      .then((rows) => {
        setTemplates(rows);
        setTemplateId((cur) => cur || rows[0]?.id || "");
      })
      .catch((e) => setError(describeError(e).body));
  }, []);

  // Anything the person changes after "Prepare" makes the prepared list stale.
  useEffect(() => {
    setPrepared(null);
    setConfirm(false);
  }, [templateId, source, file, filter, limit]);

  useEffect(() => {
    if (source !== "registrants" || limitBad) return;
    let live = true;
    countRegistrants(filter, limitN)
      .then((c) => live && setCount(c))
      .catch((e) => live && setError(describeError(e).body));
    return () => {
      live = false;
    };
  }, [source, filter, limitN, limitBad]);

  async function prepare() {
    setBusy(true);
    setError(null);
    try {
      setPrepared(
        source === "csv" && file
          ? await createCsvCampaign(templateId, file, limitN)
          : await createRegistrantCampaign(templateId, filter, limitN),
      );
    } catch (e) {
      setError(describeError(e).body);
    } finally {
      setBusy(false);
    }
  }

  async function test() {
    if (!template) return;
    setTestBusy(true);
    setTestNote(null);
    try {
      await sendTestEmail({
        subject: template.subject,
        previewText: template.previewText,
        body: template.body,
        to: testTo.trim(),
      });
      setTestNote(`Test sent to ${testTo.trim()}.`);
    } catch (e) {
      setTestNote(describeError(e).body);
    } finally {
      setTestBusy(false);
    }
  }

  async function send() {
    if (!prepared) return;
    setBusy(true);
    setError(null);
    try {
      const started = await startEmailCampaign(prepared.id);
      onStarted(started.id);
    } catch (e) {
      setError(describeError(e).body);
      setConfirm(false);
    } finally {
      setBusy(false);
    }
  }

  const canPrepare = Boolean(templateId) && !limitBad && (source === "registrants" || file !== null);
  const willEmail = prepared ? prepared.queuedCount : 0;

  return (
    <div className="mx-auto grid max-w-[880px] gap-5">
      <section className="flex flex-col gap-4 rounded-card border border-hairline bg-card p-4">
        <h2 className="m-0 text-[15px] font-semibold text-text-primary">1. Template</h2>
        {templates && templates.length === 0 ? (
          <p className="m-0 text-[13.5px] text-text-secondary">Save a template first, in the Templates tab.</p>
        ) : (
          <select aria-label="Template" value={templateId} onChange={(e) => setTemplateId(e.target.value)} className={field}>
            {(templates ?? []).map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        )}
        {template ? <p className="m-0 text-[13px] text-text-muted">Subject: {template.subject}</p> : null}
      </section>

      <section className="flex flex-col gap-4 rounded-card border border-hairline bg-card p-4">
        <h2 className="m-0 text-[15px] font-semibold text-text-primary">2. Who gets it</h2>
        <div className="grid grid-cols-2 gap-2" role="group" aria-label="Audience">
          {(
            [
              ["csv", "Upload a CSV"],
              ["registrants", "People who registered on /join"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              aria-pressed={source === key}
              onClick={() => setSource(key)}
              className={`rounded-button border px-3.5 py-3 text-left text-[13.5px] font-semibold transition-colors ${
                source === key ? "border-accent bg-accent-tint text-text-primary" : "border-hairline text-text-secondary hover:bg-elevated"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {source === "csv" ? (
          <div className="flex flex-col gap-2">
            <label htmlFor="email-csv" className="text-[13px] font-semibold text-text-secondary">
              CSV file
            </label>
            <input
              id="email-csv"
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="text-[13.5px] text-text-secondary file:mr-3 file:rounded-button file:border-0 file:bg-elevated file:px-4 file:py-2.5 file:text-[13px] file:font-semibold file:text-text-primary"
            />
            <p className="m-0 text-[12px] text-text-muted">
              A header row with <code>email</code> and, if you have it, <code>first_name</code>. Other columns are ignored.
              Bad addresses, repeats and people who unsubscribed are dropped.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <label htmlFor="email-filter" className="text-[13px] font-semibold text-text-secondary">
              Which registrants
            </label>
            <select id="email-filter" value={filter} onChange={(e) => setFilter(e.target.value as RegistrantFilter)} className={field}>
              {FILTERS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
            {count ? (
              <p className="m-0 text-[13px] text-text-secondary">
                {n(count.matching)} match. {n(count.willSend)} would be emailed
                {count.unsubscribed ? `, ${n(count.unsubscribed)} skipped because they unsubscribed` : ""}.
              </p>
            ) : null}
          </div>
        )}

        <Input
          label="Limit (optional)"
          hint="Only email the first this many people. Leave empty for everyone."
          inputMode="numeric"
          value={limit}
          onChange={(e) => setLimit(e.target.value.replace(/[^0-9]/g, ""))}
          error={limitBad ? "Use a whole number." : undefined}
        />
        <button
          type="button"
          onClick={prepare}
          disabled={busy || !canPrepare}
          className="h-[44px] self-start rounded-button border border-strong bg-elevated px-5 text-[14px] font-semibold text-text-primary hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy && !prepared ? "Counting..." : prepared ? "Prepare again" : "Count recipients"}
        </button>
      </section>

      {error ? <p className="m-0 text-[13.5px] text-danger">{error}</p> : null}

      {prepared ? (
        <section className="flex flex-col gap-4 rounded-card border border-accent bg-card p-4">
          <h2 className="m-0 text-[15px] font-semibold text-text-primary">3. Check, test, send</h2>
          <p className="m-0 text-[13px] text-text-secondary">{prepared.audienceNote}</p>
          <div className="grid grid-cols-2 gap-2.5 dt:grid-cols-4">
            <Tile label="will be emailed" value={willEmail} tone="text-success" />
            <Tile label="skipped, unsubscribed" value={prepared.unsubscribedCount} />
            <Tile label="rows that were not an email" value={prepared.invalidCount} />
            <Tile label="repeated addresses" value={prepared.duplicateCount} />
          </div>

          <div className="flex flex-col gap-2 border-t border-hairline pt-4">
            <Input
              label="Send a test to yourself first"
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

          {!confirm ? (
            <button
              type="button"
              onClick={() => setConfirm(true)}
              disabled={willEmail === 0}
              className="h-[48px] self-start rounded-button bg-accent px-6 text-[15px] font-semibold text-on-accent hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              Send to {n(willEmail)} {willEmail === 1 ? "person" : "people"}
            </button>
          ) : (
            <div role="alertdialog" aria-label="Confirm send" className="rounded-card border border-strong bg-elevated p-4">
              <p className="m-0 text-[15px] font-semibold text-text-primary">
                Send &quot;{prepared.subject}&quot; to {n(willEmail)} {willEmail === 1 ? "person" : "people"} now?
              </p>
              <p className="m-0 mt-1 text-[13px] text-text-secondary">Real emails go out and there is no unsend.</p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={send}
                  disabled={busy}
                  className="h-[44px] rounded-button bg-accent px-5 text-[14px] font-semibold text-on-accent hover:bg-accent-hover disabled:opacity-50"
                >
                  {busy ? "Starting..." : "Yes, send"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirm(false)}
                  disabled={busy}
                  className="h-[44px] rounded-button border border-hairline px-5 text-[14px] font-semibold text-text-secondary hover:bg-card"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}
