"use client";

import { useCallback, useEffect, useState } from "react";
import { getCreatorState } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
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
  /**
   * False until we actually KNOW whether this account is a creator; true once
   * the live GET has settled for the signed-in account — creator state
   * returned, the documented 403/404 "plain user" answer, or a real failure.
   * Also true once the session has hydrated with nobody signed in.
   *
   * Any screen that forks on creator-vs-user MUST render a skeleton until
   * this is true, and must NOT fall back to the user branch. Before this
   * flips, `creator` is only the sign-in-time snapshot, and that snapshot is
   * exactly what is wrong for someone who became a creator after signing in:
   * they got the fan branch on first paint, complete with "Become a creator",
   * and the screen only corrected itself a beat later — usually after they
   * had already clicked.
   */
  resolved: boolean;
  /** Set only on a REAL backend failure (never on "no backend configured") — see isMockModeError. `creator` still holds the last-known-good snapshot when this is set. */
  error: string | null;
  reload: () => void;
}

/**
 * Concurrent-call dedupe. Now that the shell (sidebar, bottom bar, header) and
 * the screen inside it all have to ask "is this a creator?" before their first
 * paint, a single navigation used to mean four identical GETs in the same tick.
 * Callers that mount together share one request; anything starting after it
 * settles gets a fresh one, so this is a request coalescer, not a cache.
 */
let inFlight: { wawuId: string; promise: Promise<CreatorState | null> } | null = null;

function loadCreatorState(wawuId: string, force: boolean): Promise<CreatorState | null> {
  if (!force && inFlight?.wawuId === wawuId) return inFlight.promise;
  const promise = getCreatorState().finally(() => {
    if (inFlight?.promise === promise) inFlight = null;
  });
  inFlight = { wawuId, promise };
  return promise;
}

/**
 * Live creator tier/slots/KYC-status/subscription for the signed-in account.
 * Starts from the session's sign-in-time snapshot then refreshes from
 * GET /api/hub/creator/state in the background — see getCreatorState()'s doc
 * comment for why a fresh read matters here.
 *
 * The snapshot is fine for filling in numbers (tier, slots) a beat early. It
 * is NOT good enough to decide creator-vs-user with: wait for `resolved`
 * before rendering either branch of that fork.
 */
export function useCreatorState(): UseCreatorStateResult {
  const { user, hydrated, setCreatorState, clearCreatorState } = useSession();
  const [creator, setCreator] = useState<CreatorState | null>(user?.creator ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  // Which account the live answer below belongs to. Comparing it against the
  // account that is signed in RIGHT NOW (rather than keeping a plain boolean)
  // means a sign-out/sign-in swap re-arms the skeleton instead of letting the
  // previous account's answer stand in for the new one. null covers both "no
  // answer yet" and "answered: nobody is signed in", which agree.
  const [resolvedFor, setResolvedFor] = useState<string | null>(null);

  useEffect(() => {
    setCreator(user?.creator ?? null);
  }, [user]);

  useEffect(() => {
    // Deliberately NOT gated on the session's accountType.
    //
    // That value is written at sign-in and never revisited, so somebody who
    // became a creator afterwards — or who subscribed on another device — kept
    // a session that said "user" forever. This effect never ran for them, the
    // creator state stayed null, and every gate in the app went on offering
    // "Become a creator" to someone who had already paid. The server is the
    // authority on whether an account has creator state; ask it.
    if (!hydrated) return;
    if (!user) {
      // Hydrated with nobody signed in: that IS the answer, and it is final.
      setCreator(null);
      setResolvedFor(null);
      return;
    }
    let cancelled = false;
    const forWawuId = user.wawuId;
    setLoading(true);
    setError(null);
    // A reload() is usually asking to see the effect of something this session
    // just changed (a new DM price, a fresh subscription), so it never joins a
    // request that may have been issued before that change landed.
    loadCreatorState(forWawuId, reloadKey > 0)
      .then((state) => {
        if (cancelled) return;
        setCreator(state);
        // Fold it back into the session so the rest of the app agrees, and so
        // the correction survives a reload.
        if (state) setCreatorState(state);
      })
      .catch((e) => {
        if (cancelled) return;
        // 403 is the documented answer for an account with no CreatorState
        // row: a plain user, not a failure. 404 likewise.
        if (e instanceof ApiError && (e.status === 403 || e.status === 404)) {
          setCreator(null);
          // And drop the sign-in snapshot. Reporting null from this hook is
          // not enough: the stored session is read synchronously elsewhere
          // (src/lib/api/learn.ts), so a stale `creator` object left in
          // localStorage would keep granting creator access after the server
          // had already said no.
          clearCreatorState();
          return;
        }
        setError(e instanceof Error ? e.message : "Could not load your creator status.");
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
        // Settled one way or the other — creator state, the 403/404 "plain
        // user" answer, or a real failure. Screens forking on creator-vs-user
        // can stop showing a skeleton and commit to a branch.
        setResolvedFor(forWawuId);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, user?.wawuId, reloadKey]);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  // Note this stays true across a reload() — a manual refresh of an already
  // known account should not send every fork back to a skeleton.
  const resolved = hydrated && resolvedFor === (user?.wawuId ?? null);

  return { creator, loading, error, resolved, reload };
}
