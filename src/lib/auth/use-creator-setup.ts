"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getHostedCommunities } from "@/lib/api/communities";
import { contentApi } from "@/lib/api/creator-content";
import { getOwnProfile } from "@/lib/api/verification";
import { formatNaira } from "@/lib/format";
import type { IconName } from "@/components/ui/Icon";
import { creatorGates } from "./gates";
import { useCreatorState } from "./use-creator-state";
import { useSession } from "./session-provider";

export type CreatorSetupStepId = "dm" | "profile" | "community" | "kyc" | "upload";

/**
 * Three states, never a checkbox. `waiting` is for work the creator has
 * genuinely finished but somebody else has to act on (KYC in review, a piece
 * in moderation) — collapsing that into "to do" tells them to redo work they
 * already did, and collapsing it into "done" promises an outcome nobody has
 * confirmed.
 */
export type CreatorSetupStepState = "done" | "waiting" | "todo";

export interface CreatorSetupStep {
  id: CreatorSetupStepId;
  title: string;
  /** What this step is for, in one sentence. */
  body: string;
  /** The live fact behind the state — never a guess. Shown as the row's status line. */
  detail: string;
  state: CreatorSetupStepState;
  icon: IconName;
  href: string;
  cta: string;
  /**
   * True for steps that gate nothing. KYC is the only one: it decides when a
   * payout lands, never whether you can publish, host or sell. Skipping it is
   * a normal state (CLAUDE.md's two-independent-gates rule), so it must never
   * read as an incomplete requirement.
   */
  optional: boolean;
}

export interface CreatorSetupResult {
  steps: CreatorSetupStep[];
  /** Steps that gate something, i.e. everything except KYC. */
  requiredTotal: number;
  requiredDone: number;
  /** Every required step done. KYC deliberately does not count toward this. */
  complete: boolean;
  /** The next thing worth doing, or null once nothing is outstanding. */
  next: CreatorSetupStep | null;
  /** False until every live read this depends on has settled. */
  ready: boolean;
  /** Set only when a real backend read failed — the steps still render, marked from what IS known. */
  error: string | null;
  reload: () => void;
}

/**
 * The setup story, assembled entirely from live data.
 *
 * Every step's completion is read from the same endpoints the rest of the app
 * reads — the creator's live CreatorState (DM price/toggle, KYC status), their
 * real profile (GET /users/me), the communities they actually host, and their
 * real content library. Nothing here is a local checkbox: a creator who set
 * their DM price on another device, or last month, opens this and sees it
 * already ticked.
 *
 * There used to be a "Your subscription" step at the head of this list,
 * linking to /subscription. Subscriptions are gone, so the step described a
 * gate that no longer exists and pointed at a screen that no longer exists.
 * The checklist is five steps now, not six.
 *
 * Gate values come from creatorGates() only — this never re-checks `kyc`
 * itself.
 */
