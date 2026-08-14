import { AppHeader } from "./AppHeader";
import { BottomNav } from "./BottomNav";

/** Authenticated shell. Mobile only for now — desktop layout lands later. */
export function AppShell({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto min-h-dvh w-full max-w-[var(--mobile-column)] bg-[var(--surface-page)]">
      <AppHeader title={title} />
      <main className="px-[var(--gutter)] pb-24 pt-[var(--space-md)]">{children}</main>
      <BottomNav />
    </div>
  );
}
