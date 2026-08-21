"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { AccountType } from "@/types/account";
import type { CreatorState, SessionUser } from "@/types/auth";
import { sessionStorage } from "./session-storage";

interface SessionContextValue {
  user: SessionUser | null;
  accountType: AccountType | null;
  isAuthenticated: boolean;
  /**
   * False until the client has hydrated real session state from
   * localStorage. Server-rendered HTML and the client's very first paint
   * both always show signed-out (localStorage doesn't exist during SSR) --
   * reading it synchronously on mount used to cause a real, live-observed
   * hydration mismatch (React discarding and replacing the server HTML on
   * every authenticated page load) plus meant there was no reliable moment
   * to gate a route on auth. Callers that need to avoid a flash of
   * protected content (see RequireAuth) should wait for this to flip true
   * before deciding anything.
   */
  hydrated: boolean;
  signInUser: (user: SessionUser, token: string) => void;
  signOut: () => void;
  setAccountType: (type: AccountType) => void;
  setInterests: (interests: string[]) => void;
  /**
   * Applies the creator state the SERVER confirmed (paid tier, KYC, slots).
   * Onboarding used to flip the upload gate by mutating the dev-only mock
   * session store, which granted creator access locally whatever the backend
   * actually said. This writes the real session user instead.
   */
  setCreatorState: (creator: CreatorState) => void;
  /**
   * The server says this account has no creator state after all — drop the
   * sign-in snapshot rather than leaving it to rot.
   *
   * Without this, a session whose localStorage still held a `creator` object
   * from sign-in kept claiming creator access to every SYNCHRONOUS reader of
   * the stored session (src/lib/api/learn.ts reads
   * `creatorGates(sessionStorage.getUser())` with no await), even though the
   * live hook had already been told 403/404. Same class of bug as the stale
   * `accountType`, just pointing the other way.
   */
  clearCreatorState: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  // Deliberately NOT read synchronously here (see `hydrated` doc comment) --
  // both SSR and the client's first paint start signed-out/null, matching
  // exactly, then a mount-time effect below hydrates the real value from
  // localStorage. This trades a brief post-hydration flash for a page that
  // never mismatches server vs. client output.
  const [user, setUser] = useState<SessionUser | null>(null);
  const [accountType, setAccountTypeState] = useState<AccountType | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setUser(sessionStorage.getUser());
    setAccountTypeState(sessionStorage.getAccountType());
    setHydrated(true);
  }, []);

  const signInUser = useCallback((nextUser: SessionUser, token: string) => {
    sessionStorage.setToken(token);
    sessionStorage.setUser(nextUser);
    sessionStorage.setAccountType(nextUser.accountType);
    setUser(nextUser);
    setAccountTypeState(nextUser.accountType);
  }, []);

  const signOut = useCallback(() => {
    sessionStorage.clear();
    setUser(null);
    setAccountTypeState(null);
  }, []);

  const setAccountType = useCallback((type: AccountType) => {
    sessionStorage.setAccountType(type);
    setAccountTypeState(type);
  }, []);

  const setInterests = useCallback((interests: string[]) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, interests };
      sessionStorage.setUser(next);
      return next;
    });
  }, []);

  const setCreatorState = useCallback((creator: CreatorState) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next: SessionUser = { ...prev, accountType: "creator", creator };
      sessionStorage.setUser(next);
      return next;
    });
    sessionStorage.setAccountType("creator");
    setAccountTypeState("creator");
  }, []);

  const clearCreatorState = useCallback(() => {
    setUser((prev) => {
      if (!prev || prev.creator == null) return prev;
      const next: SessionUser = { ...prev, accountType: "user", creator: null };
      sessionStorage.setUser(next);
      return next;
    });
    sessionStorage.setAccountType("user");
    setAccountTypeState("user");
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({
      user,
      accountType,
      isAuthenticated: user !== null,
      hydrated,
      signInUser,
      signOut,
      setAccountType,
      setInterests,
      setCreatorState,
      clearCreatorState,
    }),
    [user, accountType, hydrated, signInUser, signOut, setAccountType, setInterests, setCreatorState, clearCreatorState],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}