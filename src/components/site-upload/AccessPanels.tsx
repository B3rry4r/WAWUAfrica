"use client";

import { useState } from "react";
import { Button, Icon } from "@/components/ui";
import { makeCreatorAccount, sentenceFor } from "@/lib/api/site-upload";
import { JOIN_PATH, NO_TIER_SENTENCE, PLACES_FULL_SENTENCE } from "@/lib/site-upload/rules";

/** One calm card for each reason a person cannot add a piece. Each says what to do, in a plain sentence. */
function Panel({ icon, title, children }: { icon: "Ticket" | "Layers" | "UserRound" | "TriangleAlert"; title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-card border border-hairline bg-card p-5" aria-label={title}>
      <span className="grid h-[44px] w-[44px] place-items-center rounded-[13px] border border-decor bg-decor-tint">
        <Icon name={icon} size={20} color="var(--accent)" strokeWidth={2} />
      </span>
      <div className="flex flex-col gap-2">
        <h2 className="m-0 text-[20px] font-bold leading-[1.2] tracking-[-0.02em] text-text-primary">{title}</h2>
        {children}
      </div>
    </section>
  );
}

export function NoTierPanel() {
  return (
    <Panel icon="Ticket" title="Get your upload places">
      <p className="m-0 text-[14.5px] leading-[1.55] text-text-secondary">{NO_TIER_SENTENCE}</p>
      <div className="pt-2">
        <Button full size="lg" iconRight="ArrowRight" href={JOIN_PATH}>
          Get a tier
        </Button>
      </div>
    </Panel>
  );
}

export function PlacesFullPanel({ showMyUploads = true }: { showMyUploads?: boolean }) {
  return (
    <Panel icon="Layers" title="Your places are full">
      <p className="m-0 text-[14.5px] leading-[1.55] text-text-secondary">{PLACES_FULL_SENTENCE}</p>
      <div className="flex flex-col gap-3 pt-2 sm:flex-row">
        {showMyUploads ? (
          <Button full variant="secondary" size="lg" href="/create/library">
            My uploads
          </Button>
        ) : null}
        <Button full size="lg" href={JOIN_PATH}>
          Get a bigger tier
        </Button>
      </div>
    </Panel>
  );
}

export function NotCreatorPanel({ onDone }: { onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = async () => {
    setBusy(true);
    setError(null);
    try {
      await makeCreatorAccount();
      onDone();
    } catch (e) {
      setError(sentenceFor(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Panel icon="UserRound" title="Set this account up to upload">
      <p className="m-0 text-[14.5px] leading-[1.55] text-text-secondary">
        This account is not set up to upload yet. It takes one tap, and your account keeps everything it has.
      </p>
      {error ? <p className="m-0 text-[13px] font-medium text-danger">{error}</p> : null}
      <div className="pt-2">
        <Button full size="lg" loading={busy} onClick={run}>
          Set up uploading
        </Button>
      </div>
    </Panel>
  );
}

export function AccessError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Panel icon="TriangleAlert" title="We could not load your places">
      <p className="m-0 text-[14.5px] leading-[1.55] text-text-secondary">{message}</p>
      <div className="pt-2">
        <Button full variant="secondary" size="lg" onClick={onRetry}>
          Try again
        </Button>
      </div>
    </Panel>
  );
}
