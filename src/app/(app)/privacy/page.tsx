import { ProfileBackButton } from "@/components/profile/ProfileBackButton";

export default function PrivacyPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: "14px 16px 96px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <ProfileBackButton compact />
        <span style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--text-primary)" }}>
          Privacy
        </span>
      </div>
      <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55, color: "var(--text-secondary)" }}>
        This is a plain-English summary. The full terms live in the About section.
      </p>
      <Section
        title="What we see"
        body="Your profile, DMs, uploads and purchases are only used to run WAWU for you. We never sell your data. WAWU's creators see what you post and share, never your payment details."
      />
      <Section
        title="Your paid DMs"
        body="Paid messages are read only by you and the creator you wrote to. If a creator hasn't replied within 24 hours, the cost is refunded automatically."
      />
      <Section
        title="Credits"
        body="WAWU Credits are a count on your account used for messages, community posts and tips. They can't be withdrawn or turned into cash — spend them inside the app only."
      />
      <Section
        title="KYC documents"
        body="BVN, NIN and ID documents go only to our manual review team and are never shared with creators or partners."
      />
    </div>
  );
}

function Section({ title, body }: { title: string; body: string }) {
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>{title}</span>
      <span style={{ fontSize: 13.5, lineHeight: 1.5, color: "var(--text-secondary)" }}>{body}</span>
    </section>
  );
}