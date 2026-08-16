"use client";

import { useCallback, useEffect, useState } from "react";
import { getCreatorState } from "@/lib/api/auth";
import type { CreatorState } from "@/types/auth";
import { useSession } from "./session-provider";

interface UseCreatorStateResult {
  /**
   * Best data available right now: the live GET /api/hub/creator/state
   * result once it lands, the sign-in-time snapshot (SessionUser.creator)
   * until then, or null for a non-creator / creator with no CreatorState row
   * yet. Never the frozen dev mock — see src/lib/api/mocks/session.ts.
   */
  creator: CreatorState | null;
  /** True while the live refresh is in flight. `creator` may already be non-null (the snapshot) even while this is true. */
  loading: boolean;
  /** Set only on a REAL backend failure (never on "no backend configured") — see isMockModeError. `creator` still holds the last-known-good snapshot when this is set. */
  error: string | null;
  reload: () => void;
}

/**
 * Live creator tier/slots/KYC-status/subscription for the signed-in account.
 * Starts from the session's sign-in-time snapshot (instant, no loading
 * flash) then refreshes from GET /api/hub/creator/state in the background —
 * see getCreatorState()'s doc comment for why a fresh read matters here.
 */
export function useCreatorState(): UseCreatorStateResult {
  const { user, hydrated } = useSession();
  const [creator, setCreator] = useState<CreatorState | null>(user?.creator ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    setCreator(user?.creator ?? null);
  }, [user]);

  useEffect(() => {
    if (!hydrated || !user || user.accountType !== "creator") return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    getCreatorState()
      .then((state) => {
        if (!cancelled) setCreator(state);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Could not load your creator status.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, user?.wawuId, user?.accountType, reloadKey]);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  return { creator, loading, error, reload };
}
