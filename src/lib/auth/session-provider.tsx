"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { AccountType } from "@/types/account";
import type { SessionUser } from "@/types/auth";
import { sessionStorage } from "./session-storage";

interface SessionContextValue {
  user: SessionUser | null;
  accountType: AccountType | null;
  isAuthenticated: boolean;
  signInUser: (user: SessionUser, token: string) => void;
  signOut: () => void;
  setAccountType: (type: AccountType) => void;
  setInterests: (interests: string[]) => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  // Lazy initializers read the current session synchronously on first render,
  // so a client-side navigation after sign-in shows the feed immediately with
  // no landing-page flash. The store is in-memory, so a fresh page load starts
  // signed out on the landing page.
  const [user, setUser] = useState<SessionUser | null>(() => sessionStorage.getUser());
  const [accountType, setAccountTypeState] = useState<AccountType | null>(() => sessionStorage.getAccountType());

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

  const value = useMemo<SessionContextValue>(
    () => ({
      user,
      accountType,
      isAuthenticated: user !== null,
      signInUser,
      signOut,
      setAccountType,
      setInterests,
    }),
    [user, accountType, signInUser, signOut, setAccountType, setInterests],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}