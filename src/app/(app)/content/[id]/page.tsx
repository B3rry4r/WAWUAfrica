"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent, RefObject } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";
import { PriceChip } from "@/components/ui/PriceChip";
import { Skeleton } from "@/components/ui/Skeleton";
import { Sheet } from "@/components/ui/Sheet";
import { StatBlock } from "@/components/ui/StatBlock";
import { StatusPill } from "@/components/ui/StatusPill";
import { VerificationBadge } from "@/components/ui/VerificationBadge";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { FollowButton } from "@/components/shared/FollowButton";
import { TipSheet } from "@/components/dm/TipSheet";
import { getContent, initiateUnlock, verifyUnlock, setContentSaved, rateContent, postComment, getComments } from "@/lib/api/content";
import { relativeTime } from "@/lib/earnings-display";
import { openFlutterwaveCheckout, isFlutterwaveCancelled, checkoutCustomerFromSession } from "@/lib/flutterwave";
import type { CheckoutResult } from "@/lib/flutterwave";
import { sessionStorage } from "@/lib/auth/session-storage";
import { isFollowing as fetchIsFollowing } from "@/lib/api/profile";
import { useSession } from "@/lib/auth/session-provider";
import { formatNaira, creatorSplitRate } from "@/lib/format";
import type { ContentPiece, ContentType } from "@/types/content";
import type { MockComment } from "@/lib/api/mocks/mockComments";

/**
 * "failure" means nothing was charged (init rejected, bank declined, checkout
 * never completed). "unconfirmed" means the OPPOSITE: the charge completed and
 * money moved, but our own /unlock/verify call failed afterwards. The two must
 * never share a screen — the failure screen offers a retry, which on an
 * unconfirmed charge would start a SECOND charge for the same piece.
 */
type PaymentState = "idle" | "processing" | "success" | "failure" | "unconfirmed";

const typeVisual: Record<ContentType, IconName> = {
  video: "Play",
  course: "GraduationCap",
  audio: "Headphones",
  pdf: "FileText",
  image: "Image",
  template: "LayoutTemplate",
};

const typeLabel: Record<ContentType, string> = {
  video: "Video",
  course: "Course",
  audio: "Audio",
  pdf: "PDF",
  image: "Image",
  template: "Template",
};

