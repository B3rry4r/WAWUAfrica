import { ProfileBackButton } from "@/components/profile/ProfileBackButton";

const PARTNERS = [
  { name: "WAWUBasket", role: "Your storefront for physical goods — shop straight from creators." },
  { name: "WAWUBeauty", role: "Beauty services and bookings in your city." },
  { name: "CAC registration", role: "Business registration handled by our CAC agent, from ₦25,000." },
  { name: "NEPC export desks", role: "Matchmaking for creators who want to sell beyond Nigeria." },
];

export default function PartnersPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: "14px 16px 96px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <ProfileBackButton compact />
        <span style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--text-primary)" }}>
          Partners
        </span>
      </div>
      <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55, color: "var(--text-secondary)" }}>
        WAWU works with partners to help you sell more and run your business.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {PARTNERS.map((p) => (
          <div key={p.name} style={{ display: "flex", flexDirection: "column", gap: 4, padding: "14px 16px", borderRadius: "var(--radius-input)", background: "var(--surface-card)", border: "1px solid var(--border-hairline)" }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>{p.name}</span>
            <span style={{ fontSize: 13, lineHeight: 1.5, color: "var(--text-secondary)" }}>{p.role}</span>
          </div>
        ))}
      </div>
    </div>
  );
}