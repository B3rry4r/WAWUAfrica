"use client";

import { Inbox } from "@/components/messages/Inbox";
import { QuestionsDesktop } from "@/components/messages/QuestionsDesktop";
import { useSession } from "@/lib/auth/session-provider";
import { useCreatorState } from "@/lib/auth/use-creator-state";
import { creatorGates } from "@/lib/auth/gates";
import { FlowHeader } from "@/components/layout/FlowHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Feedback";

/**
 * Client Component: the gate below needs the real signed-in account type
 * (useSession/useCreatorState — localStorage-backed, unavailable during
 * SSR). Inbox/QuestionsDesktop are the CREATOR-side paid-DM inbox (fake
 * threads, "Reply now", "X to earn" copy) -- a plain user account has no
 * creator record and the real backend 403s ("creator accounts only") on
 * every one of the endpoints they call. Gate on account type the same way
 * create/page.tsx gates uploading, rather than letting a fan fall through
 * to creator-only UI backed by nothing real.
 */
export default function MessagesPage() {
  const { user, hydrated } = useSession();
  const { creator } = useCreatorState();
  const gates = creatorGates(user ? { accountType: user.accountType, creator } : null);

  if (!hydrated) {
    return (
      <div className="flex flex-col min-h-[100%]">
        <FlowHeader title="Messages" />
        <div className="flex flex-col gap-[12px] p-[16px]">
          <Skeleton height={80} radius="var(--radius-card)" />
          <Skeleton height={80} radius="var(--radius-card)" />
        </div>
      </div>
    );
  }

  if (!gates.isCreator) {
    return (
      <div className="flex flex-col min-h-[100%]">
        <FlowHeader title="Messages" />
        <EmptyState
          icon="Inbox"
          title="This inbox is for creators"
          caption="Paid conversations you've started with creators live in your purchases, not here. Message a creator from their profile to start one."
          action="Go to your purchases"
          actionHref="/purchases"
        />
      </div>
    );
  }

  return (
    <>
      {/* Mobile inbox list, unchanged below xl: — the desktop three-pane
          view below replaces it at xl and up (design D8). */}
      <div className="xl:hidden">
        <Inbox />
      </div>
      <QuestionsDesktop />
    </>
  );
}