export default function ContentDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useSession();
  const [content, setContent] = useState<ContentPiece | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [unlockOpen, setUnlockOpen] = useState(false);
  const [payment, setPayment] = useState<PaymentState>("idle");
  const [following, setFollowing] = useState(false);
  const [tipOpen, setTipOpen] = useState(false);
  const [shareFeedback, setShareFeedback] = useState(false);
  const [rateOpen, setRateOpen] = useState(false);
  const [myRating, setMyRating] = useState<number | null>(null);
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);
  const [commentError, setCommentError] = useState<string | null>(null);
  // Real comments, fetched per piece. This used to initialise from a shared
  // mock array and never refetch, so every piece of content showed the same
  // three fake comments to every user, and a posted comment vanished on
  // reload even though it had persisted server-side.
  const [comments, setComments] = useState<MockComment[]>([]);
  const [draft, setDraft] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const commentInputRef = useRef<HTMLInputElement>(null);

  const loadComments = useCallback((contentId: string) => {
    getComments(contentId)
      .then((rows) =>
        setComments(
          rows.map((c) => ({
            name: c.authorWawuId,
            time: relativeTime(c.createdAt),
            text: c.text,
            likes: c.likes,
            author: false,
          })),
        ),
      )
      // A comments failure must not take the whole piece down — the rest of
      // the page is still readable and purchasable.
      .catch(() => setComments([]));
  }, []);

  const load = useCallback(() => {
    setError(null);
    setContent(null);
    getContent(params.id)
      .then(async (res) => {
        setContent(res.content);
        loadComments(res.content.id);
        try {
          setFollowing(await fetchIsFollowing(res.content.creator.wawuId));
        } catch {
          setFollowing(false);
        }
      })
      .catch(() => setError("We could not load this piece. It may have been removed."));
  }, [params.id, loadComments]);

  useEffect(load, [load]);

  const state = content ? (content.accessType === "free" ? "free" : content.purchased ? "unlocked" : "locked") : "free";

  const shareContent = useCallback(async () => {
    if (!content || typeof window === "undefined") return;
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: content.title, url });
        return;
      } catch {
        // user dismissed the native share sheet — fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setShareFeedback(true);
      setTimeout(() => setShareFeedback(false), 1600);
    } catch {
      // clipboard unavailable — nothing more we can do here
    }
  }, [content]);

  const toggleSaved = useCallback(() => {
    if (!content) return;
    const next = !content.saved;
    // Optimistic, then persisted. This used to be local-only, so a save was
    // silently lost on reload.
    setContent((prev) => (prev ? { ...prev, saved: next } : prev));
    setContentSaved(content.id, next).catch(() => {
      setContent((prev) => (prev ? { ...prev, saved: !next } : prev));
    });
  }, [content]);

  const downloadAsset = useCallback((url: string | undefined, title: string) => {
    if (!url) {
      setDownloadNotice("No downloadable file is attached to this piece yet.");
      setTimeout(() => setDownloadNotice(null), 2200);
      return;
    }
    const a = document.createElement("a");
    a.href = url;
    a.download = title;
    a.rel = "noopener";
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setDownloadNotice("Download started");
    setTimeout(() => setDownloadNotice(null), 2200);
  }, []);

  const submitComment = async (e: FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !content) return;
    const isCreator = user?.wawuId === content.creator.wawuId;
    const optimistic = { name: user?.fullName ?? "You", time: "now", text, likes: 0, author: isCreator };

    setComments((prev) => [optimistic, ...prev]);
    setContent((prev) => (prev ? { ...prev, commentCount: prev.commentCount + 1 } : prev));
    setDraft("");
    setReplyTo(null);

    try {
      await postComment(content.id, text);
    } catch {
      // The comment never reached the server — take it back out rather than
      // leaving a comment on screen that is gone on the next reload.
      setComments((prev) => prev.filter((c) => c !== optimistic));
      setContent((prev) => (prev ? { ...prev, commentCount: Math.max(0, prev.commentCount - 1) } : prev));
      setCommentError("That comment did not send. Please try again.");
      setTimeout(() => setCommentError(null), 2600);
    }
  };

  const startReply = (name: string) => {
    setReplyTo(name);
    setDraft(`@${name} `);
    commentInputRef.current?.focus();
  };

  // Opens the review dialog only — no charge is started yet. The user must
  // then tap the dialog's own "Pay" button (chargeUnlock) to authorize the
  // real charge; that distinct gesture is the point of the two-step D4 design.
  const openUnlock = () => {
    setUnlockOpen(true);
    setPayment("idle");
  };

  const chargeUnlock = async () => {
    setPayment("processing");

    let charge: CheckoutResult;
    try {
      const init = await initiateUnlock(content!.id);

      const customer = checkoutCustomerFromSession(sessionStorage.getUser());
      if (!customer) {
        setPayment("failure");
        return;
      }

      // The payer completes the charge on Flutterwave's own surface, which
      // returns a real transaction_id. Both that id and the server's own
      // tx_ref go to /unlock/verify — the server re-checks the charge with
      // Flutterwave before handing back a signed fullAssetUrl, so reaching
      // past this line means a real, verified, paid-for unlock.
      charge = await openFlutterwaveCheckout(init.flutterwaveConfig, customer, {
        title: content!.title,
        description: `Unlock on WAWU`,
      }, {
        verifyPath: `/api/hub/content/${content!.id}/unlock/verify`,
        successPath: `/content/${content!.id}`,
        label: "Your unlock",
      });
    } catch (e) {
      // Nothing has been charged at this point: either the init call was
      // rejected, or the payer dismissed/failed the checkout itself. Closing
      // the checkout modal charges nothing — return the user to the review
      // dialog instead of accusing their bank of declining.
      setPayment(isFlutterwaveCancelled(e) ? "idle" : "failure");
      return;
    }

    // Past this line the charge has COMPLETED — the money has moved. Anything
    // that fails from here is a confirmation failure, never a decline, so it
    // must not be offered a retry.
    try {
      const verify = await verifyUnlock(content!.id, {
        transaction_id: charge.transaction_id,
        tx_ref: charge.tx_ref,
      });
      setPayment("success");
      setContent((prev) =>
        prev ? { ...prev, purchased: true, fullAssetLocked: false, fullAssetUrl: verify.fullAssetUrl ?? undefined } : prev,
      );
    } catch {
      setPayment("unconfirmed");
    }
  };

  /** Re-reads the piece to see whether the paid-for unlock landed server-side. */
  const refreshUnlock = async () => {
    if (!content) return;
    setPayment("processing");
    try {
      const res = await getContent(content.id);
      setContent(res.content);
      setPayment(res.content.purchased ? "success" : "unconfirmed");
    } catch {
      setPayment("unconfirmed");
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-surface-page">
      <ContentHeader
        title={content ? typeLabel[content.contentType] : "Content"}
        onBack={() => router.back()}
        onShare={shareContent}
        shared={shareFeedback}
        saved={content?.saved ?? false}
        onToggleSave={toggleSaved}
      />

      {error ? (
        <ErrorState title="Could not open this piece" body={error} onRetry={load} />
      ) : !content ? (
        <DetailSkeleton />
      ) : (
        <div className="flex flex-1 flex-col gap-5 px-4 pb-8 pt-4 xl:flex-row xl:items-start xl:gap-[26px] xl:px-[26px] xl:pb-[26px] xl:pt-[26px]">
          <div className="flex flex-col gap-5 xl:min-w-0 xl:flex-1">
            <MediaBlock content={content} state={state} />
            <TitleBlock content={content} state={state} following={following} />
            {/* Below xl this is the mobile stack (lesson list, then the CTA / owned-file
                actions). At xl the same two blocks move into the sticky right rail
                instead — see PurchasePanel — so this whole block is desktop-hidden. */}
            <div className="flex flex-col gap-5 xl:hidden">
              {content.contentType === "course" ? <LessonList content={content} /> : null}
              {state === "locked" ? (
                <LockedCta content={content} onUnlock={openUnlock} />
              ) : state === "unlocked" ? (
                <UnlockedActions
                  content={content}
                  onDownload={() => downloadAsset(content.fullAssetUrl, content.title)}
                  onTip={() => setTipOpen(true)}
                />
              ) : null}
            </div>
            {downloadNotice ? (
              <div role="status" className="rounded-button border border-hairline bg-tag px-3.5 py-2.5 text-center text-[12.5px] font-semibold text-text-secondary">
                {downloadNotice}
              </div>
            ) : null}
            <EngagementRow
              content={content}
              state={state}
              onShare={shareContent}
              shared={shareFeedback}
              onToggleSave={toggleSaved}
              rated={myRating}
              onRate={() => setRateOpen(true)}
            />
            <Comments
              content={content}
              comments={comments}
              draft={draft}
              onDraftChange={setDraft}
              onSubmit={submitComment}
              replyTo={replyTo}
              onReply={startReply}
              inputRef={commentInputRef}
            />
            {commentError ? (
              <span className="flex items-center gap-2 text-[12.5px] text-danger">
                <Icon name="TriangleAlert" size={14} color="var(--danger)" />
                {commentError}
              </span>
            ) : null}
          </div>

          <PurchasePanel
            content={content}
            state={state}
            onUnlock={openUnlock}
            onDownload={() => downloadAsset(content.fullAssetUrl, content.title)}
            onTip={() => setTipOpen(true)}
          />
        </div>
      )}

      <UnlockSheet
        open={unlockOpen}
        onClose={() => setUnlockOpen(false)}
        content={content}
        payment={payment}
        onRetry={chargeUnlock}
        onRefresh={refreshUnlock}
        onDownload={() => downloadAsset(content?.fullAssetUrl, content?.title ?? "download")}
        onDone={() => {
          setUnlockOpen(false);
          setPayment("idle");
        }}
      />

      <TipSheet
        open={tipOpen}
        onClose={() => setTipOpen(false)}
        creator={content ? { wawuId: content.creator.wawuId, name: content.creator.fullName } : null}
      />

      <RateSheet
        open={rateOpen}
        onClose={() => setRateOpen(false)}
        value={myRating}
        onRate={(n) => {
          const previous = myRating;
          setMyRating(n);
          setRateOpen(false);
          if (content) {
            rateContent(content.id, n).catch(() => setMyRating(previous));
          }
        }}
      />
    </div>
  );
}

