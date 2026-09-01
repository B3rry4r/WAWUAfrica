"use client";

import { useCallback, useEffect, useState } from "react";
import { dittoApi, type DittoState } from "@/lib/api/subscription";
import { describeError } from "@/lib/api/errors";
import { PLANS } from "@/types/subscription";
import { Button, Callout, Icon, Skeleton } from "@/components/ui";

/**
 * Music distribution through Ditto Music — an OPT-IN, on Pro Max.
 *
 * Pro Max includes distribution. It does not sign anybody up to a third-party
 * service on their behalf, so this is a button and not an automatic
 * consequence of a successful charge. Nothing on the payment path writes the
 * opt-in; only this does.
 *
 * The link is shown here as well as emailed. A signup link a creator can only
 * retrieve from an inbox is one lost email away from being a benefit they paid
 * for and cannot use — and an account that signed up by phone has no address
 * at all, which is why `emailed` can legitimately be false.
 */
export function DittoDistributionCard() {
  const [state, setState] = useState<DittoState | null>(null);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setState(await dittoApi.getState());
    } catch {
      // Nothing actionable: the rest of the billing screen still works.
      setFailed(true);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function optIn() {
    setBusy(true);
    setError(null);
    try {
      setState(await dittoApi.optIn());
    } catch (e) {
      setError(describeError(e).body);
    } finally {
      setBusy(false);
    }
  }

  if (failed) return null;

  if (state === null) return <Skeleton variant="row" className="h-[150px]" />;

  // A plan that does not include distribution says nothing here. Advertising
  // it on Basic would be an upsell wearing the clothes of a feature they have.
  if (!state.eligible) return null;

  const highlight = PLANS.pro_max.highlight;

  return (
    <div className="flex flex-col gap-[13px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[16px]">
      <div className="flex items-start gap-[11px]">
        <span className="grid h-[36px] w-[36px] shrink-0 place-items-center rounded-[11px] bg-[var(--accent-tint)]">
          <Icon name="Music" size={17} color="var(--accent)" strokeWidth={2.2} />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-[2px]">
          <span className="text-[14.5px] font-semibold text-[var(--text-primary)]">
            {highlight?.title ?? "Music distribution"}
          </span>
          <span className="text-[12px] text-[var(--text-muted)]">
            {highlight?.note ?? "Powered by Ditto Music"} · {state.discountPercent}% off with Pro Max
          </span>
        </span>
      </div>

      {state.optedIn ? (
        <>
          <p className="m-0 text-[12.5px] leading-[1.5] text-[var(--text-secondary)]">
            You are opted in. Use this link to set up your Ditto account. The{" "}
            {state.discountPercent}% discount is applied through it, so do not sign up directly.
          </p>
          {state.signupUrl ? (
            <Button href={state.signupUrl} size="sm" iconRight="ExternalLink">
              Set up Ditto Music
            </Button>
          ) : null}
          <p className="m-0 text-[11.5px] leading-[1.45] text-[var(--text-muted)]">
            {state.emailed
              ? "We also sent this link to your email."
              : "There is no email address on your account, so this link lives here."}
          </p>
        </>
      ) : (
        <>
          <p className="m-0 text-[12.5px] leading-[1.5] text-[var(--text-secondary)]">
            Release unlimited music as one artist to 150+ platforms, with automatic royalty
            splits and fan analytics. Your plan takes {state.discountPercent}% off Ditto&apos;s
            price.
          </p>
          {error ? (
            <Callout tone="danger" full title="That did not go through">
              {error}
            </Callout>
          ) : null}
          <Button onClick={() => void optIn()} loading={busy} disabled={busy} size="sm">
            Opt in to music distribution
          </Button>
          <p className="m-0 text-[11.5px] leading-[1.45] text-[var(--text-muted)]">
            Opting in creates your account with Ditto Music, a separate company. Nothing is
            shared with them until you press this.
          </p>
        </>
      )}
    </div>
  );
}
