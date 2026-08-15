"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";

/**
 * Desktop-only (xl:) brand panel for the auth routes. Per the design, the
 * sign-up flow's step progress lives IN this panel, not at the top of the
 * form — so the panel's content has to be settable from deep inside a
 * client flow (SignUpFlow) that the layout itself has no visibility into.
 * This context is that seam. Mobile (below xl) never renders the panel at
 * all, so none of this touches the mobile flow.
 */
export type AuthBrandContent =
  | { kind: "marketing" }
  | { kind: "steps"; current: number; steps: string[] };

const DEFAULT_BRAND: AuthBrandContent = { kind: "marketing" };

interface AuthBrandContextValue {
  content: AuthBrandContent;
  setContent: (content: AuthBrandContent) => void;
}

const AuthBrandContext = createContext<AuthBrandContextValue | null>(null);

export function AuthBrandProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<AuthBrandContent>(DEFAULT_BRAND);
  return <AuthBrandContext.Provider value={{ content, setContent }}>{children}</AuthBrandContext.Provider>;
}

/** Publishes brand-panel content for as long as the caller is mounted; reverts to the default marketing panel on unmount or when a later page takes over. */
export function useAuthBrand(content: AuthBrandContent) {
  const ctx = useContext(AuthBrandContext);
  const key = content.kind === "steps" ? `steps:${content.current}:${content.steps.join("|")}` : content.kind;
  useEffect(() => {
    ctx?.setContent(content);
    return () => ctx?.setContent(DEFAULT_BRAND);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}

export function AuthBrandPanel() {
  const ctx = useContext(AuthBrandContext);
  const content = ctx?.content ?? DEFAULT_BRAND;

  return (
    <div className="hidden xl:flex xl:w-[520px] xl:shrink-0 xl:flex-col xl:gap-[26px] xl:border-r xl:border-hairline xl:p-12 xl:bg-[linear-gradient(160deg,_var(--accent-deep)_0%,_var(--surface-page)_100%)]">
      <img src="/wawu-logo-white.png" alt="WAWU" className="h-7 w-auto object-contain" />

      {content.kind === "marketing" ? (
        <div className="mt-auto flex flex-col gap-[22px]">
          <span className="text-[34px] font-bold leading-[1.12] tracking-[-0.03em] text-text-primary">
            Nigerians earning from what they already know.
          </span>
          <div className="flex flex-col gap-3.5 rounded-card border border-hairline bg-[rgba(11,10,13,0.55)] p-[22px]">
            <p className="m-0 text-[14.5px] leading-[1.55] text-text-secondary">
              &ldquo;I registered my business and sold my first course in the same week.&rdquo;
            </p>
            <div className="flex items-center gap-[11px]">
              <Avatar initial="A" size={38} />
              <div className="flex flex-col gap-0.5">
                <span className="text-[13.5px] font-semibold text-text-primary">Adaeze Okonkwo</span>
                <span className="text-[12px] text-text-muted">Accountant · Enugu</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-auto flex flex-col gap-4">
          {content.steps.map((label, i) => {
            const n = i + 1;
            const state = n < content.current ? "done" : n === content.current ? "active" : "upcoming";
            return (
              <div key={label} className="flex items-center gap-3">
                <span
                  className={`grid h-[26px] w-[26px] shrink-0 place-items-center rounded-full text-[12.5px] font-bold ${
                    state === "upcoming" ? "bg-tag text-text-muted" : "bg-accent text-on-accent"
                  }`}
                >
                  {state === "done" ? <Icon name="Check" size={13} color="var(--text-on-accent)" strokeWidth={3} /> : n}
                </span>
                <span className={`text-[14.5px] ${state === "upcoming" ? "text-text-muted" : "font-semibold text-text-primary"}`}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