function ContentHeader({
  title,
  onBack,
  onShare,
  shared,
  saved,
  onToggleSave,
}: {
  title: string;
  onBack: () => void;
  onShare: () => void;
  shared: boolean;
  saved: boolean;
  onToggleSave: () => void;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-hairline px-[18px] py-3 xl:h-[68px] xl:px-[26px] xl:py-0">
      <button type="button" onClick={onBack} aria-label="Back" className="grid h-[34px] w-[34px] place-items-center rounded-button border border-hairline bg-tag hover:bg-surface-hover active:bg-surface-press">
        <Icon name="ChevronLeft" size={18} color="var(--text-primary)" strokeWidth={2.2} />
      </button>
      <span className="flex-1 text-[16px] font-semibold">{title}</span>
      <button
        type="button"
        onClick={onShare}
        aria-label={shared ? "Link copied" : "Share"}
        className="grid h-[34px] w-[34px] place-items-center rounded-button border border-hairline bg-tag text-text-secondary hover:bg-surface-hover active:bg-surface-press"
      >
        <Icon name={shared ? "Check" : "Share2"} size={16} color={shared ? "var(--accent)" : undefined} />
      </button>
      <button
        type="button"
        onClick={onToggleSave}
        aria-label={saved ? "Remove from saved" : "Save"}
        aria-pressed={saved}
        className="grid h-[34px] w-[34px] place-items-center rounded-button border border-hairline bg-tag text-text-secondary hover:bg-surface-hover active:bg-surface-press"
      >
        <Icon name="Bookmark" size={16} color={saved ? "var(--accent)" : undefined} fill={saved ? "var(--accent)" : "none"} />
      </button>
    </div>
  );
}

