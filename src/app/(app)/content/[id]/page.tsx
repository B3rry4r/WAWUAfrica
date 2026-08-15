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
import { StatusPill } from "@/components/ui/StatusPill";
import { VerificationBadge } from "@/components/ui/VerificationBadge";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { FollowButton } from "@/components/shared/FollowButton";
import { TipSheet } from "@/components/dm/TipSheet";
import { getContent, initiateUnlock, verifyUnlock } from "@/lib/api/content";
import { isFollowing as fetchIsFollowing } from "@/lib/api/profile";
import { useSession } from "@/lib/auth/session-provider";
import { formatNaira, creatorSplitRate } from "@/lib/format";
import type { ContentPiece, ContentType } from "@/types/content";
import { mockComments } from "@/lib/api/mocks/mockComments";
import type { MockComment } from "@/lib/api/mocks/mockComments";

type PaymentState = "idle" | "processing" | "success" | "failure";

const typeVisual: Record<ContentType, IconName> = {
  video: "Play",
  course: "GraduationCap",
  audio: "Headphones",
  pdf: "FileText",
  image: "Image",
  template: "LayoutTemplate",
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
  const [comments, setComments] = useState<MockComment[]>(COMMENTS);
  const [draft, setDraft] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const commentInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(() => {
    setError(null);
    setContent(null);
    getContent(params.id)
      .then(async (res) => {
        setContent(res.content);
        try {
          setFollowing(await fetchIsFollowing(res.content.creator.wawuId));
        } catch {
          setFollowing(false);
        }
      })
      .catch(() => setError("We could not load this piece. It may have been removed."));
  }, [params.id]);

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
    // SEAM: replace with POST /api/hub/content/:id/save — no save-toggle
    // endpoint exists yet in src/lib/api, so this is an optimistic local toggle.
    setContent((prev) => (prev ? { ...prev, saved: !prev.saved } : prev));
  }, []);

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

  const submitComment = (e: FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !content) return;
    const isCreator = user?.wawuId === content.creator.wawuId;
    setComments((prev) => [{ name: user?.fullName ?? "You", time: "now", text, likes: 0, author: isCreator }, ...prev]);
    setContent((prev) => (prev ? { ...prev, commentCount: prev.commentCount + 1 } : prev));
    // SEAM: replace with POST /api/hub/content/:id/comments
    setDraft("");
    setReplyTo(null);
  };

  const startReply = (name: string) => {
    setReplyTo(name);
    setDraft(`@${name} `);
    commentInputRef.current?.focus();
  };

  const startUnlock = async () => {
    setUnlockOpen(true);
    setPayment("idle");
    try {
      const res = await initiateUnlock(content!.id);
      void res;
      setPayment("processing");
      const paid = await new Promise<boolean>((resolve) => setTimeout(() => resolve(true), 2400));
      if (paid) {
        const verify = await verifyUnlock(content!.id, { transaction_id: `txn-${Date.now()}`, tx_ref: `unlock-${content!.id}-${Date.now()}` });
        const data = verify.data;
        if (data.purchased) {
          setPayment("success");
          setContent((prev) => (prev ? { ...prev, purchased: true, fullAssetLocked: false, fullAssetUrl: data.fullAssetUrl } : prev));
        } else {
          setPayment("failure");
        }
      } else {
        setPayment("failure");
      }
    } catch {
      setPayment("failure");
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-surface-page">
      <ContentHeader onBack={() => router.back()} onShare={shareContent} shared={shareFeedback} saved={content?.saved ?? false} onToggleSave={toggleSaved} />

      {error ? (
        <ErrorState title="Could not open this piece" body={error} onRetry={load} />
      ) : !content ? (
        <DetailSkeleton />
      ) : (
        <div className="flex flex-1 flex-col gap-5 px-4 pb-8 pt-4">
          <MediaBlock content={content} state={state} />
          <TitleBlock content={content} state={state} following={following} />
          {content.contentType === "course" ? <LessonList content={content} /> : null}
          {state === "locked" ? (
            <LockedCta content={content} onUnlock={startUnlock} />
          ) : state === "unlocked" ? (
            <UnlockedActions
              content={content}
              onDownload={() => downloadAsset(content.fullAssetUrl, content.title)}
              onTip={() => setTipOpen(true)}
            />
          ) : null}
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
        </div>
      )}

      <UnlockSheet
        open={unlockOpen}
        onClose={() => setUnlockOpen(false)}
        content={content}
        payment={payment}
        onRetry={startUnlock}
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
          setMyRating(n);
          setRateOpen(false);
          // SEAM: replace with POST /api/hub/content/:id/rate — no rating
          // endpoint is documented yet; this is a local-only rating.
        }}
      />
    </div>
  );
}

function ContentHeader({
  onBack,
  onShare,
  shared,
  saved,
  onToggleSave,
}: {
  onBack: () => void;
  onShare: () => void;
  shared: boolean;
  saved: boolean;
  onToggleSave: () => void;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-hairline px-[18px] py-3">
      <button type="button" onClick={onBack} aria-label="Back" className="grid h-[34px] w-[34px] place-items-center rounded-button border border-hairline bg-tag">
        <Icon name="ChevronLeft" size={18} color="var(--text-primary)" strokeWidth={2.2} />
      </button>
      <span className="flex-1 text-[16px] font-semibold">Content</span>
      <button
        type="button"
        onClick={onShare}
        aria-label={shared ? "Link copied" : "Share"}
        className="grid h-[34px] w-[34px] place-items-center rounded-button border border-hairline bg-tag text-text-secondary"
      >
        <Icon name={shared ? "Check" : "Share2"} size={16} color={shared ? "var(--accent)" : undefined} />
      </button>
      <button
        type="button"
        onClick={onToggleSave}
        aria-label={saved ? "Remove from saved" : "Save"}
        aria-pressed={saved}
        className="grid h-[34px] w-[34px] place-items-center rounded-button border border-hairline bg-tag text-text-secondary"
      >
        <Icon name="Bookmark" size={16} color={saved ? "var(--accent)" : undefined} fill={saved ? "var(--accent)" : "none"} />
      </button>
    </div>
  );
}

