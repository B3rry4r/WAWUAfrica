import type { AccountType } from "@/types/account";
import { BottomNav } from "./BottomNav";

export interface AppShellProps {
  children: React.ReactNode;
  accountType: AccountType;
}

/** Mobile-first app frame: single 430px column with the locked 5-slot nav. */
export function AppShell({ children, accountType }: AppShellProps) {
  return (
    <div
      className="max-w-[var(--mobile-column)] m-0 min-h-[100vh] bg-[var(--surface-page)] relative"
    >
      <main className="pb-[90px]">{children}</main>
      <BottomNav accountType={accountType} />
    </div>
  );
}