function MediaBlock({ content, state }: { content: ContentPiece; state: string }) {
  return (
    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-media border border-hairline bg-[repeating-linear-gradient(135deg,var(--surface-tag)_0_12px,var(--surface-card)_12px_24px)]">
      <span className="absolute inset-0 grid place-items-center">
        <span className="grid h-[54px] w-[54px] place-items-center rounded-full border border-strong bg-[rgba(11,10,13,0.55)] text-text-primary backdrop-blur">
          <Icon name={typeVisual[content.contentType]} size={22} strokeWidth={2} />
        </span>
      </span>

      {content.contentType === "pdf" && state === "locked" ? (
        <span className="absolute bottom-3 left-3 inline-flex h-[24px] items-center rounded-full border border-strong bg-locked-veil px-[10px] text-[11.5px] font-semibold text-text-primary backdrop-blur">
          Preview · pages 1–{Math.min(4, content.pageCount ?? 4)} of {content.pageCount ?? 34}
        </span>
      ) : state === "locked" ? (
        <span className="absolute inset-0 grid place-items-center bg-locked-veil">
          <Icon name="Lock" size={22} color="var(--text-on-accent)" strokeWidth={2} />
        </span>
      ) : null}

      {content.contentType === "course" ? (
        <span className="absolute bottom-3 left-3 inline-flex h-[24px] items-center rounded-full border border-strong bg-locked-veil px-[10px] text-[11.5px] font-semibold text-text-primary backdrop-blur">
          {content.lessonCount} lessons
        </span>
      ) : content.contentType === "video" || content.contentType === "audio" ? (
        <span className="absolute bottom-3 left-3 inline-flex h-[24px] items-center rounded-full border border-strong bg-locked-veil px-[10px] text-[11.5px] font-semibold text-text-primary backdrop-blur">
          {content.durationLabel}
        </span>
      ) : null}

      {state === "unlocked" ? (
        <span className="absolute right-3 top-3">
          <StatusPill kind="success">Yours</StatusPill>
        </span>
      ) : (
        <span className="absolute right-3 top-3">
          {content.accessType === "free" ? <PriceChip free /> : <PriceChip amount={content.price} tone="glass" />}
        </span>
      )}
    </div>
  );
}

function TitleBlock({ content, state, following }: { content: ContentPiece; state: string; following: boolean }) {
  return (
    <div className="flex flex-col gap-2.5">
      <h1 className="m-0 text-[22px] font-bold leading-snug tracking-[-0.015em]">{content.title}</h1>
      <div className="flex items-center gap-2">
        <Link href={`/profile/${content.creator.wawuId}`} className="flex min-w-0 items-center gap-2 hover:text-accent-hover">
          <span className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-full bg-accent-tint text-[13px] font-semibold text-accent-hover">
            {content.creator.fullName.charAt(0)}
          </span>
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="flex items-center gap-1.5">
              <span className="truncate text-[14px] font-semibold">{content.creator.fullName}</span>
              <VerificationBadge tier={content.creator.verificationLevel} />
            </span>
            {(content.creator.headline || content.creator.location) && (
              <span className="truncate text-[12px] text-text-muted">
                {[content.creator.headline, content.creator.location].filter(Boolean).join(" · ")}
              </span>
            )}
          </span>
        </Link>
        <span className="ml-auto">
          <FollowButton wawuId={content.creator.wawuId} initial={following} size="sm" />
        </span>
      </div>
      <p className="m-0 text-[14.5px] leading-relaxed text-text-secondary">{content.description}</p>
    </div>
  );
}

/**
 * Sticky right rail (design D4, ~380px, xl only): price CTA / owned-file
 * actions, the lesson list for a course, then a StatBlock row (Unlocked /
 * Rating / Comments per the design). Mobile keeps the CTA and lesson list
 * stacked under the title (see the `xl:hidden` block above) instead of a
 * sticky rail — this never scrolls out of view, unlike mobile's bottom-sheet
 * CTA. The stats are duplicated here (not moved) from EngagementRow, which
 * stays intact in the main column at every width — ContentPiece has no
 * dedicated unlock-count / 5-star-rating fields yet, so this reuses the same
 * views / ratingPct / commentCount EngagementRow already computes.
 */
function PurchasePanel({
  content,
  state,
  onUnlock,
  onDownload,
  onTip,
}: {
  content: ContentPiece;
  state: string;
  onUnlock: () => void;
  onDownload: () => void;
  onTip: () => void;
}) {
  const hasContent = state === "locked" || state === "unlocked" || content.contentType === "course";
  if (!hasContent) return null;
  return (
    <div className="hidden xl:sticky xl:top-[26px] xl:flex xl:w-[380px] xl:shrink-0 xl:flex-col xl:gap-4 xl:self-start">
      {state === "locked" ? (
        <LockedCta content={content} onUnlock={onUnlock} />
      ) : state === "unlocked" ? (
        <UnlockedActions content={content} onDownload={onDownload} onTip={onTip} />
      ) : null}
      {content.contentType === "course" ? <LessonList content={content} /> : null}
      <PurchasePanelStats content={content} />
    </div>
  );
}

