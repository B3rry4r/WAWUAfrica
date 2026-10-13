"use client";

import { useCallback, useEffect, useState } from "react";
import { describeError } from "@/lib/api/errors";
import { getEmailCampaign, listEmailCampaigns, listEmailRecipients } from "@/lib/api/email-campaigns";
import type { EmailCampaign, EmailRecipient, EmailRecipientStatus } from "@/lib/api/email-campaigns";

const n = (v: number) => v.toLocaleString("en-NG");
const PER_PAGE = 25;

const STATUS_FILTERS: { value: EmailRecipientStatus | undefined; label: string }[] = [
  { value: undefined, label: "All" },
  { value: "sent", label: "Sent" },
  { value: "failed", label: "Failed" },
  { value: "skipped", label: "Skipped" },
  { value: "queued", label: "Waiting" },
];

const PILL: Record<EmailRecipientStatus, string> = {
  sent: "bg-success-tint text-success",
  failed: "bg-danger-tint text-danger",
  skipped: "bg-warning-tint text-warning",
  queued: "bg-tag text-text-secondary",
};
const PILL_LABEL: Record<EmailRecipientStatus, string> = { sent: "Sent", failed: "Failed", skipped: "Skipped", queued: "Waiting" };

function when(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" });
}

function Tile({ label, value, tone, note }: { label: string; value: number; tone: string; note?: string }) {
  return (
    <div className="rounded-card border border-hairline bg-elevated px-4 py-3">
      <p className={`m-0 text-[26px] font-semibold tracking-[-0.02em] ${tone}`}>{n(value)}</p>
      <p className="m-0 text-[12.5px] font-semibold text-text-secondary">{label}</p>
      {note ? <p className="m-0 text-[11.5px] text-text-muted">{note}</p> : null}
    </div>
  );
}

