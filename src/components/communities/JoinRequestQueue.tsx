"use client";

import { useCallback, useEffect, useState } from "react";
import type { Community, CommunityJoinRequest } from "@/types/credits";
import { approveJoinRequest, declineJoinRequest, getJoinRequests } from "@/lib/api/communities";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";

/**
 * The host's review queue for a private community.
 *
 * Until the approval endpoints existed, a private community was a dead end:
 * `POST /communities/:id/join` wrote `status: "pending"` and nothing could
 * ever flip it, so nobody could be admitted to the one room Pro charges
 * extra for. This is the screen that answers those requests.
 *
 * Approve puts them in the room. DECLINE DELETES THE REQUEST — the server
 * stores no "declined" state (see declineJoinRequest in
 * lib/api/communities.ts), so the copy here promises exactly that and no
 * more: the request goes away, and the person can ask again. Nothing on this
 * screen claims to block anybody, because nothing here does.
 */
export function JoinRequestQueue({
  community,
  onChanged,
}: {
  community: Community;
  /** Fires after a real approve/decline so the caller can refresh counts. */
  onChanged?: () => void;
}) {
  const [requests, setRequests] = useState<CommunityJoinRequest[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(() => {
    let active = true;
    setError(null);
    getJoinRequests(community.id)
      .then((rows) => active && setRequests(rows))
      .catch((e) => {
        if (!active) return;
        setError(e instanceof Error ? e.message : "We couldn't load the requests.");
      });
    return () => {
      active = false;
    };
  }, [community.id]);

  useEffect(() => load(), [load]);

  const act = async (wawuId: string, action: "approve" | "decline") => {
    setBusyId(wawuId);
    setActionError(null);
    try {
      if (action === "approve") {
        await approveJoinRequest(community.id, wawuId);
      } else {
        await declineJoinRequest(community.id, wawuId);
      }
      // Drop the row only after the server confirmed. A 409 ("already
      // approved elsewhere") is a real answer the host needs to see, not
      // something to hide behind an optimistic removal.
      setRequests((rows) => (rows ?? []).filter((r) => r.user.wawuId !== wawuId));
      onChanged?.();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "That didn't go through. Try again.");
      // The server may have moved on without us (approved from another
      // device); refetch so the queue stops showing a stale row.
      load();
    } finally {
      setBusyId(null);
    }
  };

  if (error) {
    return <ErrorState title="Couldn't load the requests" body={error} onRetry={load} />;
  }

  if (requests === null) {
    return (
      <div className="flex flex-col gap-[10px]">
        <Skeleton variant="row" className="h-[64px]" />
        <Skeleton variant="row" className="h-[64px]" />
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <EmptyState
        icon="Inbox"
        title="No one is waiting"
        caption={
          community.kind === "private"
            ? "Requests to join this room land here. You decide who gets in."
            : "This room is open. Anyone can join it instantly, so there is nothing to approve."
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-[10px]">
      {actionError && <p className="m-0 text-[13px] text-[var(--danger)]">{actionError}</p>}
      {requests.map((r) => {
        // GAP: the server returns the requester's handle when they have set
        // one and null otherwise (there is no display-name join on this
        // endpoint), so the wawuId is the honest fallback — never a made-up
        // name. See CommunityJoinRequest in types/credits.ts.
        const label = r.user.handle ? `@${r.user.handle}` : r.user.wawuId;
        const busy = busyId === r.user.wawuId;
        return (
          <div
            key={r.user.wawuId}
            className="flex flex-wrap items-center gap-[11px] rounded-input border border-hairline bg-elevated px-[13px] py-[12px]"
          >
            <Avatar initial={(r.user.handle ?? r.user.wawuId).charAt(0).toUpperCase()} size={36} />
            <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
              <span className="truncate text-[14px] font-semibold text-text-primary">{label}</span>
              <span className="truncate text-[12.5px] text-text-muted">Asked {waitedFor(r.requestedAt)}</span>
            </div>
            <div className="flex shrink-0 gap-[8px]">
              <Button size="sm" variant="secondary" disabled={busy} onClick={() => act(r.user.wawuId, "decline")}>
                Decline
              </Button>
              <Button size="sm" loading={busy} disabled={busy} onClick={() => act(r.user.wawuId, "approve")}>
                Approve
              </Button>
            </div>
          </div>
        );
      })}
      <p className="m-0 px-[2px] text-[12px] leading-[1.5] text-text-muted">
        Approving lets someone read and post here. Declining removes the request. It does not block them, so they can
        ask again.
      </p>
    </div>
  );
}

/** "3 days ago" / "5 hours ago" / "just now" from the server's ISO timestamp. */
function waitedFor(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return "recently";
  const minutes = Math.floor(ms / 60000);
  if (minutes < 2) return "just now";
  if (minutes < 60) return `${minutes} minutes ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} ${days === 1 ? "day" : "days"} ago`;
}