function PurchasePanelStats({ content }: { content: ContentPiece }) {
  return (
    <div className="flex gap-[18px] rounded-card border border-hairline bg-card px-5 py-[18px]">
      <StatBlock value={content.views.toLocaleString("en-NG")} label="Views" align="start" size="sm" />
      <StatBlock value={`${Math.round(content.ratingPct ?? 96)}%`} label="Liked" align="start" size="sm" />
      <StatBlock value={String(content.commentCount)} label="Comments" align="start" size="sm" />
    </div>
  );
}

function LessonList({ content }: { content: ContentPiece }) {
  const lessons = content.courseLessons ?? [];
  const shown = lessons.slice(0, 4);
  const rest = lessons.length - shown.length;
  return (
    <div className="overflow-hidden rounded-card border border-hairline bg-card">
      {shown.map((lesson) => (
        <div key={lesson.id} className="flex items-center gap-3 border-b border-hairline px-4 py-3.5 last:border-b-0">
          <span className="flex items-center gap-2 text-[13px] font-semibold text-text-secondary">
            {lesson.free ? <Icon name="Play" size={15} color="var(--accent)" /> : <Icon name="Lock" size={15} color="var(--text-muted)" />}
            {lesson.index}
          </span>
          <span className="min-w-0 flex-1 truncate text-[14.5px] text-text-primary">{lesson.title}</span>
          <span className="shrink-0 text-[12.5px] text-text-muted [font-feature-settings:var(--font-feature-tabular)]">
            {lesson.durationLabel}
          </span>
        </div>
      ))}
      {rest > 0 ? <div className="flex items-center justify-center px-4 py-3.5 text-[13.5px] font-semibold text-accent">And {rest} more lessons</div> : null}
      <div className="border-t border-hairline px-4 py-2.5 text-[12px] text-text-muted">
        <span className="inline-flex items-center gap-1.5">
          <Icon name="Lock" size={12} color="var(--text-muted)" />
          Lesson 1 is open{content.accessType === "paid" ? `, unlock for ${formatNaira(content.price)}` : ""}
        </span>
      </div>
    </div>
  );
}

function LockedCta({ content, onUnlock }: { content: ContentPiece; onUnlock: () => void }) {
  const split = Math.round(content.price * creatorSplitRate(content.creator.isPro));
  return (
    <div className="flex flex-col gap-4 rounded-card border border-hairline bg-card p-5">
      <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-text-muted">Preview ends</span>
      <div className="flex flex-col gap-2.5">
        <span className="flex items-center gap-2 text-[14.5px] font-semibold">
          The other {content.pageCount ? `${content.pageCount - 4} pages` : "full thing"}, yours to keep
        </span>
        {content.contentType === "pdf" ? (
          <span className="flex items-center gap-2 text-[13.5px] text-text-secondary">
            <Icon name="Check" size={15} color="var(--accent)" strokeWidth={2.4} />
            Stock and margin sheets you can print
          </span>
        ) : null}
      </div>
      <Button full size="lg" onClick={onUnlock}>
        <Icon name="Lock" size={18} strokeWidth={2.4} />
        Unlock for {formatNaira(content.price)}
      </Button>
      <span className="text-center text-[12px] text-text-muted">
        Pay once. Yours for good. {content.creator.fullName.split(" ")[0]} keeps {formatNaira(split)} of it.
      </span>
    </div>
  );
}

function UnlockedActions({ content, onDownload, onTip }: { content: ContentPiece; onDownload: () => void; onTip: () => void }) {
  return (
    <div className="flex flex-col gap-3">
      {content.contentType === "pdf" || content.contentType === "template" || content.contentType === "image" ? (
        <div className="flex items-center gap-2.5 rounded-card border border-hairline bg-card px-4 py-3.5">
          <span className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-[11px] bg-accent-tint text-accent">
            <Icon name={typeVisual[content.contentType]} size={16} />
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-[13px] font-semibold">{content.contentType === "image" ? "Full resolution" : "Your file"}</span>
            <span className="text-[12px] text-text-muted">Page 5 of {content.pageCount ?? 34}</span>
          </span>
          <Button variant="secondary" size="sm" icon="Download" onClick={onDownload}>
            Download
          </Button>
        </div>
      ) : null}
      <Button full variant="secondary" icon="HandCoins" onClick={onTip}>
        Tip {content.creator.fullName.split(" ")[0]}
      </Button>
    </div>
  );
}

