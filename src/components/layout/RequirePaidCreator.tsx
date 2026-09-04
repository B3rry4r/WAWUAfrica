"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useCreatorState } from "@/lib/auth/use-creator-state";

/**
 * The paywall. A creator account that has not paid cannot browse the app; it
 * is sent to /onboarding to pick a tier.
 *
 * Product owner's instruction (4 Sep 2026): "they should pay first". Before
 * this, an unpaid creator could reach every screen in the product from the
 * desktop sidebar that /onboarding was rendering around itself, so the plan
 * screen was a suggestion rather than a gate.
 *
 * WHAT THIS DELIBERATELY DOES NOT DO
 * - It does not gate plain USER accounts. `creator` is null for them, and a
 *   reader has nothing to pay for. Gating on accountType instead would lock
 *   out every non-creator in the product.
 * - It does not gate on KYC. Paid-and-KYC-pending is a normal state that must
 *   keep working; the two gates are independent (see gates.ts).
 * - It does not run until the server has ANSWERED. `resolved` is the whole
 *   point: acting on the sign-in-time snapshot would bounce a creator who
 *   paid on another device, which is exactly the bug creatorGates carries a
 *   warning about.
 */

/**
 * Routes an unpaid creator may still reach. Paying, reading what they are
 * agreeing to, and leaving are not optional - a paywall with no exit is a
 * trap, not a gate.
 */
const ALLOWED = ["/onboarding", "/subscription", "/terms", "/privacy", "/sign-in", "/sign-up"];

export function RequirePaidCreator({ children }: { children: ReactNode }) {
  const { creator, resolved } = useCreatorState();
  const router = useRouter();
  const pathname = usePathname();

  const allowed = ALLOWED.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const blocked = resolved && creator !== null && !creator.subscriptionPaid && !allowed;

  useEffect(() => {
    if (blocked) router.replace("/onboarding");
  }, [blocked, router]);

  // Render nothing on the way out rather than flashing the screen they are
  // not entitled to. Everyone else - users, paid creators, and anyone the
  // server has not answered for yet - passes straight through.
  if (blocked) return null;
  return <>{children}</>;
}
