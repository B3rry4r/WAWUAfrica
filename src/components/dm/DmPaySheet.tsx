"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { sendPaidDm } from "@/lib/api/dm";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { VerificationBadge } from "@/components/ui/VerificationBadge";
import { Icon } from "@/components/ui/Icon";

type Phase = "compose" | "processing" | "success" | "failure";

export interface DmCreator {
  wawuId: string;
  name: string;
  handle: string;
  dmPrice: number;
}

/** Compose → pay → processing → success/failure. One sheet, four states. */
export function DmPaySheet({
  open,
  onClose,
  creator,
}: {
  open: boolean;
  onClose: () => void;
  creator: DmCreator | null;
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [phase, setPhase] = useState<Phase>("compose");
  const [threadId, setThreadId] = useState<string>();

  useEffect(() => {
    if (open) {
      setText("");
      setPhase("compose");
      setThreadId(undefined);
    }
  }, [open]);

  const pay = async () => {
    if (!creator || !text.trim()) return;
    setPhase("processing");
    try {
      const res = await sendPaidDm(
        { wawuId: creator.wawuId, name: creator.name, handle: creator.handle },
        text.trim(),
        creator.dmPrice,
      );
      if (res.result === "success") {
        setThreadId(res.threadId);
        setPhase("success");
      } else {
        setPhase("failure");
      }
    } catch {
      setPhase("failure");
    }
  };

  return (
    <Sheet open={open} onClose={onClose} title="Message" caption="Paid message — read by the creator directly.">
      {!creator ? null : phase === "compose" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Avatar initial={creator.name.charAt(0)} size={36} />
            <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>
              {creator.name}
              <VerificationBadge size={15} />
            </span>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Ask a question…"
            rows={4}
            style={{
              width: "100%",
              background: "var(--surface-input)",
              border: "1px solid var(--border-hairline)",
              borderRadius: "var(--radius-input)",
              padding: "14px 16px",
              color: "var(--text-primary)",
              fontSize: 15,
              fontFamily: "var(--font-sans)",
              lineHeight: 1.5,
              resize: "none",
              outline: "none",
            }}
          />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 14px",
              borderRadius: "var(--radius-input)",
              background: "var(--surface-tag)",
              border: "1px solid var(--border-hairline)",
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>Message price</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", fontFeatureSettings: "var(--font-feature-tabular)" }}>
              ₦{creator.dmPrice.toLocaleString("en-NG")}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5, color: "var(--text-muted)" }}>
            {creator.name.split(" ")[0]} has 24 hours to reply. If not, you’re refunded automatically — no questions.
          </p>
          <Button full disabled={!text.trim()} onClick={pay}>
            Send message · ₦{creator.dmPrice.toLocaleString("en-NG")}
          </Button>
        </div>
      ) : phase === "processing" ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: "26px 0 14px", textAlign: "center" }}>
          <Icon name="Loader2" size={30} color="var(--accent)" stroke={2} style={{ animation: "wawuSpin 900ms linear infinite" }} />
          <span style={{ fontSize: 15.5, fontWeight: 600, color: "var(--text-primary)" }}>Opening your conversation…</span>
          <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Just a moment.</span>
        </div>
      ) : phase === "success" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "8px 0 4px", textAlign: "center" }}>
          <span
            style={{
              margin: "0 auto",
              display: "grid",
              placeItems: "center",
              width: 56,
              height: 56,
              borderRadius: 999,
              background: "var(--success-tint)",
              border: "1px solid rgba(184,232,62,0.35)",
            }}
          >
            <Icon name="Check" size={26} color="var(--success)" stroke={2.6} />
          </span>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <span style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)" }}>Your message is in</span>
            <span style={{ fontSize: 13.5, lineHeight: 1.5, color: "var(--text-secondary)" }}>
              You’ll be notified when {creator.name.split(" ")[0]} replies. If there’s no reply in 24 hours, you’re
              refunded automatically.
            </span>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
            <Button full variant="secondary" onClick={onClose}>
              Done
            </Button>
            <Button
              full
              onClick={() => {
                onClose();
                if (threadId) router.push(`/messages/${threadId}`);
              }}
            >
              View conversation
            </Button>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: "8px 0 4px", textAlign: "center" }}>
          <span
            style={{
              margin: "0 auto",
              display: "grid",
              placeItems: "center",
              width: 56,
              height: 56,
              borderRadius: 999,
              background: "var(--danger-tint)",
              border: "1px solid rgba(255,92,92,0.32)",
            }}
          >
            <Icon name="CircleAlert" size={26} color="var(--danger)" stroke={2} />
          </span>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <span style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)" }}>Payment failed</span>
            <span style={{ fontSize: 13.5, lineHeight: 1.5, color: "var(--text-secondary)" }}>
              Your bank didn’t confirm the payment. Nothing was charged — try again.
            </span>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
            <Button full variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button full onClick={pay}>
              Try again
            </Button>
          </div>
        </div>
      )}
    </Sheet>
  );
}