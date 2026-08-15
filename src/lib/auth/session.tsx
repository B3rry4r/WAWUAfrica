"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { AccountType } from "@/types/account";
import type { SessionStatus, SessionUser } from "@/types/session";
import { fetchCurrentUser, switchAccountType } from "@/lib/api/session";

interface SessionContextValue {
  user: SessionUser | null;
  status: SessionStatus;
  /** Swaps the account type (user vs creator). Dev/testing toggle until real auth. */
  setAccountType: (type: AccountType) => Promise<void>;
  refresh: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [status, setStatus] = useState<SessionStatus>("loading");

  const refresh = useCallback(async () => {
    setStatus("loading");
    try {
      const next = await fetchCurrentUser();
      setUser(next);
      setStatus("authenticated");
    } catch {
      setUser(null);
      setStatus("anonymous");
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const setAccountType = useCallback(async (type: AccountType) => {
    const next = await switchAccountType(type);
    setUser(next);
  }, []);

  const value = useMemo(
    () => ({ user, status, setAccountType, refresh }),
    [user, status, setAccountType, refresh],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within a SessionProvider");
  return ctx;
}