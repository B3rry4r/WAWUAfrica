"use client";

import { Button } from "@/components/ui/Button";

/** Share button for the profile hero — copies the profile URL. */
export function ShareButton() {
  return (
    <Button
      variant="secondary"
      icon="Share2"
      aria-label="Share"
      onClick={() => void navigator.clipboard?.writeText(window.location.href)}
      style={{ width: 48, padding: 0 }}
    />
  );
}