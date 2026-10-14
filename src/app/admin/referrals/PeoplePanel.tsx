"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui";
import { describeError } from "@/lib/api/errors";
import { setAdminToken } from "@/lib/api/notifications";
import { exportJoinPeople, listJoinPeople, NO_CODE } from "@/lib/api/referrals";
import type { JoinPerson, PeopleFilter, PersonStatus, ReferralCodeRow } from "@/lib/api/referrals";
import { formatNairaFromKobo } from "@/lib/format";

const PER_PAGE = 25;
const n = (v: number) => v.toLocaleString("en-NG");

const STATUS_LABEL: Record<PersonStatus, string> = { paid: "Paid", pending: "Not paid", failed: "To refund" };
const PILL: Record<PersonStatus, string> = {
  paid: "bg-success-tint text-success",
  pending: "bg-tag text-text-secondary",
  failed: "bg-warning-tint text-warning",
};

/** A phone as the page shows it: the last 4 digits only. */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.length <= 4 ? "****" : `**** ${digits.slice(-4)}`;
}

function when(iso: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "-" : d.toLocaleDateString("en-NG", { dateStyle: "medium" });
}

const SELECT =
  "h-[44px] w-full rounded-input border border-hairline bg-input px-3 text-[14px] text-text-primary outline-none focus:border-accent focus:ring-2 focus:ring-accent/20";

