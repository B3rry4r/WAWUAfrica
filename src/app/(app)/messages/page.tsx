"use client";

import { Inbox } from "@/components/messages/Inbox";
import { QuestionsDesktop } from "@/components/messages/QuestionsDesktop";
import { useCreatorState } from "@/lib/auth/use-creator-state";
import { creatorGates } from "@/lib/auth/gates";
import { FlowHeader } from "@/components/layout/FlowHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Feedback";

/**
 * Client Component: the gate below needs the real, live creator state
 * (useCreatorState — a client-side GET, unavailable during SSR). Inbox/QuestionsDesktop are the CREATOR-side paid-DM inbox (fake
 * threads, "Reply now", "X to earn" copy) -- a plain user account has no
 * creator record and the real backend 403s ("creator accounts only") on
 * every one of the endpoints they call. Gate on account type the same way
 * create/page.tsx gates uploading, rather than letting a fan fall through
 * to creator-only UI backed by nothing real.
 */
export default function MessagesPage() {
  const { creator, resolved } = useCreatorState();
  const gates = creatorGates({ creator });

  // Skeleton until the SERVER has answered whether this account is a creator
  // (`resolved` covers session hydration too). Hydration alone let the
  // sign-in-time snapshot decide, so a creator who subscribed later was told
  // "This inbox is for creators" about their own inbox.
  if (!resolved) {
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
