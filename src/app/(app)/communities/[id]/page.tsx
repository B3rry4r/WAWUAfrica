"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { Community, CommunityMessage } from "@/types/credits";
import { getCommunity, getCommunityMessages, getCreditsState, joinCommunity, sendCommunityMessage } from "@/lib/api/communities";
import { ProfileBackButton } from "@/components/profile/ProfileBackButton";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { StatusPill } from "@/components/ui/StatusPill";
import { ErrorState } from "@/components/ui/ErrorState";

export default function CommunityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params?.id ?? "");

  const [community, setCommunity] = useState<Community | null>(null);
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [balance, setBalance] = useState(0);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([getCommunity(id), getCommunityMessages(id), getCreditsState()])
      .then(([c, msgs, credits]) => {
        if (!active) return;
        if (!c) {
          setError(true);
          return;
        }
        setCommunity(c);
        setMessages(msgs);
        setBalance(credits.creditBalance);
      })
      .catch(() => active && setError(true));
    return () => {
      active = false;
    };
  }, [id]);

  const doJoin = async () => {
    if (!community) return;
    await joinCommunity(community.id);
    setCommunity({ ...community, joined: true });
  };

  const send = async () => {
    if (!community || !text.trim() || sending || balance < 1) return;
    setSending(true);
    try {
      const msg = await sendCommunityMessage(community.id, text.trim());
      setMessages((m) => [...m, msg]);
      setText("");
      setBalance((b) => Math.max(0, b - 1));
    } finally {
      setSending(false);
    }
  };

  if (error) {
    return (
      <div style={{ padding: 16 }}>
        <ErrorState title="Community not found" caption="This community may have been removed." />
      </div>
    );
  }

  if (!community) {
    return (
      <div style={{ padding: 16 }}>
        <ProfileBackButton compact />
        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 16 }}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} style={{ height: 52, borderRadius: "var(--radius-input)", background: "var(--surface-tag)" }} />
          ))}
        </div>
      </div>
    );
  }

  const joined = community.joined;

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100dvh" }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: 11,
          padding: "12px 16px 10px",
          borderBottom: "1px solid var(--border-hairline)",
          background: "var(--surface-elevated)",
          position: "sticky",
          top: 0,
          zIndex: 40,
        }}
      >
        <ProfileBackButton compact />
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 1 }}>
          <span style={{ fontSize: 15.5, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.01em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {community.name}
          </span>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
            {community.memberCount.toLocaleString("en-NG")} members · host {community.host.name}
          </span>
        </div>
        {community.kind === "private" && <StatusPill kind="neutral">Private</StatusPill>}
      </header>

      {!joined ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 8, padding: "60px 28px", flex: 1 }}>
          <span
            style={{
              display: "grid",
              placeItems: "center",
              width: 64,
              height: 64,
              borderRadius: 999,
              background: "var(--accent-tint)",
              border: "1px solid var(--border-accent)",
              marginBottom: 8,
            }}
          >
            <Icon name="Lock" size={26} color="var(--accent)" stroke={1.9} />
          </span>
          <span style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>Private community</span>
          <p style={{ margin: 0, fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.5, maxWidth: 300 }}>
            {community.name} is a closed circle. Join to read and post — reading is free, sending costs one credit.
          </p>
          <Button onClick={doJoin} style={{ marginTop: 14 }}>
            Join community
          </Button>
        </div>
      ) : (
        <>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
              padding: "10px 16px",
              borderBottom: "1px solid var(--border-hairline)",
              background: "var(--surface-card)",
            }}
          >
            <Icon name="Ticket" size={15} color="var(--accent)" stroke={2} />
            <span style={{ fontSize: 12.5, color: "var(--text-secondary)" }}>
              Reading is free · sending costs <b>{balance}</b> credit{balance === 1 ? "" : "s"}
            </span>
          </div>

          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10, padding: "16px 16px 12px" }}>
            {messages.map((m) => {
              const mine = m.sender.wawuId === "wawu-me";
              return (
                <div key={m.id} style={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start" }}>
                  <div
                    style={{
                      maxWidth: "80%",
                      padding: "10px 13px",
                      borderRadius: 16,
                      borderBottomRightRadius: mine ? 4 : 16,
                      borderBottomLeftRadius: mine ? 16 : 4,
                      background: mine ? "var(--accent)" : "var(--surface-card)",
                      border: mine ? "1px solid transparent" : "1px solid var(--border-hairline)",
                      display: "flex",
                      flexDirection: "column",
                      gap: 3,
                    }}
                  >
                    {!mine && (
                      <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: "var(--accent-hover)" }}>
                        <Avatar initial={m.sender.name.charAt(0)} size={18} />
                        {m.sender.name}
                      </span>
                    )}
                    <span style={{ fontSize: 14, lineHeight: 1.45, color: mine ? "var(--text-on-accent)" : "var(--text-primary)", whiteSpace: "pre-wrap" }}>
                      {m.text}
                    </span>
                    <span style={{ fontSize: 10.5, color: mine ? "rgba(255,255,255,0.7)" : "var(--text-muted)", alignSelf: "flex-end" }}>
                      {m.sentAt}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <footer
            style={{
              position: "sticky",
              bottom: 0,
              padding: "10px 16px calc(10px + env(safe-area-inset-bottom))",
              background: "var(--surface-elevated)",
              borderTop: "1px solid var(--border-hairline)",
            }}
          >
            {balance < 1 ? (
              <Button full icon="Ticket" onClick={() => router.push("/communities")}>
                Top up credits
              </Button>
            ) : (
              <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") send();
                  }}
                  placeholder={`Message ${community.name} (1 credit)`}
                  style={{
                    flex: 1,
                    height: 46,
                    background: "var(--surface-input)",
                    border: "1px solid var(--border-hairline)",
                    borderRadius: "var(--radius-chip)",
                    padding: "0 16px",
                    color: "var(--text-primary)",
                    fontSize: 14.5,
                    fontFamily: "var(--font-sans)",
                    outline: "none",
                  }}
                />
                <button
                  type="button"
                  aria-label="Send"
                  onClick={send}
                  disabled={!text.trim() || sending}
                  style={{
                    display: "grid",
                    placeItems: "center",
                    width: 46,
                    height: 46,
                    borderRadius: 999,
                    border: "none",
                    background: text.trim() && !sending ? "var(--accent)" : "var(--surface-tag)",
                    color: text.trim() && !sending ? "var(--text-on-accent)" : "var(--text-disabled)",
                    cursor: text.trim() && !sending ? "pointer" : "default",
                    flexShrink: 0,
                  }}
                >
                  <Icon name={sending ? "Loader2" : "Send"} size={17} stroke={2.2} style={sending ? { animation: "wawuSpin 900ms linear infinite" } : undefined} />
                </button>
              </div>
            )}
          </footer>
        </>
      )}
    </div>
  );
}