function EngagementRow({
  content,
  state,
  onShare,
  shared,
  onToggleSave,
  rated,
  onRate,
}: {
  content: ContentPiece;
  state: string;
  onShare: () => void;
  shared: boolean;
  onToggleSave: () => void;
  rated: number | null;
  onRate: () => void;
}) {
  const live = state === "free" || state === "unlocked";
  if (!live) {
    return (
      <div className="flex items-center gap-5 border-y border-hairline py-3.5">
        <Stat text={`${content.views.toLocaleString("en-NG")} views`} />
        <Stat text={`${content.commentCount} comments`} />
        <span className="ml-auto text-[12.5px] font-semibold text-text-muted">{Math.round(content.ratingPct ?? 96)}% liked</span>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3 border-y border-hairline py-3.5">
      <div className="flex items-center gap-5">
        <Stat text={`${content.views.toLocaleString("en-NG")} views`} />
        <Stat text={`${content.commentCount} comments`} />
        <span className="ml-auto text-[12.5px] font-semibold text-text-muted">{Math.round(content.ratingPct ?? 96)}% liked</span>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onShare}
          className="flex flex-1 items-center justify-center gap-2 rounded-button border border-hairline bg-tag py-2.5 text-[13px] font-semibold hover:bg-surface-hover active:bg-surface-press"
        >
          <Icon name={shared ? "Check" : "Share2"} size={15} color={shared ? "var(--accent)" : "var(--text-secondary)"} />
          {shared ? "Copied" : "Share"}
        </button>
        <button
          type="button"
          onClick={onToggleSave}
          aria-pressed={content.saved}
          className="flex flex-1 items-center justify-center gap-2 rounded-button border border-hairline bg-tag py-2.5 text-[13px] font-semibold hover:bg-surface-hover active:bg-surface-press"
        >
          <Icon name="Bookmark" size={15} color={content.saved ? "var(--accent)" : "var(--text-secondary)"} fill={content.saved ? "var(--accent)" : "none"} />
          {content.saved ? "Saved" : "Save"}
        </button>
        <button
          type="button"
          onClick={onRate}
          className="flex flex-1 items-center justify-center gap-2 rounded-button border border-hairline bg-tag py-2.5 text-[13px] font-semibold hover:bg-surface-hover active:bg-surface-press"
        >
          <Icon name="Star" size={15} color={rated ? "var(--accent)" : "var(--text-secondary)"} fill={rated ? "var(--accent)" : "none"} />
          {rated ? `Rated ${rated}` : "Rate"}
        </button>
      </div>
    </div>
  );
}

function Stat({ text }: { text: string }) {
  return <span className="text-[13px] font-medium text-text-secondary">{text}</span>;
}


function Comments({
  content,
  comments,
  draft,
  onDraftChange,
  onSubmit,
  replyTo,
  onReply,
  inputRef,
}: {
  content: ContentPiece;
  comments: MockComment[];
  draft: string;
  onDraftChange: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
  replyTo: string | null;
  onReply: (name: string) => void;
  inputRef: RefObject<HTMLInputElement>;
}) {
  return (
    <div className="flex flex-col gap-3.5">
      <h2 className="m-0 text-[17px] font-bold tracking-[-0.015em]">{content.commentCount} comments</h2>
      {comments.map((c, i) => (
        <div key={`${c.name}-${c.time}-${i}`} className="flex gap-3">
          <span className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-full bg-tag text-[13px] font-semibold text-text-secondary">
            {c.name.charAt(0)}
          </span>
          <div className="min-w-0 flex-1 flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-[13.5px] font-semibold">{c.name}</span>
              {c.author ? (
                <span className="inline-flex h-[18px] items-center rounded-full bg-accent-tint px-2 text-[10px] font-bold text-accent">Author</span>
              ) : null}
              <span className="text-[11.5px] text-text-muted">· {c.time}</span>
            </div>
            <p className="m-0 mt-1 text-[14px] leading-relaxed text-text-secondary">{c.text}</p>
            <div className="mt-1.5 flex items-center gap-3">
              <span className="flex items-center gap-1 text-[12.5px] font-semibold text-text-muted">
                <Icon name="Heart" size={14} color="var(--text-muted)" />
                {c.likes}
              </span>
              <button type="button" onClick={() => onReply(c.name)} className="text-[12.5px] font-semibold text-text-muted hover:text-accent-hover">
                Reply
              </button>
            </div>
          </div>
        </div>
      ))}
      <p className="m-0 text-[12.5px] leading-relaxed text-text-muted">
        Comments are the only way to reach a creator here unless they have paid messages on.
      </p>
      <form onSubmit={onSubmit} className="flex items-center gap-2.5 rounded-input border border-hairline bg-input px-4 py-2.5 text-[14px]">
        <Icon name="MessageCircle" size={16} color="var(--text-muted)" />
        <input
          ref={inputRef}
          type="text"
          value={draft}
          onChange={(e) => onDraftChange(e.target.value)}
          placeholder={replyTo ? `Reply to ${replyTo}` : "Add a comment"}
          className="min-w-0 flex-1 bg-transparent py-1 text-text-primary outline-none placeholder:text-text-muted"
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          aria-label="Post comment"
          className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-full bg-accent text-on-accent enabled:hover:bg-accent-hover enabled:active:bg-accent-press disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Icon name="ArrowUp" size={15} color="var(--text-on-accent)" strokeWidth={2.4} />
        </button>
      </form>
    </div>
  );
}

interface UnlockDialogProps {
  open: boolean;
  onClose: () => void;
  content: ContentPiece | null;
  payment: PaymentState;
  onRetry: () => void;
  onRefresh: () => void;
  onDownload: () => void;
  onDone: () => void;
}

