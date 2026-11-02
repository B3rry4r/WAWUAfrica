"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { CONTACT_EMAIL, HEADER_NAV, REGISTER_HREF, WHATSAPP_DISPLAY, WHATSAPP_URL } from "@/lib/site/site-config";
import { ButtonLink } from "./ButtonLink";
import { CloseIcon, MenuIcon } from "./Icons";
import { SiteLogo } from "./SiteLogo";

/**
 * The sticky header. On a phone the links sit behind a Menu button that opens
 * a full-height sheet: Escape closes it and puts focus back on the button,
 * choosing a link or growing the window to desktop width closes it, and the
 * page behind does not scroll while it is open.
 */
export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const sheet = useRef<HTMLDivElement>(null);
  const header = useRef<HTMLElement>(null);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    root.classList.add("overflow-hidden");
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        button.current?.focus();
        return;
      }
      if (event.key !== "Tab" || !header.current) return;
      // Keep Tab inside the header and the sheet while the page behind is covered.
      const stops = Array.from(header.current.querySelectorAll<HTMLElement>("a[href], button")).filter(
        (el) => el.getClientRects().length > 0,
      );
      const first = stops[0];
      const last = stops[stops.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    const wide = window.matchMedia("(min-width: 1024px)");
    const onWide = () => {
      if (wide.matches) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    wide.addEventListener("change", onWide);
    sheet.current?.querySelector<HTMLElement>("a")?.focus();
    return () => {
      root.classList.remove("overflow-hidden");
      document.removeEventListener("keydown", onKey);
      wide.removeEventListener("change", onWide);
    };
  }, [open]);

  const isCurrent = (href: string) => pathname === href;

  return (
    <header ref={header} className="on-dark sticky top-0 z-50 border-b border-white/10 bg-site-deep text-white">
      <div className="mx-auto flex h-[68px] w-full max-w-[1200px] items-center justify-between gap-4 px-5 sm:px-8">
        <Link href="/" aria-label="WAWU home" className="inline-flex shrink-0 items-center rounded-md">
          <SiteLogo priority className="w-[112px] sm:w-[126px]" />
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          {HEADER_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isCurrent(item.href) ? "page" : undefined}
              className={cn(
                "rounded-full px-4 py-2 text-[15px] font-semibold tracking-[-0.005em] transition-colors duration-200",
                isCurrent(item.href) ? "bg-white/12 text-white" : "text-white/80 hover:bg-white/8 hover:text-white",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <ButtonLink href={REGISTER_HREF} variant="white" className="hidden min-h-[44px] px-5 text-[15px] sm:inline-flex">
            Register
          </ButtonLink>
          <button
            ref={button}
            type="button"
            aria-expanded={open}
            aria-controls="site-menu"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-full border-2 border-white/35 px-4 text-[15px] font-bold text-white hover:border-white lg:hidden"
          >
            {open ? <CloseIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
            {open ? <>Close</> : <>Menu</>}
          </button>
        </div>
      </div>

      {open ? (
        <div
          id="site-menu"
          ref={sheet}
          className="fixed inset-x-0 bottom-0 top-[68px] z-40 overflow-y-auto bg-site-deep px-5 pb-10 pt-4 sm:px-8 lg:hidden"
        >
          <nav aria-label="Mobile" className="mx-auto flex max-w-[1200px] flex-col">
            {[{ label: "Home", href: "/" }, ...HEADER_NAV].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isCurrent(item.href) ? "page" : undefined}
                className={cn(
                  "border-b border-white/12 py-4 text-[28px] font-extrabold leading-tight tracking-[-0.03em]",
                  isCurrent(item.href) ? "text-site-lilac" : "text-white",
                )}
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-8 flex flex-col gap-3">
              <ButtonLink href={REGISTER_HREF} variant="white" arrow>
                Register
              </ButtonLink>
              <div className="mt-4 flex flex-col gap-2 text-[15px] text-white/80">
                <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-white underline-offset-4 hover:underline">
                  {CONTACT_EMAIL}
                </a>
                <a href={WHATSAPP_URL} className="font-semibold text-white underline-offset-4 hover:underline">
                  WhatsApp {WHATSAPP_DISPLAY}
                </a>
              </div>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
