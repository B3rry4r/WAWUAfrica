import { getPlaybook } from "@/lib/api/learn";
import { ProfileBackButton } from "@/components/profile/ProfileBackButton";
import { Icon } from "@/components/ui/Icon";
import { ErrorState } from "@/components/ui/ErrorState";
import { DownloadButton } from "@/components/learn/DownloadButton";

export default async function PlaybookPage() {
  let playbook;
  try {
    playbook = await getPlaybook();
  } catch (e) {
    const message = e instanceof Error ? e.message : undefined;
    return <ErrorState title={message ?? "We couldn't load the playbook."} />;
  }

  return (
    <div className="flex flex-col gap-[18px] p-[14px_16px_96px]">
      <div className="flex items-center gap-2.5">
        <ProfileBackButton compact />
        <span className="text-[18px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
          The playbook
        </span>
      </div>

      <div className="flex flex-col items-center gap-3 rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[26px_20px] text-center">
        <span className="grid h-[98px] w-[76px] place-items-center rounded-[12px] bg-[var(--accent)] text-[14px] font-extrabold uppercase tracking-[0.02em] text-[var(--text-on-accent)] shadow-[var(--shadow-float)]">
          WAWU
        </span>
        <span className="text-[21px] font-extrabold leading-[1.25] tracking-[-0.02em] text-[var(--text-primary)]">
          {playbook.title}
        </span>
        <span className="text-[13px] text-[var(--text-muted)]">
          {playbook.pages} pages · {playbook.format} · Free
        </span>
      </div>

      <p className="m-0 text-[14px] leading-[1.55] text-[var(--text-secondary)]">{playbook.description}</p>

      <section className="flex flex-col gap-2">
        <span className="text-[13px] font-semibold text-[var(--text-secondary)]">Inside</span>
        <div className="flex flex-col rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-1">
          {playbook.chapters.map((ch) => (
            <div key={ch.title} className="flex items-center gap-3 rounded-[var(--radius-input)] p-3">
              <Icon name="BookOpen" size={16} color="var(--accent)" />
              <span className="flex-1 text-[14px] font-medium text-[var(--text-primary)]">{ch.title}</span>
              <span className="text-[12px] text-[var(--text-muted)]">Pages {ch.pages}</span>
            </div>
          ))}
        </div>
      </section>

      <DownloadButton title={playbook.title} />
    </div>
  );
}
