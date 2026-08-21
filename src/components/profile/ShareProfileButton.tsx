"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";

/**
 * Shares a profile by its username.
 *
 * The link uses the handle the creator chose, not the internal id, because
 * that is what somebody would actually send to a friend. The public profile
 * route resolves either.
 *
 * Uses the native share sheet where the device has one (phones), and falls
 * back to copying the link with a short confirmation. Both are guarded: a
 * cancelled share sheet is not an error, and clipboard access can be refused.
 */
export function ShareProfileButton({ handle, compact = false }: { handle: string; compact?: boolean }) {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const clean = handle.replace(/^@/, "");
    if (!clean) return;
    const url = `${window.location.origin}/profile/${clean}`;

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: `@${clean} on WAWU`, url });
        return;
      } catch {
        // Dismissed, or the sheet refused. Fall through to copying.
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked (insecure context, or denied). Nothing useful to do.
    }
  };

  if (compact) {
    return (
      <button
        type="button"
        onClick={share}
        aria-label="Share profile"
        className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-full border border-hairline bg-tag transition-colors hover:bg-state-hover"
      >
        <Icon name={copied ? "Check" : "Share2"} size={16} color="var(--text-primary)" strokeWidth={2.1} />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={share}
      className="inline-flex h-10 items-center gap-2 rounded-full border border-hairline bg-tag px-[15px] text-[13.5px] font-semibold text-text-primary transition-colors hover:bg-state-hover"
    >
      <Icon name={copied ? "Check" : "Share2"} size={15} color="currentColor" strokeWidth={2.1} />
      {copied ? "Link copied" : "Share profile"}
    </button>
  );
}
