import { ProfileBackButton } from "@/components/profile/ProfileBackButton";

export default function AboutPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: "14px 16px 96px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <ProfileBackButton compact />
        <span style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--text-primary)" }}>
          About WAWU
        </span>
      </div>
      <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.6, color: "var(--text-secondary)" }}>
        WAWU is a Nigerian marketplace for creators — people who teach, write, draw, sew, cook
        and build. Creators charge for their content in naira, and members pay for what they
        value. When you pay a creator, 85% goes to them and WAWU keeps 15% (90/10 for Pro).
      </p>
      <Section title="Credits, never cash" body="WAWU Credits are a count used for paid messages, community posts and tips. They can't be withdrawn or converted to cash." />
      <Section title="No wallet" body="There's no balance to cash out. Money moves from member to creator for the thing being bought, and that's it." />
      <Section title="Nigeria-first" body="Prices are in naira. Verification uses BVN and NIN in Nigeria, national IDs elsewhere, and every review is done by a human." />
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