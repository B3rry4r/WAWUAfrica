"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui";
import { SHARE_TEXT } from "./join-content";

const COPIED_FOR_MS = 2_500;

/**
 * "Tell 3 people who should put their name on it": the phone's own share sheet
 * where there is one (WhatsApp, Messages, anything the person has), otherwise
 * the page's link copied to the clipboard. It says "Link copied" only once the
 * browser has accepted the copy; a closed share sheet is not an error and says
 * nothing.
 */
export function ShareLink() {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  async function share() {
    const url = `${window.location.origin}/join`;
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ text: SHARE_TEXT, url });
        return;
      } catch (e) {
        // The person closed the sheet: nothing to do. Any other failure falls through to the copy.
        if (e instanceof DOMException && e.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(`${SHARE_TEXT} ${url}`);
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), COPIED_FOR_MS);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex w-full flex-col items-center gap-2">
      <Button full variant="secondary" icon={copied ? "Check" : "Share2"} onClick={() => void share()} className="!h-auto min-h-[48px] py-2.5 text-center">
        {copied ? "Link copied" : "Tell 3 people who should put their name on it"}
      </Button>
      <span role="status" aria-live="polite" className="sr-only">
        {copied ? "Link copied" : ""}
      </span>
    </div>
  );
}
