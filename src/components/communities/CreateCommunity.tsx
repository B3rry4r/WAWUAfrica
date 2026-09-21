"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCommunity } from "@/lib/api/communities";
import { describeError } from "@/lib/api/errors";
import { creatorGates } from "@/lib/auth/gates";
import { useSession } from "@/lib/auth/session-provider";
import { useCreatorState } from "@/lib/auth/use-creator-state";
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
 * Create a community.
 *
 * Private rooms used to be a Pro-tier perk, with a "move up to Pro" card
 * attached to the option. Subscriptions are gone, so there is no tier to move
 * up to and that card would have been a paywall nobody could pay: both kinds
 * are open to every creator account now. FLAGGED: the server may still refuse
 * `kind: "private"` for a non-Pro row until the backend catches up, and a
 * genuine 403 is surfaced as-is rather than pre-empted here.
 *
 * The one gate left is explained, never silently enforced: no creator account
 * and the whole screen says so, pointing at the flow that fixes it.
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

  const trimmedName = name.trim();
  const trimmedDescription = description.trim();
  const ready = trimmedName.length >= 3 && trimmedDescription.length >= 10;

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
          caption="Anyone can join and talk in a community. Hosting one of your own comes with a creator account, at no charge."
          action="Set up a creator account"
          actionHref="/onboarding"
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
            <span className="font-semibold text-text-primary">85%</span> of every credit spent in here, the same as
            everything else you sell.
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
                Anyone can join and start talking straight away.
              </span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => setKind("private")}
            className={`flex w-full cursor-pointer gap-[12px] rounded-card border p-[15px] text-left font-[family-name:var(--font-sans)] ${
              kind === "private"
                ? "border-selected bg-elevated"
                : "border-hairline bg-card hover:bg-surface-hover active:bg-surface-press"
            }`}
          >
            <Icon name="Lock" size={19} strokeWidth={2} color="var(--accent)" className="mt-[2px] shrink-0" />
            <span className="flex flex-1 flex-col gap-[3px]">
              <span className="flex items-center gap-[8px] text-[15px] font-semibold text-text-primary">Private</span>
              <span className="text-[12.5px] leading-[1.45] text-text-secondary">
                People ask to join and you approve them. Nobody reads it until you do.
              </span>
            </span>
          </button>

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
