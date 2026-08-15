"use client";

import { Button } from "@/components/ui/Button";

/** Share button for the profile hero — copies the profile URL. */
export function ShareButton() {
  return (
    <Button
      variant="secondary"
      size="sm"
      icon="Share2"
      aria-label="Share"
      className="w-12"
      onClick={() => void navigator.clipboard?.writeText(window.location.href)}
    />
  );
}
