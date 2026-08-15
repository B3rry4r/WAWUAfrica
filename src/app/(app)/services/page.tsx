import Link from "next/link";
import { getServices } from "@/lib/api/services";
import { ComingSoonPill, ErrorState, Icon, TierBadge } from "@/components/ui";
import type { IconName } from "@/components/ui/Icon";

const eyebrow = "px-[2px] text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--text-muted)]";

export default async function ServicesPage() {
  let services;
  try {
    services = await getServices();
  } catch (e) {
    const message = e instanceof Error ? e.message : undefined;
    return <ErrorState title="We couldn't load services." body={message} />;
  }

  const live = services.filter((s) => s.status === "live");
  const coming = services.filter((s) => s.status === "coming");

  return (
    <div className="flex flex-col gap-[20px]">
      <section className="flex flex-col gap-[11px]">
        <span className={eyebrow}>Open now</span>
        <div className="flex flex-col gap-[10px]">
          {live.map((s) => (
            <Link key={s.id} href={`/services/${s.id}`} className="flex gap-[13px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[14px] no-underline">
              <span className="grid h-[46px] w-[46px] shrink-0 place-items-center rounded-[14px] border border-[var(--border-accent)] bg-[var(--accent-tint)]">
                <Icon name={s.icon as IconName} size={20} color="var(--accent)" />
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-[4px]">
                <span className="flex items-center gap-[8px] text-[15.5px] font-bold tracking-[-0.01em] text-[var(--text-primary)]">
                  {s.name}
                  <TierBadge tier="basic" />
                </span>
                <span className="text-[13px] text-[var(--text-secondary)]">{s.tagline}</span>
                <span className="text-[12px] text-[var(--text-muted)]">
                  {s.priceFrom} · {s.turnaround}
                </span>
              </div>
              <Icon name="ChevronRight" size={17} color="var(--text-muted)" className="self-center" />
            </Link>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-[11px]">
        <div className="flex items-center gap-[8px] px-[2px]">
          <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--text-muted)]">Coming with Pro</span>
          <TierBadge tier="pro" />
        </div>
        <div className="flex flex-col gap-[10px]">
          {coming.map((s) => (
            <Link key={s.id} href={`/services/${s.id}`} className="flex gap-[13px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[14px] opacity-[0.82] no-underline">
              <span className="grid h-[46px] w-[46px] shrink-0 place-items-center rounded-[14px] border border-[var(--border-hairline)] bg-[var(--surface-tag)]">
                <Icon name={s.icon as IconName} size={20} color="var(--text-muted)" />
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-[4px]">
                <span className="flex items-center gap-[8px] text-[15.5px] font-bold tracking-[-0.01em] text-[var(--text-primary)]">
                  {s.name}
                  <ComingSoonPill>Coming soon</ComingSoonPill>
                </span>
                <span className="text-[13px] text-[var(--text-secondary)]">{s.tagline}</span>
              </div>
              <Icon name="ChevronRight" size={17} color="var(--text-muted)" className="self-center" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
