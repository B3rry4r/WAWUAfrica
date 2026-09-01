"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCommunity } from "@/lib/api/communities";
import { describeError } from "@/lib/api/errors";
import { creatorGates } from "@/lib/auth/gates";
import { useSession } from "@/lib/auth/session-provider";
import { useCreatorState } from "@/lib/auth/use-creator-state";
import { PLANS } from "@/types/subscription";
import { formatNaira } from "@/lib/format";
import { FlowHeader } from "@/components/layout/FlowHeader";
import { Button } from "@/components/ui/Button";
import { CommunityImage } from "@/components/ui/CommunityImage";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilePicker } from "@/components/ui/FilePicker";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";

type Kind = "open" | "private";

const NAME_MAX = 60;
const DESCRIPTION_MAX = 240;

/** Shell shared by every state below, so the column width never jumps. */
function Column({ children }: { children: React.ReactNode }) {
  return <div className="m-0 flex min-h-[100vh] max-w-[var(--mobile-column)] flex-col xl:max-w-[760px]">{children}</div>;
}

/**
 * Create a community — the entry point the product sold on both pricing cards
 * (docs/01 §4: Basic "unlimited messages in open communities", Pro "can
 * open/host private communities") and never shipped.
 *
 * Both gates are explained, never silently enforced:
 *   - No creator account / unpaid subscription → the whole screen says so and
 *     points at the one flow that fixes it.
 *   - Basic tier picking "Private" → the option stays visible and selectable-
 *     looking with the reason and the upgrade route attached, rather than a
 *     dead greyed row that tells nobody why (the pricing card already sold
 *     private communities as a Pro line item; this is where that promise gets
 *     cashed or explained).
 *
 * KYC is deliberately not consulted here. It gates earning, never creating.
 */
