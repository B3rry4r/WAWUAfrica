"use client";

import { useCallback, useEffect, useState } from "react";
import { Icon } from "@/components/ui";
import { describeError } from "@/lib/api/errors";
import { formatNairaFromKobo } from "@/lib/format";
import { getJoinSummary, listReferralCodes } from "@/lib/api/referrals";
import { getAdminRole, setAdminToken } from "@/lib/api/notifications";
import { canChangeReferralCodes } from "@/lib/admin-role";
import type { JoinSummary, ReferralCodeRow } from "@/lib/api/referrals";
import { CodesPanel } from "./CodesPanel";
import { PeoplePanel } from "./PeoplePanel";

const n = (v: number) => v.toLocaleString("en-NG");

function Tile({ label, value, note, tone }: { label: string; value: string; note?: string; tone: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-card border border-hairline bg-card px-4 py-3.5">
      <p className={`m-0 text-[28px] font-extrabold leading-[1.1] tracking-[-0.02em] ${tone}`}>{value}</p>
      <p className="m-0 text-[13px] font-semibold text-text-secondary">{label}</p>
      {note ? <p className="m-0 text-[12px] text-text-muted">{note}</p> : null}
    </div>
  );
}

/** A bar for a share, drawn as an SVG so its width is an attribute and not a style. */
function Share({ part, whole }: { part: number; whole: number }) {
  const pct = whole > 0 ? Math.max(part > 0 ? 2 : 0, Math.round((part / whole) * 100)) : 0;
  return (
    <svg aria-hidden="true" className="h-2 w-full overflow-hidden rounded-full" preserveAspectRatio="none">
      <rect width="100%" height="100%" className="fill-[var(--tag)]" />
      <rect width={`${pct}%`} height="100%" className="fill-[var(--accent)]" />
    </svg>
  );
}

/**
 * The page after sign-in: the whole offer in numbers (counted by the server,
 * every paid registration since it opened, with or without a code), the codes,
 * and the people. Reading is for superadmin, finance and support; changing a
 * code is superadmin only, and the Hub says no to anyone else. The page does not
 * draw the controls that change a code for a role that cannot use them.
 */
export function ReferralsDashboard({ onSignedOut }: { onSignedOut: () => void }) {
  const [summary, setSummary] = useState<JoinSummary | null>(null);
  const [codes, setCodes] = useState<ReferralCodeRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Read once per sign-in: the page mounts only after the token is read from storage, and a new sign-in mounts it again.
  const [canWrite] = useState(() => canChangeReferralCodes(getAdminRole()));

  const refresh = useCallback(async () => {
    try {
      const [s, c] = await Promise.all([getJoinSummary(), listReferralCodes()]);
      setSummary(s);
      setCodes(c);
      setError(null);
    } catch (e) {
      const shown = describeError(e);
      if (shown.kind === "auth") {
        setAdminToken(null);
        onSignedOut();
        return;
      }
      setError(shown.body);
    }
  }, [onSignedOut]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const people = summary?.paid.people ?? 0;

  return (
    <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-8 px-4 pb-16 pt-5">
      <nav className="flex flex-wrap gap-2" aria-label="Admin">
        <a
          href="/admin/notifications"
          className="rounded-button bg-card px-4 py-2 text-[14px] font-semibold text-text-secondary transition-colors hover:bg-elevated"
        >
          Push
        </a>
        <a
          href="/admin/notifications#email"
          className="rounded-button bg-card px-4 py-2 text-[14px] font-semibold text-text-secondary transition-colors hover:bg-elevated"
        >
          Email
        </a>
        <span className="rounded-button bg-accent px-4 py-2 text-[14px] font-semibold text-on-accent" aria-current="page">
          Referrals
        </span>
      </nav>

      <header className="flex flex-col gap-1">
        <h1 className="m-0 text-[24px] font-extrabold tracking-[-0.02em] text-text-primary dt:text-[30px]">
          Referral codes and registrations
        </h1>
        <p className="m-0 text-[14px] text-text-secondary">Every figure is counted by the server.</p>
      </header>

      {error ? (
        <p role="alert" className="m-0 flex items-start gap-2 text-[13.5px] text-danger">
          <Icon name="CircleAlert" size={16} color="var(--danger)" />
          {error}
        </p>
      ) : null}

      <section aria-labelledby="totals-title" className="flex flex-col gap-4">
        <h2 id="totals-title" className="m-0 text-[17px] font-bold text-text-primary">
          The whole offer
        </h2>
        {summary === null ? (
          <p className="m-0 text-[13.5px] text-text-muted">Loading...</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 dt:grid-cols-4" data-testid="totals">
              <Tile label="People paid" value={n(summary.paid.people)} tone="text-text-primary" />
              <Tile label="Money paid" value={formatNairaFromKobo(summary.paid.kobo)} tone="text-accent-soft" />
              <Tile
                label="Second payments to refund"
                value={n(summary.failed.people)}
                note={summary.failed.people > 0 ? `${formatNairaFromKobo(summary.failed.kobo)}, not counted as money paid` : undefined}
                tone="text-warning"
              />
              <Tile label="Started, not paid" value={n(summary.unpaid)} tone="text-text-secondary" />
            </div>

            <div className="flex flex-col rounded-card border border-hairline bg-card" data-testid="split">
              <div className="hidden grid-cols-[1.2fr_1.2fr_.7fr_1fr_1.4fr] gap-3 border-b border-hairline px-4 py-2.5 text-[12px] font-bold uppercase tracking-[0.08em] text-text-muted dt:grid">
                <span>Code</span>
                <span>Community</span>
                <span>People</span>
                <span>Money paid</span>
                <span>Share of people</span>
              </div>
              {summary.split.map((row) => (
                <div
                  key={row.code ?? "none"}
                  data-testid={row.code === null ? "split-no-code" : `split-${row.code}`}
                  className="grid grid-cols-2 items-center gap-x-3 gap-y-1 border-b border-hairline px-4 py-3 last:border-b-0 dt:grid-cols-[1.2fr_1.2fr_.7fr_1fr_1.4fr]"
                >
                  <span className="text-[15px] font-bold text-text-primary">{row.code ?? "No code"}</span>
                  <span className="truncate text-right text-[14px] text-text-secondary dt:text-left">
                    {row.community ?? "Everyone who used no code"}
                  </span>
                  <span className="text-[14px] text-text-primary">
                    <span className="text-text-muted dt:hidden">People </span>
                    {n(row.people)}
                  </span>
                  <span className="text-right text-[14px] text-text-primary dt:text-left">{formatNairaFromKobo(row.kobo)}</span>
                  <span className="col-span-2 dt:col-span-1">
                    <Share part={row.people} whole={people} />
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      <CodesPanel codes={codes} canWrite={canWrite} onChanged={refresh} />
      <PeoplePanel codes={codes ?? []} onSignedOut={onSignedOut} />
    </div>
  );
}
