"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteAccount } from "@/lib/api/settings";
import { ProfileBackButton } from "@/components/profile/ProfileBackButton";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

export default function DeleteAccountPage() {
  const router = useRouter();
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string>();
  const [deleting, setDeleting] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async () => {
    setError(undefined);
    if (confirm.trim().toLowerCase() !== "delete") {
      setError("Type “delete” exactly to confirm.");
      return;
    }
    setDeleting(true);
    await deleteAccount();
    setDeleting(false);
    setDone(true);
  };

  if (done) {
    return (
      <div className="flex flex-col items-center gap-[18px] p-[64px_28px_96px] text-center">
        <span className="grid h-[72px] w-[72px] place-items-center rounded-full border border-[var(--border-hairline)] bg-[var(--surface-tag)]">
          <Icon name="UserX" size={32} color="var(--text-secondary)" />
        </span>
        <div className="flex flex-col gap-[6px]">
          <span className="text-[20px] font-bold tracking-[-0.02em] text-[var(--text-primary)]">
            Account deleted
          </span>
          <span className="text-[13.5px] leading-[1.5] text-[var(--text-secondary)]">
            Thanks for being part of WAWU. You can always come back.
          </span>
        </div>
        <Button full onClick={() => router.push("/")}>
          Back to Home
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[18px] p-[14px_16px_96px]">
      <div className="flex items-center gap-[10px]">
        <ProfileBackButton compact />
        <span className="text-[18px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
          Delete account
        </span>
      </div>

      <div className="flex flex-col gap-[10px] rounded-[var(--radius-card)] border border-[rgba(255,90,90,0.25)] bg-[var(--danger-tint)] p-4">
        <span className="text-[14.5px] font-bold text-[var(--danger)]">
          This can&apos;t be undone
        </span>
        <span className="text-[13px] leading-[1.5] text-[var(--text-secondary)]">
          Your uploads, paid DMs and any unused credits are removed. Followers and members of
          your communities will see you disappear. There&apos;s no refund for time already spent.
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="confirm" className="text-[13px] font-semibold text-[var(--text-secondary)]">
          Type “delete” to confirm
        </label>
        <input
          id="confirm"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="delete"
          autoCapitalize="none"
          autoCorrect="off"
          className="w-full rounded-[var(--radius-input)] border border-[var(--border-hairline)] bg-[var(--surface-input)] px-4 py-[13px] text-[15px] text-[var(--text-primary)] outline-none"
        />
      </div>

      {error && (
        <span className="inline-flex items-center gap-[6px] text-[12.5px] text-[var(--danger)]">
          <Icon name="CircleAlert" size={14} color="var(--danger)" />
          {error}
        </span>
      )}

      <Button full variant="secondary" disabled={deleting} onClick={submit}>
        {deleting ? "Deleting…" : "Delete my account"}
      </Button>
    </div>
  );
}