/** The people who registered: a filter by code and status, a page at a time, and the CSV of the same filter. */
export function PeoplePanel({ codes, onSignedOut }: { codes: ReferralCodeRow[]; onSignedOut: () => void }) {
  const [filter, setFilter] = useState<PeopleFilter>({ code: "", status: "" });
  const [items, setItems] = useState<JoinPerson[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // The newest load wins when filters change quickly.
  const token = useRef(0);

  const fail = useCallback(
    (e: unknown) => {
      const shown = describeError(e);
      if (shown.kind === "auth") {
        setAdminToken(null);
        onSignedOut();
        return;
      }
      setError(shown.body);
    },
    [onSignedOut],
  );

  const load = useCallback(
    async (f: PeopleFilter, p: number) => {
      const mine = ++token.current;
      setLoading(true);
      try {
        const res = await listJoinPeople(f, p, PER_PAGE);
        if (mine !== token.current) return;
        setItems((cur) => (p === 1 ? res.items : [...cur, ...res.items]));
        setTotal(res.total);
        setHasMore(res.hasMore);
        setPage(p);
        setError(null);
      } catch (e) {
        if (mine === token.current) fail(e);
      } finally {
        if (mine === token.current) setLoading(false);
      }
    },
    [fail],
  );

  useEffect(() => {
    void load(filter, 1);
  }, [filter, load]);

  async function download() {
    setExporting(true);
    setError(null);
    try {
      const file = await exportJoinPeople(filter);
      const blob = new Blob([file.content], { type: file.contentType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      fail(e);
    } finally {
      setExporting(false);
    }
  }

  return (
    <section aria-labelledby="people-title" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h2 id="people-title" className="m-0 text-[17px] font-bold text-text-primary">
            People
          </h2>
          <p className="m-0 text-[13px] text-text-muted" data-testid="people-count">
            {total === null ? "Loading..." : `${n(total)} ${total === 1 ? "person" : "people"}`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void download()}
          disabled={exporting}
          className="inline-flex h-[44px] items-center gap-2 rounded-button bg-accent px-5 text-[14px] font-semibold text-on-accent transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:bg-tag disabled:text-text-disabled"
        >
          <Icon name="Download" size={16} />
          {exporting ? "Preparing..." : "Download CSV"}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 dt:max-w-[560px]">
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-text-secondary">
          Code
          <select
            className={SELECT}
            value={filter.code}
            onChange={(e) => setFilter((f) => ({ ...f, code: e.target.value }))}
            aria-label="Filter by code"
          >
            <option value="">All codes</option>
            <option value={NO_CODE}>No code</option>
            {codes.map((c) => (
              <option key={c.id} value={c.code}>
                {c.code}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-text-secondary">
          Status
          <select
            className={SELECT}
            value={filter.status}
            onChange={(e) => setFilter((f) => ({ ...f, status: e.target.value as PeopleFilter["status"] }))}
            aria-label="Filter by status"
          >
            <option value="">All</option>
            <option value="paid">Paid</option>
            <option value="pending">Not paid</option>
            <option value="failed">To refund</option>
          </select>
        </label>
      </div>

      {error ? (
        <p role="alert" className="m-0 flex items-start gap-2 text-[13.5px] text-danger">
          <Icon name="CircleAlert" size={16} color="var(--danger)" />
          {error}
        </p>
      ) : null}

      <div className="flex flex-col rounded-card border border-hairline bg-card" data-testid="people">
        <div className="hidden grid-cols-[1.4fr_1.6fr_.8fr_.8fr_1fr_.9fr_.8fr_.9fr_.8fr] gap-3 border-b border-hairline px-4 py-2.5 text-[12px] font-bold uppercase tracking-[0.08em] text-text-muted dt:grid">
          <span>Name</span>
          <span>Email</span>
          <span>Phone</span>
          <span>City</span>
          <span>Craft</span>
          <span>Code</span>
          <span>Paid</span>
          <span>Paid on</span>
          <span>Status</span>
        </div>
        {items.length === 0 && !loading ? (
          <p className="m-0 px-4 py-5 text-[13.5px] text-text-muted">Nobody matches this filter.</p>
        ) : (
          items.map((p) => (
            <div
              key={p.id}
              className="grid grid-cols-2 items-center gap-x-3 gap-y-1 border-b border-hairline px-4 py-3.5 last:border-b-0 dt:grid-cols-[1.4fr_1.6fr_.8fr_.8fr_1fr_.9fr_.8fr_.9fr_.8fr] dt:py-3"
            >
              <div className="col-span-2 flex items-center justify-between gap-2 dt:col-span-1 dt:block">
                <span className="truncate text-[14.5px] font-semibold text-text-primary">{p.fullName}</span>
                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[12px] font-bold dt:hidden ${PILL[p.status]}`}>
                  {STATUS_LABEL[p.status]}
                </span>
              </div>
              <span className="col-span-2 truncate text-[13.5px] text-text-secondary dt:col-span-1">{p.email}</span>
              <span className="text-[13.5px] text-text-secondary">{maskPhone(p.phone)}</span>
              <span className="truncate text-right text-[13.5px] text-text-secondary dt:text-left">{p.city ?? "-"}</span>
              <span className="truncate text-[13.5px] text-text-secondary">{p.craft ?? "-"}</span>
              <span className="truncate text-right text-[13.5px] font-semibold text-text-primary dt:text-left">
                {p.referralCode ?? "No code"}
              </span>
              <span className="text-[13.5px] text-text-primary">
                {p.status === "paid" && p.paidKobo !== null ? formatNairaFromKobo(p.paidKobo) : "-"}
              </span>
              <span className="text-right text-[13.5px] text-text-secondary dt:text-left">{when(p.paidAt)}</span>
              <span className={`hidden w-fit rounded-full px-2.5 py-0.5 text-[12px] font-bold dt:inline-flex ${PILL[p.status]}`}>
                {STATUS_LABEL[p.status]}
              </span>
            </div>
          ))
        )}
        {loading && items.length === 0 ? <p className="m-0 px-4 py-5 text-[13.5px] text-text-muted">Loading...</p> : null}
      </div>

      {hasMore ? (
        <button
          type="button"
          onClick={() => void load(filter, page + 1)}
          disabled={loading}
          className="inline-flex h-[44px] items-center justify-center self-start rounded-button border border-hairline bg-card px-5 text-[14px] font-semibold text-text-primary transition-colors hover:bg-elevated disabled:text-text-disabled"
        >
          {loading ? "Loading..." : "Show more"}
        </button>
      ) : null}
    </section>
  );
}
