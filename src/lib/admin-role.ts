/**
 * Which admin role a signed-in token belongs to, for deciding what a page
 * DRAWS. The Hub's admin token (HS256, from POST /admin/auth/login) carries the
 * admin's role as a `role` claim: superadmin, reviewer, support or finance.
 *
 * This only reads the claim; it does not check the signature, and it does not
 * grant anything. The Hub's AdminRolesGuard is the gate: a role that may not
 * write is refused there with a 403 whatever this page shows. The page uses the
 * role so that a control which would only ever be refused is not drawn.
 *
 * Pure, no imports, so a plain Node test can load it.
 */
export function adminRoleFromToken(token: string | null): string | null {
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const b64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const bytes = Uint8Array.from(atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4)), (c) => c.charCodeAt(0));
    const claims: unknown = JSON.parse(new TextDecoder().decode(bytes));
    const role = claims && typeof claims === "object" ? (claims as { role?: unknown }).role : undefined;
    return typeof role === "string" && role !== "" ? role : null;
  } catch {
    return null;
  }
}

/**
 * Referral codes are created and changed by superadmin only (REF-01); finance
 * and support may read the totals, the codes and the people. A token whose role
 * cannot be read is treated as a role that cannot write.
 */
export function canChangeReferralCodes(role: string | null): boolean {
  return role === "superadmin";
}
