import type { ReactNode } from "react";

interface ComingSoonPillProps {
  children: ReactNode;
}

export function ComingSoonPill({ children }: ComingSoonPillProps) {
  return (
    <span className="inline-flex items-center rounded-full border border-hairline bg-tag px-3 py-1 text-[12px] font-medium text-text-secondary">
      {children}
    </span>
  );
}