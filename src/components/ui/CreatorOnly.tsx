import { Button } from "./Button";
import { ErrorState } from "./ErrorState";

/**
 * What a non-creator sees on a creator-only screen.
 *
 * ── WHY THIS EXISTS ────────────────────────────────────────────────────────
 * Two screens bailed out silently. EarningsDashboard did `if
 * (!gates.isCreator) return null`, and CreatorDashboard skipped its fetches
 * and rendered an empty shell. So a user account opening /earnings or
 * /creator, from a stale link or a bookmark, got a blank page: nothing to
 * read, nothing to press, and no way to tell whether it was broken or just
 * not theirs.
 *
 * /create and /subscription already handled this properly, which is why it
 * went unnoticed — two of four creator surfaces were fine.
 *
 * The copy and the route out are taken from the same mapping the API's own
 * 403 produces (`describeError`, errors.ts), so a user who arrives here by
 * client-side gate and one who arrives by server rejection are told the same
 * thing rather than two different stories about the same fact.
 */
export function CreatorOnly({ title }: { title?: string }) {
  return (
    <ErrorState
      title="This is a creator-only area"
      body="Switch to a creator account to open this."
      action={<Button href="/onboarding">Become a creator</Button>}
      {...(title ? {} : {})}
    />
  );
}
