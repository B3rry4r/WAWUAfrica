"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { sendPaidDm } from "@/lib/api/dm";
import { Avatar, Button, Icon, Sheet, VerificationBadge } from "@/components/ui";

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
        <div className="flex flex-col gap-[16px]">
          <div className="flex items-center gap-[10px]">
            <Avatar initial={creator.name.charAt(0)} size={36} />
            <span className="flex items-center gap-[6px] text-[15px] font-semibold text-[var(--text-primary)]">
              {creator.name}
              <VerificationBadge tier="verified_user" size={15} />
            </span>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Ask a question…"
            rows={4}
            className="w-full resize-none rounded-[var(--radius-input)] border border-[var(--border-hairline)] bg-[var(--surface-input)] px-[16px] py-[14px] text-[15px] leading-[1.5] text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-disabled)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
          />
          <div className="flex items-center justify-between rounded-[var(--radius-input)] border border-[var(--border-hairline)] bg-[var(--surface-tag)] p-[12px_14px]">
            <span className="text-[14px] font-semibold text-[var(--text-primary)]">Message price</span>
            <span className="text-[15px] font-bold text-[var(--text-primary)] [font-feature-settings:var(--font-feature-tabular)]">
              ₦{creator.dmPrice.toLocaleString("en-NG")}
            </span>
          </div>
          <p className="m-0 text-[12.5px] leading-[1.5] text-[var(--text-muted)]">
            {creator.name.split(" ")[0]} has 24 hours to reply. If not, you’re refunded automatically — no questions.
          </p>
          <Button full disabled={!text.trim()} onClick={pay}>
            Send message · ₦{creator.dmPrice.toLocaleString("en-NG")}
          </Button>
        </div>
      ) : phase === "processing" ? (
        <div className="flex flex-col items-center gap-[14px] p-[26px_0_14px] text-center">
          <Icon name="Loader2" size={30} color="var(--accent)" className="[animation:wawuSpin_900ms_linear_infinite]" />
          <span className="text-[15.5px] font-semibold text-[var(--text-primary)]">Opening your conversation…</span>
          <span className="text-[13px] text-[var(--text-muted)]">Just a moment.</span>
        </div>
      ) : phase === "success" ? (
        <div className="flex flex-col gap-[16px] p-[8px_0_4px] text-center">
          <span className="mx-auto grid h-[56px] w-[56px] place-items-center rounded-full border border-[rgba(184,232,62,0.35)] bg-[var(--success-tint)]">
            <Icon name="Check" size={26} color="var(--success)" strokeWidth={2.6} />
          </span>
          <div className="flex flex-col gap-[5px]">
            <span className="text-[17px] font-bold text-[var(--text-primary)]">Your message is in</span>
            <span className="text-[13.5px] leading-[1.5] text-[var(--text-secondary)]">
              You’ll be notified when {creator.name.split(" ")[0]} replies. If there’s no reply in 24 hours, you’re
              refunded automatically.
            </span>
          </div>
          <div className="mt-[6px] flex gap-[10px]">
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
        <div className="flex flex-col gap-[14px] p-[8px_0_4px] text-center">
          <span className="mx-auto grid h-[56px] w-[56px] place-items-center rounded-full border border-[rgba(255,92,92,0.32)] bg-[var(--danger-tint)]">
            <Icon name="CircleAlert" size={26} color="var(--danger)" />
          </span>
          <div className="flex flex-col gap-[5px]">
            <span className="text-[17px] font-bold text-[var(--text-primary)]">Payment failed</span>
            <span className="text-[13.5px] leading-[1.5] text-[var(--text-secondary)]">
              Your bank didn’t confirm the payment. Nothing was charged — try again.
            </span>
          </div>
          <div className="mt-[6px] flex gap-[10px]">
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
