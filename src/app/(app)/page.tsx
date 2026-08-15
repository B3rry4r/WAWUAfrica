import { Header } from "@/components/layout/Header";
import { ContentGridCard } from "@/components/ui/ContentCard";
import { HandoffPill } from "@/components/ui/StatusPill";
import { formatNaira } from "@/lib/format";

export default function HomePage() {
  return (
    <div>
      <Header title="WAWUAfrica" />
      <div style={{ padding: "16px 16px 32px", display: "flex", flexDirection: "column", gap: 18 }}>
        <div>
          <h2 style={{ margin: "0 0 10px", fontSize: 19, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--text-primary)" }}>
            For you
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <ContentGridCard
              state="locked"
              title="CAC in 7 days"
              price={2500}
              contentType="Course"
              count="Course"
            />
            <ContentGridCard state="free" title="Stall pricing" contentType="Video" count="Video" />
            <ContentGridCard
              state="locked"
              title="Market pricing sheet"
              price={2500}
              contentType="PDF"
              count="PDF"
            />
            <ContentGridCard state="free" title="Trader's playbook" contentType="PDF" count="PDF" />
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "14px 16px",
            borderRadius: "var(--radius-card)",
            background: "var(--surface-card)",
            border: "1px solid var(--border-hairline)",
          }}
        >
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
              From WAWUBasket
            </span>
            <span style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
              Physical goods live in the WAWU shopping app
            </span>
          </div>
          <HandoffPill label="WAWUBasket" />
        </div>
      </div>
    </div>
  );
}
