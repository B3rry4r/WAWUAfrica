import { getSavedItems } from "@/lib/api/settings";
import { ProfileBackButton } from "@/components/profile/ProfileBackButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";

export default async function SavedPage() {
  let items;
  try {
    items = await getSavedItems();
  } catch (e) {
    const message = e instanceof Error ? e.message : undefined;
    return <ErrorState title={message ?? "We couldn't load your saved items."} />;
  }

  return (
    <div className="flex flex-col gap-3.5 p-[14px_16px_96px]">
      <div className="flex items-center gap-2.5">
        <ProfileBackButton compact />
        <span className="text-[18px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
          Saved
        </span>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon="Bookmark"
          title="Nothing saved yet"
          caption="Bookmark courses, playbooks and posts and they'll line up here."
        />
      ) : (
        <div className="flex flex-col gap-2.5">
          {items.map((item) => (
            <div key={item.id} className="flex flex-col gap-1.5 rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[14px_16px]">
              <div className="flex items-center justify-between gap-2.5">
                <span className="text-[15px] font-bold leading-[1.3] text-[var(--text-primary)]">{item.title}</span>
                <span className="whitespace-nowrap text-[11.5px] text-[var(--text-muted)]">{item.savedAt}</span>
              </div>
              <span className="text-[12.5px] text-[var(--accent-hover)]">{item.kindLabel}</span>
              <span className="text-[12.5px] text-[var(--text-muted)]">by {item.creator}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
