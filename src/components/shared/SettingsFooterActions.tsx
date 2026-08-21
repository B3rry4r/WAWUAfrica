"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth/session-provider";

/**
 * Footer actions below the settings groups: Sign out and Delete account,
 * side by side with no card/header — matches the design's footer-actions
 * row rather than a ListRow group.
 */
export function SettingsFooterActions() {
  const router = useRouter();
  const { signOut } = useSession();

  return (
    <div className="flex items-center gap-[18px] p-[2px_4px]">
      <button
        type="button"
        className="text-[14px] font-semibold text-[var(--text-primary)] hover:text-accent-hover"
        onClick={() => {
          signOut();
          router.push("/sign-in");
        }}
      >
        Sign out
      </button>
      <Link
        href="/settings/delete-account"
        className="text-[14px] font-semibold text-[var(--danger)] transition-colors hover:text-danger-hover"
      >
        Delete account
      </Link>
    </div>
  );
}
