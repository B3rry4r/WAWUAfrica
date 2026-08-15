import type { AccountType } from "@/types/account";
import type { SessionUser } from "@/types/auth";

/**
 * In-memory session store (frontend-only test mode).
 *
 * Deliberately NOT persisted: the app always boots to the landing page and
 * only enters the authenticated home feed when the user actively signs in or
 * registers in that page-load. A page reload starts signed out again.
 *
 * When the real backend exists, restore persistence (e.g. localStorage or a
 * refresh token) here and update the SessionProvider accordingly.
 */
let token: string | null = null;
let user: SessionUser | null = null;
let accountType: AccountType | null = null;

export const sessionStorage = {
  getToken(): string | null {
    return token;
  },
  setToken(nextToken: string): void {
    token = nextToken;
  },
  getUser(): SessionUser | null {
    return user;
  },
  setUser(nextUser: SessionUser): void {
    user = nextUser;
  },
  getAccountType(): AccountType | null {
    return accountType;
  },
  setAccountType(type: AccountType): void {
    accountType = type;
  },
  clear(): void {
    token = null;
    user = null;
    accountType = null;
  },
};