export function useCreatorSetup(): CreatorSetupResult {
  const { user } = useSession();
  const { creator, resolved, reload: reloadCreator } = useCreatorState();
  // accountType is deliberately not part of this — see creatorGates().
  const gates = creatorGates({ creator });

  const [handleSet, setHandleSet] = useState<boolean | null>(null);
  const [bioSet, setBioSet] = useState<boolean | null>(null);
  const [socialCount, setSocialCount] = useState<number | null>(null);
  const [hostedCount, setHostedCount] = useState<number | null>(null);
  const [publishedCount, setPublishedCount] = useState<number | null>(null);
  const [inReviewCount, setInReviewCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const isCreator = gates.isCreator;
  const wawuId = user?.wawuId ?? "";

  useEffect(() => {
    if (!resolved) return;
    if (!isCreator) {
      // A plain user has none of these surfaces. Answer with zeroes rather
      // than firing creator-only reads that would 403.
      setHandleSet(false);
      setBioSet(false);
      setSocialCount(0);
      setHostedCount(0);
      setPublishedCount(0);
      setInReviewCount(0);
      return;
    }
    let cancelled = false;
    setError(null);

    getOwnProfile()
      .then((p) => {
        if (cancelled) return;
        setHandleSet(Boolean(p.handle?.trim()));
        setBioSet(Boolean(p.bio?.trim()));
        setSocialCount(Object.values(p.socials).filter((v) => Boolean(v && String(v).trim())).length);
      })
      .catch((e) => {
        if (cancelled) return;
        // A failed read must not tick a step. Report the failure and leave
        // the profile step reading "to do" from what is genuinely known.
        setHandleSet(false);
        setBioSet(false);
        setSocialCount(0);
        setError(e instanceof Error ? e.message : "Some of your setup could not be checked.");
      });

    getHostedCommunities(wawuId)
      .then((rows) => {
        if (!cancelled) setHostedCount(rows.length);
      })
      .catch(() => {
        if (!cancelled) setHostedCount(0);
      });

    contentApi
      .getLibrary()
      .then((items) => {
        if (cancelled) return;
        setPublishedCount(items.filter((i) => i.status === "live").length);
        setInReviewCount(items.filter((i) => i.status === "review").length);
      })
      .catch(() => {
        if (cancelled) return;
        setPublishedCount(0);
        setInReviewCount(0);
      });

    return () => {
      cancelled = true;
    };
  }, [resolved, isCreator, wawuId, reloadKey]);

  const reload = useCallback(() => {
    reloadCreator();
    setReloadKey((k) => k + 1);
  }, [reloadCreator]);

  const ready =
    resolved &&
    handleSet !== null &&
    bioSet !== null &&
    socialCount !== null &&
    hostedCount !== null &&
    publishedCount !== null &&
    inReviewCount !== null;

  const steps = useMemo<CreatorSetupStep[]>(() => {
    const socials = socialCount ?? 0;
    const hosted = hostedCount ?? 0;
    const published = publishedCount ?? 0;
    const inReview = inReviewCount ?? 0;

    const profileParts = [handleSet ? "handle" : null, bioSet ? "bio" : null, socials > 0 ? "links" : null].filter(
      Boolean,
    ).length;

    const kycState: CreatorSetupStepState =
      gates.kycStatus === "approved" ? "done" : gates.kycStatus === "pending" ? "waiting" : "todo";

    const uploadState: CreatorSetupStepState = published > 0 ? "done" : inReview > 0 ? "waiting" : "todo";

    return [
      {
        id: "dm",
        title: "Price your paid messages",
        body: "Fans pay to ask you one question, and you answer inside 24 hours. You set the price. There is no range and no ceiling.",
        detail: gates.dmEnabled
          ? gates.dmPrice > 0
            ? `On · you charge ${formatNaira(gates.dmPrice)} a message`
            : "On, but you have not set a price yet"
          : gates.dmPrice > 0
            ? `Off · your price is saved at ${formatNaira(gates.dmPrice)}`
            : "Off · no price set yet",
        state: gates.dmEnabled && gates.dmPrice > 0 ? "done" : "todo",
        icon: "MessageCircleQuestion",
        href: "/messages/settings",
        cta: gates.dmPrice > 0 ? "Review it" : "Set your price",
        optional: false,
      },
      {
        id: "profile",
        title: "Finish your profile",
        body: "Your handle, a bio and the links people already know you by. This is what a buyer reads before they pay you anything.",
        detail:
          profileParts === 3
            ? "Handle, bio and links all set"
            : `${profileParts} of 3 done - ${[
                handleSet ? null : "handle",
                bioSet ? null : "bio",
                socials > 0 ? null : "social links",
              ]
                .filter(Boolean)
                .join(", ")} still empty`,
        state: profileParts === 3 ? "done" : "todo",
        icon: "UserRoundPen",
        href: "/profile/edit",
        cta: profileParts === 3 ? "Edit" : "Fill it in",
        optional: false,
      },
      {
        id: "community",
        title: "Start your first community",
        body: "A room your people talk in. Reading costs nothing, sending costs one credit, and you keep 90% of every credit spent. The best split on the platform.",
        detail:
          hosted === 0
            ? "You are not hosting one yet"
            : hosted === 1
              ? "Hosting 1 community"
              : `Hosting ${hosted} communities`,
        state: hosted > 0 ? "done" : "todo",
        icon: "Users",
        href: hosted > 0 ? "/communities" : "/communities/new",
        cta: hosted > 0 ? "See them" : "Create one",
        optional: false,
      },
      {
        id: "upload",
        title: "Publish your first piece",
        body: "You price every piece yourself, in naira. You keep 85% of each sale.",
        detail:
          published > 0
            ? published === 1
              ? "1 piece live"
              : `${published} pieces live`
            : inReview > 0
              ? `${inReview} ${inReview === 1 ? "piece" : "pieces"} in review`
              : "Nothing published yet",
        state: uploadState,
        icon: "Upload",
        href: "/create",
        cta: published > 0 ? "Upload another" : inReview > 0 ? "See your library" : "Publish it",
        optional: false,
      },
      {
        id: "kyc",
        title: "Verify your identity",
        body: "The second gate, and the only one you can skip. It decides when what you earn is paid out. Never what you can publish, host or sell.",
        detail:
          gates.kycStatus === "approved"
            ? "Approved · earnings pay out to your bank account"
            : gates.kycStatus === "pending"
              ? "In review, usually 1 to 3 days"
              : gates.kycStatus === "rejected"
                ? "Not approved. Send your ID again and we will look at it"
                : "Not started · everything you earn is counted and held until it clears",
        state: kycState,
        icon: "ShieldCheck",
        href: "/kyc",
        cta:
          gates.kycStatus === "approved"
            ? "View"
            : gates.kycStatus === "pending"
              ? "Check status"
              : gates.kycStatus === "rejected"
                ? "Resubmit"
                : "Start it",
        optional: true,
      },
    ];
  }, [
    gates.dmEnabled,
    gates.dmPrice,
    gates.kycStatus,
    handleSet,
    bioSet,
    socialCount,
    hostedCount,
    publishedCount,
    inReviewCount,
  ]);

  const required = steps.filter((s) => !s.optional);
  const requiredDone = required.filter((s) => s.state !== "todo").length;
  const next = steps.find((s) => s.state === "todo" && !s.optional) ?? steps.find((s) => s.state === "todo") ?? null;

  return {
    steps,
    requiredTotal: required.length,
    requiredDone,
    complete: ready && requiredDone === required.length,
    next,
    ready,
    error,
    reload,
  };
}