export function CreateCommunity() {
  const router = useRouter();
  const { user } = useSession();
  const { creator, resolved } = useCreatorState();
  // accountType is deliberately not part of this — see creatorGates().
  const gates = creatorGates({ creator });

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [kind, setKind] = useState<Kind>("open");
  // The room's picture, already uploaded to storage by FilePicker — this is
  // the returned URL, not the file. Optional: a room without one is normal
  // and shows the placeholder tile everywhere instead.
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canHostPrivate = gates.tier === "pro";
  const trimmedName = name.trim();
  const trimmedDescription = description.trim();
  const ready = trimmedName.length >= 3 && trimmedDescription.length >= 10 && (kind === "open" || canHostPrivate);

  // Wait for the SERVER's answer on creator-vs-user before committing to a
  // branch — the sign-in snapshot says "user" forever for anyone who
  // subscribed afterwards. See useCreatorState.
  if (!resolved) {
    return (
      <Column>
        <FlowHeader title="New community" />
        <div className="flex flex-col gap-[12px] p-[16px]">
          <Skeleton variant="row" className="h-[80px]" />
          <Skeleton variant="row" className="h-[80px]" />
        </div>
      </Column>
    );
  }

  if (!gates.isCreator) {
    return (
      <Column>
        <FlowHeader title="New community" />
        <EmptyState
          icon="Users"
          title="Hosting needs a creator account"
          caption="Anyone can join and talk in a community. Hosting one of your own is part of a creator subscription."
          action="Set up a creator account"
          actionHref="/onboarding"
        />
      </Column>
    );
  }

  // Gate 1: the subscription. Same gate as uploading — a creator account with
  // no active subscription cannot host.
  if (!gates.canUpload) {
    return (
      <Column>
        <FlowHeader title="New community" />
        <EmptyState
          icon="Lock"
          title="Your subscription is not active"
          caption={`Hosting a community comes with a creator subscription, from ${formatNaira(PLANS.basic.price)} a year. Open communities are on every tier.`}
          action="See the tiers"
          actionHref="/subscription"
        />
      </Column>
    );
  }

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const community = await createCommunity({
        name: trimmedName,
        description: trimmedDescription,
        kind,
        imageUrl,
      });
      // Straight into the room they just made — a create flow that lands you
      // back on a list is how you end up unsure whether it worked.
      router.replace(`/communities/${community.id}`);
    } catch (e) {
      const described = describeError(e);
      setError(`${described.title}. ${described.body}`);
      setSubmitting(false);
    }
  };

  return (
    <Column>
      <FlowHeader title="New community" onBack={() => router.back()} />

      <div className="flex flex-1 flex-col gap-[18px] px-[18px] pb-[24px] pt-[18px]">
        <div className="flex flex-col gap-[6px]">
          <h2 className="m-0 text-[22px] font-bold leading-[1.2] tracking-[-0.03em] text-text-primary">
            A room of your own
          </h2>
          <p className="m-0 text-[13.5px] leading-[1.5] text-text-secondary">
            Reading costs nothing. Sending costs one credit, and you keep{" "}
            <span className="font-semibold text-text-primary">90%</span> of every credit spent in here. The same on
            both tiers.
          </p>
        </div>

        <Input
          label="Name"
          name="community-name"
          value={name}
          maxLength={NAME_MAX}
          placeholder="Aba tailors circle"
          onChange={(e) => setName(e.target.value)}
          hint={`${trimmedName.length}/${NAME_MAX} · what people will look for`}
        />

        <div className="flex flex-col gap-2">
          <label htmlFor="community-description" className="text-[13px] font-semibold text-text-secondary">
            What it is for
          </label>
          <textarea
            id="community-description"
            name="community-description"
            value={description}
            maxLength={DESCRIPTION_MAX}
            rows={4}
            placeholder="Who should join, and what they will get out of it."
            onChange={(e) => setDescription(e.target.value)}
            className="w-full resize-none rounded-input border border-hairline bg-input px-4 py-3 text-[15px] text-text-primary outline-none transition-colors placeholder:text-text-disabled focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
          <span className="text-[12px] text-text-muted">
            {trimmedDescription.length}/{DESCRIPTION_MAX} · people decide from this whether to join
          </span>
        </div>

        <div className="flex flex-col gap-[10px]">
          <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-text-muted">A picture for it</span>
          {/* Shown at the size the room's own header uses, so what you pick
              here is what you will see there — and the placeholder below is
              exactly what a room without a picture gets, not a broken frame. */}
          <div className="flex items-center gap-[12px]">
            <CommunityImage
              src={imageUrl}
              icon={kind === "private" ? "Lock" : "Users"}
              iconSize={24}
              className="h-[64px] w-[64px] rounded-card border border-hairline bg-tag"
            />
            <span className="flex-1 text-[12.5px] leading-[1.5] text-text-secondary">
              {imageUrl
                ? "This is how the room will show up in every list."
                : "Optional. Without one the room shows a plain tile in every list."}
            </span>
          </div>
          <FilePicker
            folder="community/image"
            accept="image/png,image/jpeg,image/webp"
            label={imageUrl ? "Choose a different picture" : "Add a picture"}
            hint="PNG, JPG or WebP. A square one crops best."
            onUploaded={(file) => setImageUrl(file.fileUrl)}
            onCleared={() => setImageUrl(null)}
          />
        </div>

        <div className="flex flex-col gap-[10px]">
          <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-text-muted">Who can get in</span>

          <button
            type="button"
            onClick={() => setKind("open")}
            className={`flex w-full cursor-pointer gap-[12px] rounded-card border p-[15px] text-left font-[family-name:var(--font-sans)] ${
              kind === "open"
                ? "border-selected bg-elevated"
                : "border-hairline bg-card hover:bg-surface-hover active:bg-surface-press"
            }`}
          >
            <Icon name="Users" size={19} strokeWidth={2} color="var(--accent)" className="mt-[2px] shrink-0" />
            <span className="flex flex-1 flex-col gap-[3px]">
              <span className="text-[15px] font-semibold text-text-primary">Open</span>
              <span className="text-[12.5px] leading-[1.45] text-text-secondary">
                Anyone can join and start talking straight away. On every tier.
              </span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => setKind("private")}
            aria-disabled={!canHostPrivate}
            className={`flex w-full cursor-pointer gap-[12px] rounded-card border p-[15px] text-left font-[family-name:var(--font-sans)] ${
              kind === "private" && canHostPrivate
                ? "border-selected bg-elevated"
                : "border-hairline bg-card hover:bg-surface-hover active:bg-surface-press"
            }`}
          >
            <Icon name="Lock" size={19} strokeWidth={2} color="var(--accent)" className="mt-[2px] shrink-0" />
            <span className="flex flex-1 flex-col gap-[3px]">
              <span className="flex items-center gap-[8px] text-[15px] font-semibold text-text-primary">
                Private
                {!canHostPrivate ? (
                  <span className="inline-flex h-[20px] items-center rounded-full bg-tag px-[8px] text-[10.5px] font-bold uppercase tracking-[0.05em] text-text-secondary">
                    Pro
                  </span>
                ) : null}
              </span>
              <span className="text-[12.5px] leading-[1.45] text-text-secondary">
                People ask to join and you approve them. Nobody reads it until you do.
              </span>
            </span>
          </button>

          {/* The rule, said out loud, at the moment it bites — a greyed row
              with no sentence attached is why nobody knew private communities
              existed in the first place. */}
          {kind === "private" && !canHostPrivate ? (
            <div className="flex flex-col gap-[10px] rounded-card border border-hairline bg-card p-[15px]">
              <span className="text-[13.5px] font-semibold text-text-primary">Private communities come with Pro</span>
              <span className="text-[12.5px] leading-[1.5] text-text-secondary">
                Your {gates.tier === "pro" ? "Pro" : "Basic"} tier hosts open communities with unlimited messages. Pro
                adds private ones you approve people into, {PLANS.pro.slots} upload slots instead of {PLANS.basic.slots},
                and a {PLANS.pro.split}/{100 - PLANS.pro.split} split.
              </span>
              <div className="flex gap-[10px]">
                <Button size="sm" variant="secondary" className="flex-1" href="/subscription">
                  Move up to Pro
                </Button>
                <Button size="sm" variant="ghost" className="flex-1" onClick={() => setKind("open")}>
                  Make it open
                </Button>
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex items-start gap-[10px] rounded-input border border-hairline bg-card px-[14px] py-[13px]">
          <Icon name="Info" size={15} color="var(--text-muted)" className="mt-[1px]" />
          <span className="flex-1 text-[12.5px] leading-[1.5] text-text-secondary">
            You can host a community before your identity is verified. Verification only decides when what you earn is
            paid out.
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-[8px] border-t border-t-hairline px-[18px] pb-[26px] pt-[14px]">
        {error ? <span className="text-center text-[12.5px] font-semibold text-danger">{error}</span> : null}
        <Button full size="lg" disabled={!ready || submitting} loading={submitting} onClick={submit}>
          {submitting ? "Creating…" : "Create community"}
        </Button>
        <span className="self-center text-center text-[12px] leading-[1.45] text-text-muted">
          Hosted by {user?.fullName ?? "you"}. You can only host what you can keep answering.
        </span>
      </div>
    </Column>
  );
}
