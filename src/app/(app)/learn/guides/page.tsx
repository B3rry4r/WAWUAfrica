import Link from "next/link";
import { getGuides } from "@/lib/api/learn";
import { ProfileBackButton } from "@/components/profile/ProfileBackButton";
import { Icon } from "@/components/ui/Icon";
import { ErrorState } from "@/components/ui/ErrorState";

export default async function GuidesPage() {
  let guides;
  try {
    guides = await getGuides();
  } catch (e) {
    const message = e instanceof Error ? e.message : undefined;
    return <ErrorState title={message ?? "We couldn't load guides."} />;
  }

  return (
    <div className="flex flex-col gap-3.5 p-[16px_16px_96px]">
      <div className="flex items-center gap-2.5">
        <ProfileBackButton compact />
        <span className="text-[18px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
          Country guides
        </span>
      </div>
      <div className="flex flex-col rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-1">
        {guides.map((g) => (
          <Link key={g.id} href={`/learn/guides/${g.id}`} className="flex items-center gap-[13px] rounded-[var(--radius-input)] p-[13px_14px] no-underline">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] border border-[var(--border-hairline)] bg-[var(--surface-tag)]">
              <Icon name="Globe" size={18} color="var(--accent)" />
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-[15px] font-semibold text-[var(--text-primary)]">{g.title}</span>
              <span className="text-[12.5px] text-[var(--text-muted)]">
                {g.country} · {g.pages} pages · Free
              </span>
            </div>
            <Icon name="ChevronRight" size={17} color="var(--text-muted)" />
          </Link>
        ))}
      </div>
    </div>
  );
}
