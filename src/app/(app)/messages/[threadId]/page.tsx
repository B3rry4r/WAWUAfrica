import { getDmThread } from "@/lib/api/dm";
import { ProfileBackButton } from "@/components/profile/ProfileBackButton";
import { Avatar } from "@/components/ui/Avatar";
import { VerificationBadge } from "@/components/ui/VerificationBadge";
import { StatusPill } from "@/components/ui/StatusPill";
import { Icon } from "@/components/ui/Icon";
import { ErrorState } from "@/components/ui/ErrorState";
import { DmThreadFooter } from "@/components/dm/DmThreadFooter";

export default async function DmThreadPage({ params }: { params: { threadId: string } }) {
  const thread = await getDmThread(params.threadId);

  if (!thread) {
    return (
      <div style={{ padding: 16 }}>
        <ErrorState
          title="Conversation not found"
          caption="This thread may have been archived."
          actionHref="/messages"
          action="Back to messages"
        />
      </div>
    );
  }

  const { summary, messages, deadlineAt, refundedAt } = thread;
  const first = summary.creatorName.charAt(0);

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
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
          <Avatar initial={first} size={34} />
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 1 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 15, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
              {summary.creatorName}
              <VerificationBadge size={14} />
            </span>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
              Paid message · ₦{summary.amount.toLocaleString("en-NG")}
            </span>
          </div>
          {summary.status === "awaiting_response" && <StatusPill kind="warning">Awaiting reply</StatusPill>}
        </div>
      </header>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10, padding: "18px 16px 20px" }}>
        {(summary.status === "awaiting_response" || summary.status === "refunded") && (
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 9,
              padding: "11px 13px",
              borderRadius: "var(--radius-input)",
              background: summary.status === "refunded" ? "var(--danger-tint)" : "var(--info-tint)",
              border: `1px solid ${summary.status === "refunded" ? "rgba(255,92,92,0.3)" : "rgba(32,201,195,0.3)"}`,
            }}
          >
            <Icon
              name={summary.status === "refunded" ? "CircleAlert" : "Clock"}
              size={16}
              color={summary.status === "refunded" ? "var(--danger)" : "var(--info)"}
              stroke={2}
              style={{ marginTop: 1 }}
            />
            <span style={{ fontSize: 13, lineHeight: 1.5, color: "var(--text-primary)" }}>
              {summary.status === "refunded" ? (
                <>
                  You got a refund — ₦{summary.amount.toLocaleString("en-NG")} back to your payment method{refundedAt ? ` on ${refundedAt}` : ""}. This conversation is closed.
                </>
              ) : (
                <>
                  {summary.creatorName.split(" ")[0]} has until {deadlineAt} to reply. No reply by then → automatic refund.
                </>
              )}
            </span>
          </div>
        )}

        {messages.map((m) => {
          const mine = m.from === "me";
          return (
            <div key={m.id} style={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start" }}>
              <div
                style={{
                  maxWidth: "78%",
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
                <span style={{ fontSize: 14.5, lineHeight: 1.45, color: mine ? "var(--text-on-accent)" : "var(--text-primary)", whiteSpace: "pre-wrap" }}>
                  {m.text}
                </span>
                <span style={{ fontSize: 10.5, color: mine ? "rgba(255,255,255,0.7)" : "var(--text-muted)", alignSelf: "flex-end" }}>
                  {m.at}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <DmThreadFooter
        creator={{ wawuId: summary.creatorWawuId, name: summary.creatorName, handle: summary.creatorHandle, dmPrice: summary.amount }}
        status={summary.status}
      />
    </div>
  );
}