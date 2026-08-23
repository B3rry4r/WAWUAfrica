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
  const [joinError, setJoinError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

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

  /**
   * Returns the membership the SERVER wrote, not a boolean. A private
   * community records a `pending` request the host has to approve, and until
   * they do the member cannot read or post — flipping `joined: true` on that
   * answer (which is what this did) dropped the requester into a room the
   * backend then refused every message from.
   */
  const doJoin = useCallback(async () => {
    if (!community) return null;
    setJoinError(null);
    try {
      const status = await joinCommunity(community.id);
      setCommunity((c) =>
        c ? { ...c, joined: status === "joined", pending: status === "pending" } : c,
      );
      return status;
    } catch (e) {
      // A real backend rejection (e.g. joining a nonexistent id) must show
      // up as a real failure, not a fake "joined" state.
      setJoinError(e instanceof Error ? e.message : "Couldn't join this community. Try again.");
      return null;
    }
  }, [community]);

  /**
   * Sends one message: text, a photo, or both — never neither, which the
   * server rejects. Either way it is ONE message and costs ONE credit; the
   * balance is decremented by exactly 1 regardless of what is in it.
   */
  const send = useCallback(
    async (text: string, imageUrl: string | null = null) => {
      const trimmed = text.trim();
      if (!community || (!trimmed && !imageUrl) || sending || balance < 1) return false;
      setSending(true);
      setSendError(null);
      try {
        const msg = await sendCommunityMessage(community.id, trimmed, imageUrl);
        setMessages((m) => [...m, msg]);
        setBalance((b) => Math.max(0, b - 1));
        return true;
      } catch (e) {
        // A real send failure (5xx, network, or a non-402 rejection) must
        // show up as a real error, not a silently-fabricated "sent" bubble
        // the recipient never received. Callers keep the drafted text so
        // nothing is lost.
        setSendError(e instanceof Error ? e.message : "Couldn't send that message. Try again.");
        return false;
      } finally {
        setSending(false);
      }
    },
    [community, sending, balance],
  );

  /**
   * Reflects a picture the host has just changed, AFTER the server confirmed
   * it (CommunityRoomImage only calls this on a successful PATCH) — so the
   * header and the tile update without a full refetch, and never show a
   * picture the server did not accept.
   */
  const applyImage = useCallback((imageUrl: string | null) => {
    setCommunity((c) => (c ? { ...c, imageUrl } : c));
  }, []);

  return {
    community,
    messages,
    balance,
    errorKind,
    load,
    doJoin,
    joinError,
    send,
    sending,
    sendError,
    applyImage,
  };
}
