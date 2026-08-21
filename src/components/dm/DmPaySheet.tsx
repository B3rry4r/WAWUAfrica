"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { sendPaidDm } from "@/lib/api/dm";
import { formatNaira } from "@/lib/format";
import { Avatar, Button, Icon, Sheet, VerificationBadge } from "@/components/ui";
import type { VerificationLevel } from "@/types/account";

/**
 * "failure" means nothing was charged. "unconfirmed" is the opposite case:
 * checkout completed and the money moved, but the server-side verify that
 * creates the thread failed afterwards. Retrying an unconfirmed charge would
 * charge the fan a second time, so the two states must not share a screen.
 */
type Phase = "compose" | "processing" | "success" | "failure" | "unconfirmed";


export interface DmCreator {
  wawuId: string;
  name: string;
  handle: string;
  dmPrice: number;
  /**
   * The creator's rung on the PUBLIC verification ladder (VerificationSubmission,
   * /api/hub/verification/*) — never their KYC status, which is private to them
   * and gates payouts, not trust. This sheet used to render a hardcoded
   * `verified_user` tick beside every creator's name, so an unverified creator
   * was shown to a fan, at the moment they were about to pay, as verified.
   * Omitted defaults to "basic", which renders no badge at all.
   */
  verification?: VerificationLevel;
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
      } else if (res.result === "cancelled") {
        // Checkout dismissed — nothing charged, nothing sent. Return to the
        // composed message instead of showing a payment failure.
        setPhase("compose");
      } else if (res.result === "verify_failed") {
        setPhase("unconfirmed");
      } else {
        setPhase("failure");
      }
    } catch {
      setPhase("failure");
    }
  };

  return (
    <Sheet open={open} onClose={onClose} title="Message" caption="Paid message, read by the creator directly.">
      {!creator ? null : phase === "compose" ? (
        <div className="flex flex-col gap-[16px]">
          <div className="flex items-center gap-[10px]">
            <Avatar initial={creator.name.charAt(0)} size={36} />
            <span className="flex items-center gap-[6px] text-[15px] font-semibold text-[var(--text-primary)]">
              {creator.name}
              <VerificationBadge tier={creator.verification ?? "basic"} size={15} />
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
              {formatNaira(creator.dmPrice)}
            </span>
          </div>
          <p className="m-0 text-[12.5px] leading-[1.5] text-[var(--text-muted)]">
            {creator.name.split(" ")[0]} has 24 hours to reply. If not, you’re refunded automatically. No questions.
          </p>
          <Button full disabled={!text.trim()} onClick={pay}>
            Send message · {formatNaira(creator.dmPrice)}
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
      ) : phase === "unconfirmed" ? (
        <div className="flex flex-col gap-[14px] p-[8px_0_4px] text-center">
          <span className="mx-auto grid h-[56px] w-[56px] place-items-center rounded-full border border-[rgba(255,183,3,0.32)] bg-[var(--warning-tint)]">
            <Icon name="Clock" size={26} color="var(--warning)" />
          </span>
          <div className="flex flex-col gap-[5px]">
            <span className="text-[17px] font-bold text-[var(--text-primary)]">
              Payment went through, we could not confirm it
            </span>
            <span className="text-[13.5px] leading-[1.5] text-[var(--text-secondary)]">
              {formatNaira(creator.dmPrice)} left your account and we could not finish opening the conversation. You have
              not been charged twice. Check your messages in a moment, or tell support and they will sort it.
            </span>
          </div>
          <div className="mt-[6px] flex gap-[10px]">
            <Button full variant="secondary" href="mailto:hello@wawuafrica.com">
              Contact support
            </Button>
            <Button
              full
              onClick={() => {
                onClose();
                router.push("/messages");
              }}
            >
              Open messages
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
              Your bank didn’t confirm the payment. Nothing was charged. Try again.
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
