"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

/**
 * Shares a profile by its store link.
 *
 * THE LINK FORM. Build brief C3: "every user gets a copyable profile link in
 * the form wawu/their-name". So the link IS that, literally: the store lives
 * at /wawu/<handle>, and what this copies is
 * `https://wawuafrica.com/wawu/adaezeokonkwo`. Strip the origin and you have
 * the string the brief asks for, rather than a label that says `wawu/adaeze`
 * over a URL that says something else. It uses the handle the creator chose,
 * not the internal id, because that is what somebody would actually send to
 * a friend. The route resolves either.
 *
 * Opening it needs no account (src/app/(store)), which is the other half of
 * C3 and the reason this is worth copying at all.
 *
 * Uses the native share sheet where the device has one (phones), and falls
 * back to copying with a visible confirmation. Both are guarded: a cancelled
 * share sheet is not an error, and clipboard access can be refused outright,
 * in which case this says so instead of pretending it worked.
 */
type CopyState = "idle" | "copied" | "failed";

/**
 * navigator.clipboard is unavailable on an insecure origin and can be denied
 * by permission policy, which used to leave the button silently doing
 * nothing. The textarea path is the old execCommand trick: deprecated, still
 * the only thing that works in those two cases, and it is only reached when
 * the modern API has already refused.
 */
async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Denied or unavailable. Fall through to the selection-based copy.
  }
  try {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.className = "fixed left-[-9999px] top-0 opacity-0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(area);
    return ok;
  } catch {
    return false;
  }
}

/** `wawu/<handle>` as it is written on the profile, and as it is copied. */
export function storeLinkPath(handle: string): string {
  return `/wawu/${handle.replace(/^@/, "")}`;
}

export function ShareProfileButton({
  handle,
  compact = false,
  tone = "neutral",
  /**
   * "button" is the share control on the profile itself. "row" writes the
   * link out in full with a copy control beside it, for the public store
   * page, where the link is the thing being advertised and a visitor who
   * cannot use the clipboard can still read it and type it.
   *
   * "inline" is the compact form for the profile's meta row. It exists
   * because that row used to render `wawu/<handle>` as a plain anchor behind
   * a shop glyph: nothing said the string was yours to take, and there was
   * nothing to press to take it. Product owner, 21 Sep 2026: "there's even
   * no copy button, rather you embedded the public store link directly with
   * a marketplace icon, and how do you expect users to know that?" So the
   * inline form says the word "Copy" next to the link and copies on press.
   */
  display = "button",
}: {
  handle: string;
  compact?: boolean;
  display?: "button" | "row" | "inline";
  /**
   * Filled accent rather than the neutral outline, for the profile header
   * where the reference draws Share Profile as the PRIMARY of the two
   * controls beside the name. Everywhere else it is the quiet one.
   */
  tone?: "neutral" | "accent";
}) {
  const [state, setState] = useState<CopyState>("idle");
  const clean = handle.replace(/^@/, "");
  const path = storeLinkPath(clean);

  const copy = async (url: string) => {
    const ok = await copyToClipboard(url);
    setState(ok ? "copied" : "failed");
    setTimeout(() => setState("idle"), ok ? 2200 : 4000);
  };

  const share = async () => {
    if (!clean) return;
    const url = `${window.location.origin}${path}`;

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: `@${clean} on WAWU`, url });
        return;
      } catch {
        // Dismissed, or the sheet refused. Fall through to copying.
      }
    }
    await copy(url);
  };

  if (display === "inline") {
    return (
      <span className="inline-flex items-center gap-[2px]">
        {/* The link still goes where it says it goes: somebody who wants to
            see their own storefront presses the name, not the copy control. */}
        <Link
          href={path}
          className="inline-flex items-center gap-[6px] rounded-full py-[3px] pl-[2px] pr-[6px] text-[12.5px] font-semibold text-[var(--accent)] no-underline hover:text-text-primary"
        >
          <Icon name="Store" size={14} strokeWidth={2} />
          wawu/{clean}
        </Link>
        <button
          type="button"
          onClick={() => void copy(`${window.location.origin}${path}`)}
          aria-label={`Copy your store link, wawu/${clean}`}
          className="inline-flex h-[26px] shrink-0 items-center gap-[5px] rounded-full border border-hairline bg-tag px-[9px] text-[11.5px] font-semibold text-text-secondary transition-colors hover:border-[var(--accent)] hover:text-text-primary"
        >
          <Icon name={state === "copied" ? "Check" : "Copy"} size={12} color="currentColor" strokeWidth={2.2} />
          {state === "copied" ? "Copied" : state === "failed" ? "Copy failed" : "Copy"}
        </button>
        {/* The swapped label is the only visible confirmation, and a screen
            reader gets nothing from an icon changing, so it is announced. */}
        <span aria-live="polite" className="sr-only">
          {state === "copied"
            ? "Store link copied."
            : state === "failed"
              ? "Could not reach the clipboard. Open the link and copy it from the address bar."
              : ""}
        </span>
      </span>
    );
  }

  if (display === "row") {
    return (
      <div className="flex w-full flex-col gap-[8px]">
        <div className="flex w-full items-center gap-[8px] rounded-[var(--radius-input)] border border-hairline bg-[var(--surface-input)] py-[7px] pl-[13px] pr-[7px]">
          <Icon name="Store" size={15} color="var(--accent)" strokeWidth={2} />
          <span className="min-w-0 flex-1 select-all truncate text-[13px] font-semibold text-text-primary">
            wawu/{clean}
          </span>
          <button
            type="button"
            onClick={() => void share()}
            className="inline-flex h-[34px] shrink-0 items-center gap-[6px] rounded-full bg-accent px-[14px] text-[12.5px] font-semibold text-on-accent transition-colors hover:bg-accent-hover active:bg-accent-press"
          >
            <Icon name={state === "copied" ? "Check" : "Copy"} size={14} color="currentColor" strokeWidth={2.1} />
            {state === "copied" ? "Copied" : "Copy link"}
          </button>
        </div>
        {/* Announced, not just coloured: the confirmation is the only sign
            anything happened, and a screen reader gets nothing from a swapped
            icon. */}
        <span aria-live="polite" className="text-[12px] text-text-muted">
          {state === "copied"
            ? "Link copied. Paste it anywhere."
            : state === "failed"
              ? "Could not reach the clipboard. Select the link above and copy it."
              : "Anyone can open this, with or without an account."}
        </span>
      </div>
    );
  }

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => void share()}
        aria-label="Share profile"
        className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-full border border-hairline bg-tag transition-colors hover:bg-state-hover"
      >
        <Icon
          name={state === "copied" ? "Check" : "Share2"}
          size={16}
          color="var(--text-primary)"
          strokeWidth={2.1}
        />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void share()}
      className={
        tone === "accent"
          ? "inline-flex h-10 items-center gap-2 rounded-full bg-accent px-[15px] text-[13.5px] font-semibold text-on-accent transition-colors hover:bg-accent-hover active:bg-accent-press"
          : "inline-flex h-10 items-center gap-2 rounded-full border border-hairline bg-tag px-[15px] text-[13.5px] font-semibold text-text-primary transition-colors hover:bg-state-hover"
      }
    >
      <Icon
        name={state === "copied" ? "Check" : "Share2"}
        size={15}
        color="currentColor"
        strokeWidth={2.1}
      />
      {state === "copied" ? "Link copied" : state === "failed" ? "Copy it by hand" : "Share Profile"}
    </button>
  );
}
