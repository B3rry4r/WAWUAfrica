import { Header } from "@/components/layout/Header";
import { ContentGridCard } from "@/components/ui/ContentCard";
import { HandoffPill } from "@/components/ui/StatusPill";
import { formatNaira } from "@/lib/format";

export default function HomePage() {
  return (
    <div>
      <Header title="WAWUAfrica" />
      <div className="pt-[16px] px-[16px] pb-[32px] flex flex-col gap-[18px]">
        <div>
          <h2 className="mt-0 mx-0 mb-[10px] text-[19px] font-bold tracking-[-0.02em] text-[var(--text-primary)]">
            For you
          </h2>
          <div className="grid grid-cols-[1fr_1fr] gap-[12px]">
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
          className="flex items-center gap-[12px] py-[14px] px-[16px] rounded-[var(--radius-card)] bg-[var(--surface-card)] border border-[var(--border-hairline)]"
        >
          <div className="flex-1 flex flex-col gap-[3px]">
            <span className="text-[14px] font-semibold text-[var(--text-primary)]">
              From WAWUBasket
            </span>
            <span className="text-[12.5px] text-[var(--text-muted)]">
              Physical goods live in the WAWU shopping app
            </span>
          </div>
          <HandoffPill label="WAWUBasket" />
        </div>
      </div>
    </div>
  );
}
