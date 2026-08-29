"use client";

import { useState } from "react";
import { Button } from "@/components/ui";

/**
 * Share an event.
 *
 * Uses the Web Share API where it exists — on a phone that is the OS sheet
 * with WhatsApp in it, which is where a Nigerian event link actually travels.
 * Everywhere else it copies the link, and SAYS it copied: a share button that
 * silently does nothing on desktop is a share button people stop trusting.
 *
 * The `?ref=` code, when there is one, rides along in the URL — that is the
 * whole mechanism by which a shared link gets credited.
 */
export function ShareEventButton({
  eventId,
  eventName,
  referralCode,
  size = "sm",
}: {
  eventId: string;
  eventName: string;
  referralCode?: string;
  size?: "sm" | "md";
}) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const origin = typeof window === "undefined" ? "" : window.location.origin;
    const url = `${origin}/events/${eventId}${referralCode ? `?ref=${referralCode}` : ""}`;

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: eventName, url });
        return;
      } catch {
        // Dismissing the OS sheet is a choice, not a failure. Fall through to
        // copying so the tap still leaves them with the link.
      }
    }
    try {
      await navigator.clipboard?.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Button variant="secondary" size={size} icon={copied ? "Check" : "Share2"} onClick={() => void share()}>
      {copied ? "Link copied" : "Share"}
    </Button>
  );
}
