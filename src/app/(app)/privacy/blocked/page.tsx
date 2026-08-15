"use client";

import { useCallback, useEffect, useState } from "react";
import { ProfileBackButton } from "@/components/profile/ProfileBackButton";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import type { BlockedAccount } from "@/lib/api/settings";
import { getBlockedAccounts, unblockAccount } from "@/lib/api/settings";

export default function BlockedAccountsPage() {
  const [accounts, setAccounts] = useState<BlockedAccount[] | null>(null);
  const [error, setError] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const load = useCallback(() => {
    setAccounts(null);
    setError(false);
    getBlockedAccounts()
      .then(setAccounts)
      .catch(() => setError(true));
  }, []);

  useEffect(load, [load]);

  const unblock = (id: string) => {
    setPendingId(id);
    unblockAccount(id)
      .then(() => setAccounts((prev) => (prev ? prev.filter((a) => a.id !== id) : prev)))
      .finally(() => setPendingId(null));
  };

  return (
    <div className="flex flex-col gap-[14px] p-[14px_16px_96px]">
      <div className="flex items-center gap-[10px]">
        <ProfileBackButton compact />
        <span className="text-[18px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
          Blocked accounts
        </span>
      </div>

      {error ? (
        <ErrorState title="Couldn't load blocked accounts" onRetry={load} />
      ) : !accounts ? (
        <div className="flex flex-col gap-[10px]">
          {[0, 1].map((i) => (
            <div key={i} className="h-[64px] rounded-[var(--radius-card)] bg-[var(--surface-tag)]" />
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <EmptyState icon="UserRoundX" title="No blocked accounts" caption="Anyone you block will show up here." />
      ) : (
        <div className="flex flex-col gap-[10px]">
          {accounts.map((a) => (
            <div
              key={a.id}
              className="flex items-center gap-[12px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[12px_14px]"
            >
              <Avatar initial={a.name.charAt(0)} size={40} />
              <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
                <span className="truncate text-[14.5px] font-semibold text-[var(--text-primary)]">{a.name}</span>
                <span className="truncate text-[12px] text-[var(--text-muted)]">
                  {a.handle} · Blocked {a.blockedAt}
                </span>
              </div>
              <Button size="sm" variant="secondary" loading={pendingId === a.id} onClick={() => unblock(a.id)}>
                Unblock
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