/**
 * Mobile bottom sheet below xl, centered ~520px dialog at xl (design D4 —
 * "the mobile bottom sheet becomes a centred modal, same three states reuse
 * this frame"). Sheet.tsx has no dialog variant, so both wrappers render the
 * same `UnlockDialogBody` here rather than forking the state markup itself.
 */
function UnlockSheet(props: UnlockDialogProps) {
  return (
    <>
      <div className="xl:hidden">
        <MobileUnlockSheet {...props} />
      </div>
      <div className="hidden xl:block">
        <DesktopUnlockDialog {...props} />
      </div>
    </>
  );
}

function MobileUnlockSheet({ open, onClose, content, payment, onRetry, onRefresh, onDownload, onDone }: UnlockDialogProps) {
  if (!content) return null;
  return (
    <Sheet open={open} onClose={payment === "processing" ? undefined : onClose} title={payment === "idle" ? "Unlock this piece" : undefined}>
      <UnlockDialogBody content={content} payment={payment} onRetry={onRetry} onRefresh={onRefresh} onDownload={onDownload} onDone={onDone} onClose={onClose} />
    </Sheet>
  );
}

function DesktopUnlockDialog({ open, onClose, content, payment, onRetry, onRefresh, onDownload, onDone }: UnlockDialogProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!open || !mounted || !content) return null;
  const canClose = payment !== "processing";

  return (
    <div className="fixed inset-0 z-50 grid place-items-center" role="dialog" aria-modal="true">
      <button type="button" aria-label="Close" className="absolute inset-0 bg-scrim" onClick={canClose ? onClose : undefined} />
      <div className="relative z-10 flex max-h-[88vh] w-[520px] flex-col gap-[18px] overflow-hidden overflow-y-auto rounded-card border border-hairline bg-elevated p-[26px] shadow-sheet [animation:wawuSheetIn_var(--dur-slow)_var(--ease-soft)]">
        {payment === "idle" ? (
          <div className="flex items-start gap-3.5">
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <h2 className="m-0 text-[21px] font-semibold leading-snug tracking-[-0.02em] text-text-primary">Unlock this {content.contentType === "course" ? "course" : "piece"}</h2>
              <span className="truncate text-[13.5px] text-text-secondary">
                {content.title} · {content.creator.fullName}
              </span>
            </div>
            {canClose ? (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-full border border-hairline bg-card text-text-secondary hover:bg-surface-hover active:bg-surface-press"
              >
                <Icon name="X" size={17} />
              </button>
            ) : null}
          </div>
        ) : null}
        <UnlockDialogBody content={content} payment={payment} onRetry={onRetry} onRefresh={onRefresh} onDownload={onDownload} onDone={onDone} onClose={onClose} />
      </div>
    </div>
  );
}