function MediaBlock({ content, state }: { content: ContentPiece; state: string }) {
  return (
    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-media border border-hairline" style={{ background: "repeating-linear-gradient(135deg, var(--surface-tag) 0 12px, var(--surface-card) 12px 24px)" }}>
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
        <Link href={`/profile/${content.creator.wawuId}`} className="flex min-w-0 items-center gap-2">
          <span className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-full bg-accent-tint text-[13px] font-semibold text-accent-hover">
            {content.creator.fullName.charAt(0)}
          </span>
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="flex items-center gap-1.5">
              <span className="truncate text-[14px] font-semibold">{content.creator.fullName}</span>
              <VerificationBadge tier={content.creator.verificationLevel} />
            </span>
            <span className="truncate text-[12px] text-text-muted">
              {content.creator.headline} · {content.creator.location}
            </span>
          </span>
        </Link>
        <span className="ml-auto">
          <FollowButton key={`follow-${content.creator.wawuId}-${following}`} wawuId={content.creator.wawuId} initial={following} size="sm" />
        </span>
      </div>
      <p className="m-0 text-[14.5px] leading-relaxed text-text-secondary">{content.description}</p>
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
          <span className="shrink-0 text-[12.5px] text-text-muted" style={{ fontFeatureSettings: "var(--font-feature-tabular)" }}>
            {lesson.durationLabel}
          </span>
        </div>
      ))}
      {rest > 0 ? <div className="flex items-center justify-center px-4 py-3.5 text-[13.5px] font-semibold text-accent">And {rest} more lessons</div> : null}
      <div className="border-t border-hairline px-4 py-2.5 text-[12px] text-text-muted">
        <span className="inline-flex items-center gap-1.5">
          <Icon name="Lock" size={12} color="var(--text-muted)" />
          Lesson 1 is free{content.accessType === "paid" ? ` — unlock for ${formatNaira(content.price)}` : ""}
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
          className="flex flex-1 items-center justify-center gap-2 rounded-button border border-hairline bg-tag py-2.5 text-[13px] font-semibold"
        >
          <Icon name={shared ? "Check" : "Share2"} size={15} color={shared ? "var(--accent)" : "var(--text-secondary)"} />
          {shared ? "Copied" : "Share"}
        </button>
        <button
          type="button"
          onClick={onToggleSave}
          aria-pressed={content.saved}
          className="flex flex-1 items-center justify-center gap-2 rounded-button border border-hairline bg-tag py-2.5 text-[13px] font-semibold"
        >
          <Icon name="Bookmark" size={15} color={content.saved ? "var(--accent)" : "var(--text-secondary)"} fill={content.saved ? "var(--accent)" : "none"} />
          {content.saved ? "Saved" : "Save"}
        </button>
        <button
          type="button"
          onClick={onRate}
          className="flex flex-1 items-center justify-center gap-2 rounded-button border border-hairline bg-tag py-2.5 text-[13px] font-semibold"
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

const COMMENTS: MockComment[] = mockComments; // SEAM: replace with GET /api/hub/content/:id/comments

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
              <button type="button" onClick={() => onReply(c.name)} className="text-[12.5px] font-semibold text-text-muted">
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
          className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-full bg-accent text-on-accent disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Icon name="ArrowUp" size={15} color="var(--text-on-accent)" strokeWidth={2.4} />
        </button>
      </form>
    </div>
  );
}

function UnlockSheet({
  open,
  onClose,
  content,
  payment,
  onRetry,
  onDownload,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  content: ContentPiece | null;
  payment: PaymentState;
  onRetry: () => void;
  onDownload: () => void;
  onDone: () => void;
}) {
  if (!content) return null;
  const split = Math.round(content.price * creatorSplitRate(content.creator.isPro));

  return (
    <Sheet open={open} onClose={payment === "processing" ? undefined : onClose} title={payment === "idle" ? "Unlock this piece" : undefined}>
      {payment === "idle" ? (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <span className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-[11px] border border-accent bg-accent-tint text-accent">
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
              <span className="text-[24px] font-bold tracking-[-0.02em]" style={{ fontFeatureSettings: "var(--font-feature-tabular)" }}>
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
          <span className="grid h-[64px] w-[64px] place-items-center rounded-button border border-accent bg-accent-tint">
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
    </Sheet>
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
            className="grid h-11 w-11 place-items-center rounded-button transition-colors hover:bg-tag"
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
    <div className="flex flex-col gap-5 px-4 pb-8 pt-4">
      <Skeleton className="aspect-[16/10] w-full rounded-media" />
      <div className="flex flex-col gap-2.5">
        <Skeleton className="h-[22px] w-[82%] rounded" />
        <Skeleton className="h-[18px] w-[55%] rounded" />
        <Skeleton className="h-[14px] w-full rounded" />
        <Skeleton className="h-[14px] w-[92%] rounded" />
        <Skeleton className="h-[14px] w-[70%] rounded" />
      </div>
      <Skeleton className="h-[120px] w-full rounded-card" />
    </div>
  );
}