"use client";

import { useRouter } from "next/navigation";
import type { AccountType } from "@/types/account";
import { ACCOUNT_TYPE_COOKIE } from "@/lib/auth/constants";

export interface AccountTypeToggleProps {
  current: AccountType;
}

/** Dev/demo control: flips the account type cookie and refreshes the frame. */
export function AccountTypeToggle({ current }: AccountTypeToggleProps) {
  const router = useRouter();

  const set = (type: AccountType) => {
    document.cookie = `${ACCOUNT_TYPE_COOKIE}=${type}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  };

  return (
    <div
      style={{
        display: "flex",
        gap: 4,
        padding: 4,
        borderRadius: 999,
        background: "var(--surface-tag)",
        border: "1px solid var(--border-hairline)",
      }}
    >
      <button
        type="button"
        onClick={() => set("user")}
        style={{
          flex: 1,
          height: 36,
          padding: "0 18px",
          borderRadius: 999,
          border: "none",
          background: current === "user" ? "var(--accent)" : "transparent",
          color: current === "user" ? "var(--text-on-accent)" : "var(--text-secondary)",
          fontSize: 13,
          fontWeight: 600,
          fontFamily: "var(--font-sans)",
          cursor: "pointer",
        }}
      >
        User
      </button>
      <button
        type="button"
        onClick={() => set("creator")}
        style={{
          flex: 1,
          height: 36,
          padding: "0 18px",
          borderRadius: 999,
          border: "none",
          background: current === "creator" ? "var(--accent)" : "transparent",
          color: current === "creator" ? "var(--text-on-accent)" : "var(--text-secondary)",
          fontSize: 13,
          fontWeight: 600,
          fontFamily: "var(--font-sans)",
          cursor: "pointer",
        }}
      >
        Creator
      </button>
    </div>
  );
}
