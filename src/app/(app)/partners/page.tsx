import { ProfileBackButton } from "@/components/profile/ProfileBackButton";
import { formatNaira } from "@/lib/format";

const PARTNERS = [
  { name: "WAWUBasket", role: "Your storefront for physical goods, shop straight from creators." },
  { name: "WAWUBeauty", role: "Beauty services and bookings in your city." },
  { name: "CAC registration", role: `Business registration handled by our CAC agent, from ${formatNaira(25000)}.` },
  { name: "NEPC export desks", role: "Matchmaking for creators who want to sell beyond Nigeria." },
];

export default function PartnersPage() {
  return (
    <div className="flex flex-col gap-[14px] p-[14px_16px_96px]">
      <div className="flex items-center gap-[10px]">
        <ProfileBackButton compact />
        <span className="text-[18px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
          Partners
        </span>
      </div>
      <p className="m-0 text-[13.5px] leading-[1.55] text-[var(--text-secondary)]">
        WAWU works with partners to help you sell more and run your business.
      </p>
      <div className="flex flex-col gap-[10px]">
        {PARTNERS.map((p) => (
          <div key={p.name} className="flex flex-col gap-[4px] rounded-[var(--radius-input)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[14px_16px]">
            <span className="text-[15px] font-bold text-[var(--text-primary)]">{p.name}</span>
            <span className="text-[13px] leading-[1.5] text-[var(--text-secondary)]">{p.role}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
