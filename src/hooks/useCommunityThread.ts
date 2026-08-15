"use client";

import { useCallback, useEffect, useState } from "react";
import type { Community, CommunityMessage } from "@/types/credits";
import {
  getCommunity,
  getCommunityMessages,
  getCreditsState,
  joinCommunity,
  sendCommunityMessage,
} from "@/lib/api/communities";

// "not-found": the room genuinely doesn't exist — retrying won't help.
// "failed": the fetch itself errored — plausibly transient, offer a retry.
export type CommunityThreadErrorKind = "not-found" | "failed";

/**
 * Fetch + mutate logic for a single community's thread — the credits
 * balance, the room itself, its messages, joining, and sending. Extracted
 * from the mobile /communities/[id] page so the desktop three-pane detail
 * pane (design D14) can drive the exact same thread behaviour instead of a
 * second, forked implementation. Each caller gets its own independent
 * fetch/state, matching how Inbox/QuestionsDesktop each own their fetch for
 * the same underlying data (see messages/page.tsx) rather than lifting
 * shared state across the mobile/desktop split.
 */
export function useCommunityThread(id: string) {
  const [community, setCommunity] = useState<Community | null>(null);
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [balance, setBalance] = useState(0);
  const [errorKind, setErrorKind] = useState<CommunityThreadErrorKind | null>(null);
  const [sending, setSending] = useState(false);

  const load = useCallback(() => {
    let active = true;
    setErrorKind(null);
    Promise.all([getCommunity(id), getCommunityMessages(id), getCreditsState()])
      .then(([c, msgs, credits]) => {
        if (!active) return;
        if (!c) {
          setErrorKind("not-found");
          return;
        }
        setCommunity(c);
        setMessages(msgs);
        setBalance(credits.creditBalance);
      })
      .catch(() => active && setErrorKind("failed"));
    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => load(), [load]);

  const doJoin = useCallback(async () => {
    if (!community) return;
    await joinCommunity(community.id);
    setCommunity((c) => (c ? { ...c, joined: true } : c));
  }, [community]);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!community || !trimmed || sending || balance < 1) return;
      setSending(true);
      try {
        const msg = await sendCommunityMessage(community.id, trimmed);
        setMessages((m) => [...m, msg]);
        setBalance((b) => Math.max(0, b - 1));
      } finally {
        setSending(false);
      }
    },
    [community, sending, balance],
  );

  return { community, messages, balance, errorKind, load, doJoin, send, sending };
}