/** The send history, and for one campaign: progress, the four counts and every recipient. */
export function EmailResults({ focusId }: { focusId: string | null }) {
  const [campaigns, setCampaigns] = useState<EmailCampaign[] | null>(null);
  const [selected, setSelected] = useState<string | null>(focusId);
  const [detail, setDetail] = useState<EmailCampaign | null>(null);
  const [recipients, setRecipients] = useState<EmailRecipient[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<EmailRecipientStatus | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const list = await listEmailCampaigns(1, 30);
      setCampaigns(list.items);
      setSelected((cur) => cur ?? list.items[0]?.id ?? null);
    } catch (e) {
      setError(describeError(e).body);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (focusId) setSelected(focusId);
  }, [focusId]);

  const sending = detail?.status === "sending";

  const load = useCallback(async () => {
    if (!selected) return;
    try {
      const [c, r] = await Promise.all([getEmailCampaign(selected), listEmailRecipients(selected, page, filter, PER_PAGE)]);
      setDetail(c);
      setRecipients(r.items);
      setTotal(r.total);
      setError(null);
    } catch (e) {
      setError(describeError(e).body);
    }
  }, [selected, page, filter]);

  useEffect(() => {
    void load();
  }, [load]);

  // While it is sending, look again every two seconds.
  useEffect(() => {
    if (!sending) return;
    const t = setInterval(() => {
      void load();
      void refresh();
    }, 2000);
    return () => clearInterval(t);
  }, [sending, load, refresh]);

  const done = detail ? detail.sentCount + detail.failedCount + detail.skippedCount : 0;
  const pct = detail && detail.totalCount > 0 ? Math.round((done / detail.totalCount) * 100) : 0;
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));

  return (
    <div className="grid gap-5 dt:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="flex flex-col gap-2">
        {campaigns === null ? (
          <p className="m-0 px-1 text-[13px] text-text-muted">Loading...</p>
        ) : campaigns.length === 0 ? (
          <p className="m-0 px-1 text-[13px] text-text-muted">Nothing has been sent yet.</p>
        ) : (
          campaigns.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                setSelected(c.id);
                setPage(1);
                setFilter(undefined);
              }}
              className={`rounded-button border px-3.5 py-2.5 text-left transition-colors ${
                selected === c.id ? "border-accent bg-accent-tint" : "border-hairline bg-card hover:bg-elevated"
              }`}
            >
              <span className="block truncate text-[13.5px] font-semibold text-text-primary">{c.subject}</span>
              <span className="block text-[12px] text-text-muted">
                {c.status === "ready" ? "Not sent" : c.status === "sending" ? "Sending" : "Done"} - {n(c.sentCount)} of{" "}
                {n(c.totalCount)} sent
              </span>
            </button>
          ))
        )}
      </aside>

      <section className="flex min-w-0 flex-col gap-4">
        {error ? <p className="m-0 text-[13.5px] text-danger">{error}</p> : null}
        {detail ? (
          <>
            <div className="rounded-card border border-hairline bg-card p-4">
              <p className="m-0 text-[16px] font-semibold text-text-primary">{detail.subject}</p>
              <p className="m-0 mt-0.5 text-[13px] text-text-secondary">
                {detail.audienceNote}. Template: {detail.templateName}.
              </p>
              <progress
                value={pct}
                max={100}
                aria-label="Send progress"
                className="mt-3 block h-2.5 w-full overflow-hidden rounded-chip [&::-moz-progress-bar]:bg-accent [&::-webkit-progress-bar]:bg-tag [&::-webkit-progress-value]:bg-accent [&::-webkit-progress-value]:transition-all"
              />
              <p className="m-0 mt-1.5 text-[12.5px] text-text-muted">
                {detail.status === "ready"
                  ? "Built, not sent yet."
                  : detail.status === "sending"
                    ? `Sending: ${pct}% (${n(done)} of ${n(detail.totalCount)})`
                    : `Finished ${when(detail.finishedAt)}`}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2.5 dt:grid-cols-4">
              <Tile label="Sent" value={detail.sentCount} tone="text-success" />
              <Tile label="Failed" value={detail.failedCount} tone={detail.failedCount ? "text-danger" : "text-text-primary"} />
              <Tile label="Skipped" value={detail.skippedCount} tone="text-text-primary" />
              <Tile label="Unsubscribed" value={detail.unsubscribedCount} tone="text-text-primary" note="counted in skipped" />
            </div>

            <div className="rounded-card border border-hairline bg-card p-4">
              <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter recipients">
                {STATUS_FILTERS.map((f) => (
                  <button
                    key={f.label}
                    type="button"
                    aria-pressed={filter === f.value}
                    onClick={() => {
                      setFilter(f.value);
                      setPage(1);
                    }}
                    className={`rounded-chip px-3 py-1.5 text-[12.5px] font-semibold ${
                      filter === f.value ? "bg-accent text-on-accent" : "bg-tag text-text-secondary hover:bg-elevated"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[520px] border-collapse text-left text-[13px]">
                  <thead>
                    <tr className="text-[11.5px] uppercase tracking-wide text-text-muted">
                      <th className="py-2 pr-3 font-semibold">Email</th>
                      <th className="py-2 pr-3 font-semibold">Name</th>
                      <th className="py-2 pr-3 font-semibold">Result</th>
                      <th className="py-2 font-semibold">Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recipients.map((r) => (
                      <tr key={r.id} className="border-t border-hairline">
                        <td className="py-2 pr-3 text-text-primary">{r.email}</td>
                        <td className="py-2 pr-3 text-text-secondary">{r.firstName ?? "-"}</td>
                        <td className="py-2 pr-3">
                          <span className={`rounded-chip px-2.5 py-1 text-[11.5px] font-semibold ${PILL[r.status]}`}>{PILL_LABEL[r.status]}</span>
                        </td>
                        <td className="py-2 text-text-muted">{r.error ?? (r.sentAt ? when(r.sentAt) : "")}</td>
                      </tr>
                    ))}
                    {recipients.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-4 text-text-muted">
                          Nobody here.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 flex items-center justify-between text-[12.5px] text-text-muted">
                <span>
                  Page {page} of {pages} ({n(total)} people)
                </span>
                <span className="flex gap-2">
                  <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-button border border-hairline px-3 py-1.5 font-semibold text-text-secondary disabled:opacity-40">
                    Previous
                  </button>
                  <button type="button" disabled={page >= pages} onClick={() => setPage((p) => p + 1)} className="rounded-button border border-hairline px-3 py-1.5 font-semibold text-text-secondary disabled:opacity-40">
                    Next
                  </button>
                </span>
              </div>
            </div>
          </>
        ) : campaigns && campaigns.length === 0 ? null : (
          <p className="m-0 text-[13px] text-text-muted">Loading...</p>
        )}
      </section>
    </div>
  );
}
