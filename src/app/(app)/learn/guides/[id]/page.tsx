import { getGuides } from "@/lib/api/learn";
import { ProfileBackButton } from "@/components/profile/ProfileBackButton";
import { Icon } from "@/components/ui/Icon";
import { ErrorState } from "@/components/ui/ErrorState";
import { DownloadButton } from "@/components/learn/DownloadButton";

export default async function GuideDetailPage({ params }: { params: { id: string } }) {
  const guides = await getGuides();
  const guide = guides.find((g) => g.id === params.id);

  if (!guide) {
    return (
      <div className="p-4">
        <ErrorState title="Guide not found" body="This guide may have been removed." />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[18px] p-[14px_16px_96px]">
      <div className="flex items-center gap-2.5">
        <ProfileBackButton compact />
        <span className="text-[18px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
          Guide
        </span>
      </div>

      <div className="flex flex-col gap-2.5">
        <span className="text-[11px] font-bold uppercase tracking-[0.05em] text-[var(--text-muted)]">
          {guide.country} · {guide.pages} pages · Free
        </span>
        <span className="text-[24px] font-extrabold leading-[1.2] tracking-[-0.025em] text-[var(--text-primary)]">
          {guide.title}
        </span>
        <p className="m-0 text-[14px] leading-[1.55] text-[var(--text-secondary)]">
          The plain-language version of the WAWU Business Playbook for creators based in {guide.country} — payments,
          verification, taxes and what to watch out for locally.
        </p>
      </div>

      <div className="flex items-center gap-3 rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-3.5">
        <span className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-[12px] border border-[var(--border-accent)] bg-[var(--accent-tint)]">
          <Icon name="FileText" size={18} color="var(--accent)" />
        </span>
        <div className="min-w-0 flex-1">
          <span className="text-[14.5px] font-semibold text-[var(--text-primary)]">{guide.title}</span>
        </div>
        <span className="text-[12.5px] font-bold text-[var(--success)]">Free</span>
      </div>

      <DownloadButton title={guide.title} />
    </div>
  );
}
