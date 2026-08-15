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
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18, padding: "64px 28px 96px", textAlign: "center" }}>
        <span style={{ display: "grid", placeItems: "center", width: 72, height: 72, borderRadius: 999, background: "var(--surface-tag)", border: "1px solid var(--border-hairline)" }}>
          <Icon name="UserX" size={32} color="var(--text-secondary)" stroke={2} />
        </span>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--text-primary)" }}>
            Account deleted
          </span>
          <span style={{ fontSize: 13.5, lineHeight: 1.5, color: "var(--text-secondary)" }}>
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
    <div style={{ display: "flex", flexDirection: "column", gap: 18, padding: "14px 16px 96px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <ProfileBackButton compact />
        <span style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--text-primary)" }}>
          Delete account
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "16px", borderRadius: "var(--radius-card)", background: "var(--danger-tint)", border: "1px solid rgba(255,90,90,0.25)" }}>
        <span style={{ fontSize: 14.5, fontWeight: 700, color: "var(--danger)" }}>
          This can&apos;t be undone
        </span>
        <span style={{ fontSize: 13, lineHeight: 1.5, color: "var(--text-secondary)" }}>
          Your uploads, paid DMs and any unused credits are removed. Followers and members of
          your communities will see you disappear. There&apos;s no refund for time already spent.
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <label htmlFor="confirm" style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>
          Type “delete” to confirm
        </label>
        <input
          id="confirm"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="delete"
          autoCapitalize="none"
          autoCorrect="off"
          style={{
            width: "100%",
            background: "var(--surface-input)",
            border: "1px solid var(--border-hairline)",
            borderRadius: "var(--radius-input)",
            padding: "13px 16px",
            color: "var(--text-primary)",
            fontSize: 15,
            outline: "none",
          }}
        />
      </div>

      {error && (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--danger)" }}>
          <Icon name="CircleAlert" size={14} color="var(--danger)" />
          {error}
        </span>
      )}

      <Button full variant="destructive" disabled={deleting} onClick={submit}>
        {deleting ? "Deleting…" : "Delete my account"}
      </Button>
    </div>
  );
}