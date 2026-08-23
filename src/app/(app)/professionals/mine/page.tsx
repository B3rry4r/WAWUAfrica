"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";
import {
  getMyApplications,
  setProfessionalListed,
} from "@/lib/api/professionals";
import { CREDENTIAL_LABEL, type MyProfessionalApplication } from "@/types/professional";
import { FlowHeader } from "@/components/layout/FlowHeader";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Callout } from "@/components/ui/Callout";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusPill } from "@/components/ui/StatusPill";

function categoryName(id: string): string {
  return CATEGORIES.find((c) => c.id === id)?.name ?? id.replace(/_/g, " ");
}

/**
 * Your professional applications, one per field.
 *
 * The whole point of this screen is that a submitted application STOPS being
 * a black hole. A pending one says it is pending, a rejected one shows the
 * reviewer's reason and offers the resubmit that replaces it, and an approved
 * one gives you the switch to step out of the directory when you are at
 * capacity — without withdrawing an approval a human already granted.
 */
export default function MyProfessionalApplicationsPage() {
  const [rows, setRows] = useState<MyProfessionalApplication[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    getMyApplications()
      .then(setRows)
      .catch(() => setFailed(true));
  }, []);

  async function toggleListed(row: MyProfessionalApplication) {
    setBusy(row.id);
    try {
      const updated = await setProfessionalListed(row.id, !row.listed);
      setRows((rs) =>
        (rs ?? []).map((r) => (r.id === row.id ? { ...r, listed: updated.listed } : r)),
      );
    } catch {
      // Leave the switch where it was. Reporting success on a write that did
      // not happen is how someone ends up believing they are hidden.
      setRows((rs) => [...(rs ?? [])]);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <FlowHeader title="Your professional listings" />

      <div className="mx-auto flex w-full max-w-[620px] flex-col gap-[14px] p-[16px_16px_110px]">
        {failed ? (
          <ErrorState
            title="We could not load your applications"
            body="Check your connection and try again."
          />
        ) : rows === null ? (
          <>
            <Skeleton variant="row" className="h-28" />
            <Skeleton variant="row" className="h-28" />
          </>
        ) : rows.length === 0 ? (
          <EmptyState
            icon="BriefcaseBusiness"
            title="You have not applied yet"
            caption="Get listed in a field so people looking for your work can find you."
            action="Apply to be listed"
            actionHref="/professionals/apply"
          />
        ) : (
          <>
            {rows.map((row) => (
              <article
                key={row.id}
                className="flex flex-col gap-[11px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[16px]"
              >
                <div className="flex items-start gap-[10px]">
                  <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
                    <span className="text-[15px] font-semibold text-[var(--text-primary)]">
                      {categoryName(row.category)}
                    </span>
                    <span className="truncate text-[13px] text-[var(--text-secondary)]">
                      {row.headline}
                    </span>
                  </div>
                  <StatusPill
                    kind={
                      row.status === "approved"
                        ? "success"
                        : row.status === "rejected"
                          ? "danger"
                          : "warning"
                    }
                  >
                    {row.status === "approved"
                      ? "Listed"
                      : row.status === "rejected"
                        ? "Turned down"
                        : "Under review"}
                  </StatusPill>
                </div>

                <div className="flex items-center gap-[8px] text-[12.5px] text-[var(--text-muted)]">
                  <Icon name="ShieldCheck" size={14} color="var(--text-muted)" strokeWidth={2} />
                  {CREDENTIAL_LABEL[row.credentialKind]}
                  {row.issuingBody ? ` · ${row.issuingBody}` : ""}
                </div>

                {row.status === "rejected" && row.rejectionReason ? (
                  <Callout tone="warning" title="Why it was turned down">
                    {row.rejectionReason}
                  </Callout>
                ) : null}

                {row.status === "pending" ? (
                  <span className="text-[12.5px] leading-[1.45] text-[var(--text-muted)]">
                    A person is checking this. You will see the outcome here,
                    with a reason if it is turned down.
                  </span>
                ) : null}

                {row.status === "approved" ? (
                  <div className="flex items-center gap-[10px] border-t border-[var(--border-hairline)] pt-[11px]">
                    <span className="flex-1 text-[13px] text-[var(--text-secondary)]">
                      {row.listed
                        ? "Showing in the directory"
                        : "Hidden — nobody can find you here"}
                    </span>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => toggleListed(row)}
                      disabled={busy === row.id}
                    >
                      {busy === row.id ? "Saving…" : row.listed ? "Hide" : "Show"}
                    </Button>
                  </div>
                ) : null}

                {row.status === "rejected" ? (
                  <Button href="/professionals/apply" size="sm" variant="secondary">
                    Apply again
                  </Button>
                ) : null}
              </article>
            ))}

            <Link
              href="/professionals/apply"
              className="flex items-center justify-center gap-[7px] rounded-[var(--radius-card)] border border-dashed border-[var(--border-hairline)] p-[14px] text-[13.5px] font-semibold text-accent no-underline hover:bg-surface-hover"
            >
              <Icon name="Plus" size={16} color="var(--accent)" strokeWidth={2.2} />
              Apply in another field
            </Link>
          </>
        )}

        {/*
          Contact is a paid DM, so a listing with paid messages switched off is
          a dead end. Said once here rather than on every card.
        */}
        <Callout tone="info" title="People reach you through paid messages">
          Your listing shows your message price and how long you have to reply.
          Set both under Messages, in Settings.
        </Callout>
      </div>
    </div>
  );
}
