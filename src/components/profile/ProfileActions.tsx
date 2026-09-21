"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { sessionStorage } from "@/lib/auth/session-storage";
import { DmPaySheet, type DmCreator } from "@/components/dm/DmPaySheet";
import { TipSheet } from "@/components/dm/TipSheet";
import { formatNaira } from "@/lib/format";

/**
 * Fan-side action row under the header: Message (paid DM entry) + Tip.
 * Tipping has no dependency on the creator's paid-DM setting, so the Tip
 * entry point always renders. DMs off → the Message slot becomes a disabled
 * "Messages off" state with a hint, exactly per the design.
 *
 * A VISITOR WITH NO SESSION IS SENT TO SIGN UP, not into the sheet. This row
 * now appears on the PUBLIC store link (build brief C3), where there may be
 * nobody signed in at all, and both actions take money. On a real backend
 * the charge 401s; in a fixture build the mock path reported "your message is
 * in" to somebody who has no account, which is the worst of the two. C3 puts
 * registration at checkout, and paying for a message IS the checkout, so the
 * sheet is where the account is asked for.
 */
export function ProfileActions({
  creator,
  dmEnabled,
}: {
  creator: DmCreator;
  dmEnabled: boolean;
}) {
  const router = useRouter();
  const [dmOpen, setDmOpen] = useState(false);
  const [tipOpen, setTipOpen] = useState(false);

  /**
   * Read at the moment of the tap, not at render: a visitor can sign in in
   * another tab, and a value captured on mount would send an account holder
   * to sign-up.
   */
  const requireAccount = (open: () => void) => () => {
    if (sessionStorage.getToken()) {
      open();
      return;
    }
    // `next` brings them back to the profile they were on, so the trip to
    // sign-up is not also a trip away from whatever they were about to buy.
    router.push(`/sign-up?next=${encodeURIComponent(window.location.pathname)}`);
  };
  // Paid messages are only genuinely open when there is a real price to
  // charge. "On" with no price used to render a bare "Message" button that
  // opened a sheet quoting ₦0 — a price the creator never set.
  const canAsk = dmEnabled && creator.dmPrice > 0;
  return (
    <>
      <div className="flex flex-col gap-[7px] p-[0_18px_4px]">
        <div className="flex gap-2">
          <div className="flex flex-1">
            {canAsk ? (
              <Button full variant="secondary" onClick={requireAccount(() => setDmOpen(true))}>
                Message {formatNaira(creator.dmPrice)}
              </Button>
            ) : (
              <Button full variant="secondary" disabled>
                Messages off
              </Button>
            )}
          </div>
          <div className="flex w-12">
            <Button full variant="secondary" size="sm" icon="HandCoins" aria-label="Tip" onClick={requireAccount(() => setTipOpen(true))} />
          </div>
        </div>
        {!canAsk && (
          <span className="text-[12px] text-[var(--text-muted)]">
            {dmEnabled
              ? "This creator has not set a message price yet. Comment on their work instead."
              : "This creator has not switched paid messages on. Comment on their work instead."}
          </span>
        )}
      </div>
      <DmPaySheet open={dmOpen} onClose={() => setDmOpen(false)} creator={creator} />
      <TipSheet
        open={tipOpen}
        onClose={() => setTipOpen(false)}
        creator={{ wawuId: creator.wawuId, name: creator.name, avatarUrl: creator.avatarUrl }}
      />
    </>
  );
}
