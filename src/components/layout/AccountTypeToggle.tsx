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
      className="flex gap-[4px] p-[4px] rounded-[999] bg-[var(--surface-tag)] border border-[var(--border-hairline)]"
    >
      <button
        type="button"
        onClick={() => set("user")}
        className="flex-1 h-[36px] py-0 px-[18px] rounded-[999] border-[none] text-[13px] font-semibold cursor-pointer" style={{background: current === "user" ? "var(--accent)" : "transparent", color: current === "user" ? "var(--text-on-accent)" : "var(--text-secondary)", fontFamily: "var(--font-sans)"}}
      >
        User
      </button>
      <button
        type="button"
        onClick={() => set("creator")}
        className="flex-1 h-[36px] py-0 px-[18px] rounded-[999] border-[none] text-[13px] font-semibold cursor-pointer" style={{background: current === "creator" ? "var(--accent)" : "transparent", color: current === "creator" ? "var(--text-on-accent)" : "var(--text-secondary)", fontFamily: "var(--font-sans)"}}
      >
        Creator
      </button>
    </div>
  );
}
