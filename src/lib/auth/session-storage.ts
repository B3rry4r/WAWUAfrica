import type { AccountType } from "@/types/account";
import type { SessionUser } from "@/types/auth";

/**
 * Persisted session store, backed by localStorage.
 *
 * Everything lives under one JSON key so a page reload restores the signed-in
 * state (access + refresh token, user, account type) instead of dropping the
 * user back to signed-out on every navigation. All access is guarded with
 * `typeof window !== "undefined"` since this module is imported from code
 * that can run during SSR/build, where localStorage does not exist.
 *
 * Reads are synchronous (localStorage itself is synchronous) so the existing
 * lazy `useState` initializers in SessionProvider keep working unchanged.
 */
const STORAGE_KEY = "wawu-web-session";

interface PersistedSession {
  accessToken: string | null;
  refreshToken: string | null;
  user: SessionUser | null;
  accountType: AccountType | null;
}

const EMPTY_SESSION: PersistedSession = {
  accessToken: null,
  refreshToken: null,
  user: null,
  accountType: null,
};

function readSession(): PersistedSession {
  if (typeof window === "undefined") return EMPTY_SESSION;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_SESSION;
    const parsed = JSON.parse(raw) as Partial<PersistedSession>;
    return {
      accessToken: parsed.accessToken ?? null,
      refreshToken: parsed.refreshToken ?? null,
      user: parsed.user ?? null,
      accountType: parsed.accountType ?? null,
    };
  } catch {
    // Corrupt/unavailable storage — behave as signed out rather than throw.
    return EMPTY_SESSION;
  }
}

function writeSession(next: PersistedSession): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable (e.g. private mode quota) — fail silently, in-memory read still works this tick */
  }
}

function patchSession(patch: Partial<PersistedSession>): void {
  writeSession({ ...readSession(), ...patch });
}

export const sessionStorage = {
  getToken(): string | null {
    return readSession().accessToken;
  },
  setToken(nextToken: string): void {
    patchSession({ accessToken: nextToken });
  },
  getRefreshToken(): string | null {
    return readSession().refreshToken;
  },
  setRefreshToken(nextToken: string): void {
    patchSession({ refreshToken: nextToken });
  },
  getUser(): SessionUser | null {
    return readSession().user;
  },
  setUser(nextUser: SessionUser): void {
    patchSession({ user: nextUser });
  },
  getAccountType(): AccountType | null {
    return readSession().accountType;
  },
  setAccountType(type: AccountType): void {
    patchSession({ accountType: type });
  },
  clear(): void {
    writeSession(EMPTY_SESSION);
  },
};
