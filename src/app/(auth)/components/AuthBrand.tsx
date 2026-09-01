"use client";

import Link from "next/link";

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
    <div className="relative hidden overflow-hidden xl:flex xl:w-[520px] xl:shrink-0 xl:flex-col xl:gap-[26px] xl:border-r xl:border-hairline xl:p-12 xl:bg-[linear-gradient(160deg,_var(--accent-deep)_0%,_var(--surface-page)_100%)]">
      {/*
        The portrait product video, behind the panel.
        
        It is the one that used to sit in the landing hero, where it was the
        wrong shape — a 9:16 video beside a row of tiles left a tall void down
        one side. This panel is exactly that shape, so it finally fits.

        Only ever rendered at xl. The whole panel is `hidden xl:flex`, so a
        phone never downloads the file — which matters, because it is a large
        one and this is a sign-in screen, not a landing page.

        The gradient over it is not decoration: white text on moving footage
        is unreadable about a third of the time. The scrim keeps the copy at a
        fixed contrast whatever frame is playing, and it is anchored to the
        bottom where the copy actually sits.
      */}
      <video
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-40"
        src="/landing-video.mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden="true"
        tabIndex={-1}
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(11,10,13,0.68)_0%,rgba(11,10,13,0.42)_26%,rgba(11,10,13,0.82)_58%,rgba(11,10,13,0.95)_100%)]"
        aria-hidden="true"
      />

      <Link href="/" aria-label="WAWUAfrica home" className="relative z-10 self-start">
        <img src="/wawu-logo-white.png" alt="WAWU" className="h-7 w-auto object-contain" />
      </Link>

      {content.kind === "marketing" ? (
        <div className="relative z-10 mt-auto flex flex-col gap-[22px]">
          <span className="text-[34px] font-bold leading-[1.12] tracking-[-0.03em] text-text-primary">
            Creators earning from what they already know.
          </span>
          <div className="flex flex-col gap-3.5 rounded-card border border-hairline bg-[rgba(11,10,13,0.72)] p-[22px] backdrop-blur-sm">
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
        <div className="relative z-10 mt-auto flex flex-col gap-4">
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
