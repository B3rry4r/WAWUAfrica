"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { messagingApi } from "@/lib/api/messaging";
import { currentSession } from "@/lib/api/mocks/session";
import { PLANS } from "@/types/subscription";
import type { MessagingState } from "@/types/messaging";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { StatusPill } from "@/components/ui/StatusPill";
import { Icon } from "@/components/ui/Icon";
import { ErrorState, Skeleton } from "@/components/ui/Feedback";
import { formatNaira } from "@/lib/format";

export function Inbox() {
  const [state, setState] = useState<MessagingState | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    setError(false);
    setState(null);
    messagingApi
      .getState()
      .then(setState)
      .catch(() => setError(true));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (error) {
    return <ErrorState onRetry={load} />;
  }

  if (!state) {
    return (
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} height={150} radius="var(--radius-card)" />
        ))}
      </div>
    );
  }

  const price = currentSession.creator?.dmPrice ?? 300;
  const keep = PLANS[currentSession.creator?.tier ?? "basic"].split;
  const dmEarn = Math.round((price * keep) / 100);
  const urgent = state.threads.filter((t) => !t.opened);
  const answered = state.threads.filter((t) => t.opened);

  return (
    <div>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "16px 18px 14px",
          borderBottom: "1px solid var(--border-hairline)",
        }}
      >
        <span style={{ flex: 1, fontSize: 20, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--text-primary)" }}>
          Inbox
        </span>
        <Link
          href="/messages/settings"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            height: 26,
            padding: "0 10px",
            borderRadius: 999,
            background: "var(--surface-tag)",
            border: "1px solid var(--border-hairline)",
            fontSize: 11.5,
            fontWeight: 700,
            color: "var(--text-secondary)",
            fontFeatureSettings: "var(--font-feature-tabular)",
            textDecoration: "none",
          }}
        >
          {formatNaira(price)} each
        </Link>
      </header>

      <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
        {state.penalty !== "none" ? (
          <Link href="/messages/settings" style={{ textDecoration: "none" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "12px 14px",
                borderRadius: "var(--radius-card)",
                background:
                  state.penalty === "warned" ? "var(--warning-tint)" : "var(--danger-tint)",
                border: `1px solid ${state.penalty === "warned" ? "rgba(255,183,3,0.32)" : "rgba(255,92,92,0.32)"}`,
              }}
            >
              <Icon
                name={state.penalty === "warned" ? "TriangleAlert" : "Lock"}
                size={17}
                stroke={2.2}
                color={state.penalty === "warned" ? "var(--warning)" : "var(--danger)"}
              />
              <span style={{ flex: 1, fontSize: 12.5, fontWeight: 600, color: "var(--text-primary)" }}>
                {state.penalty === "warned"
                  ? `${state.responseStats.rate}% unanswered — you are missing messages`
                  : state.penalty === "disabled7"
                    ? "Paid messages are off for 7 days"
                    : "Paid messages are off for 30 days"}
              </span>
            </div>
          </Link>
        ) : null}

        {urgent.map((t) => {
          const timeLeft = t.expiresAt ?? "";
          const critical = timeLeft.startsWith("1h");
          const border = critical ? "rgba(255,92,92,0.32)" : "rgba(255,183,3,0.28)";
          return (
            <div
              key={t.id}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
                padding: 15,
                borderRadius: "var(--radius-card)",
                background: "var(--surface-card)",
                border: `1px solid ${border}`,
              }}
            >
              <div style={{ display: "flex", gap: 12 }}>
                <Avatar initials={t.buyerInitials} size={40} />
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ flex: 1, fontSize: 14.5, fontWeight: 600, color: "var(--text-primary)" }}>
                      {t.buyerName}
                    </span>
                    <span
                      style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: critical ? "var(--danger)" : "var(--warning)",
                        fontFeatureSettings: "var(--font-feature-tabular)",
                      }}
                    >
                      {timeLeft}
                    </span>
                  </div>
                  <span style={{ fontSize: 13.5, lineHeight: 1.45, color: "var(--text-primary)" }}>{t.preview}</span>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: 12, borderTop: "1px solid var(--border-hairline)" }}>
                <span style={{ flex: 1, fontSize: 12.5, fontWeight: 600, color: critical ? "var(--danger)" : "var(--text-secondary)" }}>
                  Respond by {critical ? "4:12 pm today" : "1:40 am"}
                </span>
                <span style={{ fontSize: 12.5, fontWeight: 700, fontFeatureSettings: "var(--font-feature-tabular)" }}>
                  {formatNaira(dmEarn)} to earn
                </span>
              </div>
              <Button full style={{ height: 48 }} onClick={() => routerTo(t.id)}>
                Reply now
              </Button>
            </div>
          );
        })}

        {answered.map((t) => (
          <div
            key={t.id}
            style={{
              display: "flex",
              gap: 12,
              padding: 15,
              borderRadius: "var(--radius-card)",
              background: "var(--surface-card)",
              border: "1px solid var(--border-hairline)",
              opacity: t.unread ? 1 : 0.7,
            }}
          >
            <Avatar initials={t.buyerInitials} size={40} />
            <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ flex: 1, fontSize: 14.5, fontWeight: 600, color: "var(--text-primary)" }}>{t.buyerName}</span>
                <StatusPill kind="success" size="xs">
                  Answered
                </StatusPill>
              </div>
              <span
                style={{
                  fontSize: 13,
                  color: "var(--text-secondary)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {t.preview}
              </span>
              <span style={{ fontSize: 12, color: "var(--text-muted)", fontFeatureSettings: "var(--font-feature-tabular)" }}>
                Earned {formatNaira(dmEarn)} · replied in 3h
              </span>
            </div>
          </div>
        ))}

        <div
          style={{
            display: "flex",
            gap: 12,
            padding: 15,
            borderRadius: "var(--radius-card)",
            background: "var(--surface-card)",
            border: "1px solid var(--border-hairline)",
            opacity: 0.7,
          }}
        >
          <Avatar initials="C" size={40} />
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ flex: 1, fontSize: 14.5, fontWeight: 600, color: "var(--text-primary)" }}>Chidi Umeh</span>
              <StatusPill kind="info" size="xs">
                Refunded
              </StatusPill>
            </div>
            <span
              style={{
                fontSize: 13,
                color: "var(--text-secondary)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              Do you review business plans?
            </span>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Missed the window · earned nothing</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function routerTo(id: string) {
  // Conversation view is a separate flow; nothing to navigate to yet.
  void id;
}