function UnlockDialogBody({
  content,
  payment,
  onRetry,
  onRefresh,
  onDownload,
  onDone,
  onClose,
}: {
  content: ContentPiece;
  payment: PaymentState;
  onRetry: () => void;
  onRefresh: () => void;
  onDownload: () => void;
  onDone: () => void;
  onClose: () => void;
}) {
  const split = Math.round(content.price * creatorSplitRate(content.creator.isPro));

  return (
    <>
      {payment === "idle" ? (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <span className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-[11px] border border-decor bg-decor-tint text-accent">
              <Icon name={typeVisual[content.contentType]} size={17} />
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-[14.5px] font-semibold">{content.title}</span>
              <span className="text-[12px] text-text-muted">
                {content.creator.fullName} · {content.pageCount ? `${content.pageCount} pages` : content.durationLabel}
              </span>
            </span>
          </div>
          <div className="rounded-input border border-hairline bg-input p-3.5">
            <div className="flex items-baseline gap-1.5">
              <span className="text-[24px] font-bold tracking-[-0.02em] [font-feature-settings:var(--font-feature-tabular)]">
                {formatNaira(content.price)}
              </span>
              <span className="text-[13px] text-text-muted">once</span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <Icon name="TrendingUp" size={15} color="var(--accent)" />
              <span className="text-[13.5px] text-text-secondary">
                {content.creator.fullName.split(" ")[0]} keeps <span className="font-semibold text-text-primary">{formatNaira(split)}</span>
              </span>
            </div>
            <div className="mt-2 flex items-center gap-2 text-[12.5px] text-text-muted">
              <Icon name="ShieldCheck" size={14} color="var(--text-muted)" />
              Card, transfer or USSD via Flutterwave
            </div>
          </div>
          <Button full size="lg" onClick={onRetry}>
            Pay {formatNaira(content.price)}
          </Button>
          <span className="text-center text-[12px] text-text-muted">Pay once. Yours for good.</span>
        </div>
      ) : null}

      {payment === "processing" ? (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <span className="h-10 w-10 animate-spin rounded-full border-[3px] border-hairline border-t-accent" />
          <p className="m-0 text-[15px] font-semibold">Confirming with your bank</p>
          <p className="m-0 text-[13px] text-text-muted">A few seconds. Keep this open.</p>
        </div>
      ) : null}

      {payment === "success" ? (
        <div className="flex flex-col items-center gap-4 py-2 text-center">
          <span className="grid h-[64px] w-[64px] place-items-center rounded-button border border-decor bg-decor-tint">
            <Icon name="Check" size={30} color="var(--accent)" strokeWidth={2.6} />
          </span>
          <div className="flex flex-col gap-1">
            <p className="m-0 text-[19px] font-bold tracking-[-0.01em]">Unlocked</p>
            <p className="m-0 text-[13.5px] leading-relaxed text-text-secondary">
              All {content.pageCount ? `${content.pageCount} pages` : "of it"} are open. It is in My purchases from now on.
            </p>
          </div>
          <Button full size="lg" iconRight="ArrowRight" onClick={onDone}>
            Start reading
          </Button>
          <Button
            full
            variant="ghost"
            icon="Download"
            onClick={() => {
              onDownload();
              onDone();
            }}
          >
            Download the file
          </Button>
        </div>
      ) : null}

      {payment === "failure" ? (
        <div className="flex flex-col items-center gap-4 py-2 text-center">
          <span className="grid h-[64px] w-[64px] place-items-center rounded-button border border-danger bg-danger-tint">
            <Icon name="X" size={30} color="var(--danger)" strokeWidth={2.4} />
          </span>
          <div className="flex flex-col gap-1">
            <p className="m-0 text-[19px] font-bold tracking-[-0.01em]">Payment did not go through</p>
            <p className="m-0 text-[13.5px] leading-relaxed text-text-secondary">
              Your bank declined it. Nothing was taken and the playbook is still available.
            </p>
          </div>
          <Button full size="lg" onClick={onRetry}>
            Try again
          </Button>
          <Button full variant="ghost" onClick={onClose}>
            Use another method
          </Button>
        </div>
      ) : null}

      {payment === "unconfirmed" ? (
        <div className="flex flex-col items-center gap-4 py-2 text-center">
          <span className="grid h-[64px] w-[64px] place-items-center rounded-button border border-warning bg-warning-tint">
            <Icon name="Clock" size={30} color="var(--warning)" strokeWidth={2.4} />
          </span>
          <div className="flex flex-col gap-1">
            <p className="m-0 text-[19px] font-bold tracking-[-0.01em]">Payment went through, we could not confirm it</p>
            <p className="m-0 text-[13.5px] leading-relaxed text-text-secondary">
              {formatNaira(content.price)} left your account and we could not finish opening the piece. You have not been
              charged twice. Refresh in a moment, or tell support and they will open it for you.
            </p>
          </div>
          <Button full size="lg" icon="RotateCcw" onClick={onRefresh}>
            Refresh
          </Button>
          <Button full variant="ghost" href="mailto:hello@wawuafrica.com">
            Contact support
          </Button>
        </div>
      ) : null}
    </>
  );
}

function RateSheet({
  open,
  onClose,
  value,
  onRate,
}: {
  open: boolean;
  onClose: () => void;
  value: number | null;
  onRate: (n: number) => void;
}) {
  return (
    <Sheet open={open} onClose={onClose} title="Rate this piece" caption="Your rating helps other buyers decide.">
      <div className="flex items-center justify-center gap-2 py-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onRate(n)}
            aria-label={`Rate ${n} star${n > 1 ? "s" : ""}`}
            className="grid h-11 w-11 place-items-center rounded-button transition-colors hover:bg-state-hover"
          >
            <Icon
              name="Star"
              size={26}
              color={value !== null && n <= value ? "var(--accent)" : "var(--text-muted)"}
              fill={value !== null && n <= value ? "var(--accent)" : "none"}
            />
          </button>
        ))}
      </div>
    </Sheet>
  );
}

function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-5 px-4 pb-8 pt-4 xl:flex-row xl:items-start xl:gap-[26px] xl:px-[26px] xl:pb-[26px] xl:pt-[26px]">
      <div className="flex flex-col gap-5 xl:min-w-0 xl:flex-1">
        <Skeleton className="aspect-[16/10] w-full rounded-media" />
        <div className="flex flex-col gap-2.5">
          <Skeleton className="h-[22px] w-[82%] rounded" />
          <Skeleton className="h-[18px] w-[55%] rounded" />
          <Skeleton className="h-[14px] w-full rounded" />
          <Skeleton className="h-[14px] w-[92%] rounded" />
          <Skeleton className="h-[14px] w-[70%] rounded" />
        </div>
        <Skeleton className="h-[120px] w-full rounded-card xl:hidden" />
      </div>
      <Skeleton className="hidden h-[220px] w-full rounded-card xl:block xl:w-[380px] xl:shrink-0" />
    </div>
  );
}