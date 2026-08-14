"use client";

import { useCallback, useEffect, useState } from "react";
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
import { getContent, initiateUnlock, verifyUnlock } from "@/lib/api/content";
import { formatNaira } from "@/lib/format";
import type { ContentPiece, ContentType } from "@/types/content";

type PaymentState = "idle" | "processing" | "success" | "failure";

const SPLIT = 0.85;

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
  const [content, setContent] = useState<ContentPiece | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [unlockOpen, setUnlockOpen] = useState(false);
  const [payment, setPayment] = useState<PaymentState>("idle");

  const load = useCallback(() => {
    setError(null);
    setContent(null);
    getContent(params.id)
      .then((res) => setContent(res.content))
      .catch(() => setError("We could not load this piece. It may have been removed."));
  }, [params.id]);

  useEffect(load, [load]);

  const state = content ? (content.accessType === "free" ? "free" : content.purchased ? "unlocked" : "locked") : "free";

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
      <ContentHeader onBack={() => router.back()} />

      {error ? (
        <ErrorState caption={error} onRetry={load} />
      ) : !content ? (
        <DetailSkeleton />
      ) : (
        <div className="flex flex-1 flex-col gap-5 px-4 pb-8 pt-4">
          <MediaBlock content={content} state={state} />
          <TitleBlock content={content} state={state} />
          {content.contentType === "course" ? <LessonList content={content} /> : null}
          {state === "locked" ? (
            <LockedCta content={content} onUnlock={startUnlock} />
          ) : state === "unlocked" ? (
            <UnlockedActions content={content} />
          ) : null}
          <EngagementRow content={content} state={state} />
          <Comments content={content} />
        </div>
      )}

      <UnlockSheet
        open={unlockOpen}
        onClose={() => setUnlockOpen(false)}
        content={content}
        payment={payment}
        onRetry={startUnlock}
        onDone={() => {
          setUnlockOpen(false);
          setPayment("idle");
        }}
      />
    </div>
  );
}

function ContentHeader({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex items-center gap-3 border-b border-hairline px-[18px] py-3">
      <button type="button" onClick={onBack} aria-label="Back" className="grid h-[34px] w-[34px] place-items-center rounded-button border border-hairline bg-tag">
        <Icon name="ChevronLeft" size={18} color="var(--text-primary)" strokeWidth={2.2} />
      </button>
      <span className="flex-1 text-[16px] font-semibold">Content</span>
      <button type="button" aria-label="Share" className="grid h-[34px] w-[34px] place-items-center rounded-button border border-hairline bg-tag text-text-secondary">
        <Icon name="Share2" size={16} />
      </button>
      <button type="button" aria-label="Save" className="grid h-[34px] w-[34px] place-items-center rounded-button border border-hairline bg-tag text-text-secondary">
        <Icon name="Bookmark" size={16} />
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

function TitleBlock({ content, state }: { content: ContentPiece; state: string }) {
  return (
    <div className="flex flex-col gap-2.5">
      <h1 className="m-0 text-[22px] font-bold leading-snug tracking-[-0.015em]">{content.title}</h1>
      <div className="flex items-center gap-2">
        <Link href={`/creator/${content.creator.wawuId}`} className="flex min-w-0 items-center gap-2">
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
          <Button variant="secondary" size="sm">
            Follow
          </Button>
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
  const split = Math.round(content.price * SPLIT);
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

function UnlockedActions({ content }: { content: ContentPiece }) {
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
          <Button variant="secondary" size="sm" icon="Download">
            Download
          </Button>
        </div>
      ) : null}
      <Button full variant="secondary" icon="HandCoins">
        Tip {content.creator.fullName.split(" ")[0]}
      </Button>
    </div>
  );
}

function EngagementRow({ content, state }: { content: ContentPiece; state: string }) {
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
        <button type="button" className="flex flex-1 items-center justify-center gap-2 rounded-button border border-hairline bg-tag py-2.5 text-[13px] font-semibold">
          <Icon name="Share2" size={15} color="var(--text-secondary)" />
          Share
        </button>
        <button type="button" className="flex flex-1 items-center justify-center gap-2 rounded-button border border-hairline bg-tag py-2.5 text-[13px] font-semibold">
          <Icon name="Bookmark" size={15} color="var(--text-secondary)" />
          {content.saved ? "Saved" : "Save"}
        </button>
        <button type="button" className="flex flex-1 items-center justify-center gap-2 rounded-button border border-hairline bg-tag py-2.5 text-[13px] font-semibold">
          <Icon name="Star" size={15} color="var(--text-secondary)" />
          Rate
        </button>
      </div>
    </div>
  );
}

function Stat({ text }: { text: string }) {
  return <span className="text-[13px] font-medium text-text-secondary">{text}</span>;
}

const COMMENTS = [
  { name: "Emeka Obi", time: "3h", text: "Page 19 alone paid for this. I have been pricing my tomatoes wrong for two years.", likes: 12, author: false },
  { name: "Zainab Bello", time: "3h", text: "That page took the longest to write. Glad it landed.", likes: 4, author: true },
  { name: "Musa Danladi", time: "1d", text: "Does the margin sheet work for services too, or only goods?", likes: 2, author: false },
];

function Comments({ content }: { content: ContentPiece }) {
  return (
    <div className="flex flex-col gap-3.5">
      <h2 className="m-0 text-[17px] font-bold tracking-[-0.015em]">{content.commentCount} comments</h2>
      {COMMENTS.map((c) => (
        <div key={c.text} className="flex gap-3">
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
              <button type="button" className="text-[12.5px] font-semibold text-text-muted">
                Reply
              </button>
            </div>
          </div>
        </div>
      ))}
      <p className="m-0 text-[12.5px] leading-relaxed text-text-muted">
        Comments are the only way to reach a creator here unless they have paid messages on.
      </p>
      <button type="button" className="flex items-center gap-2.5 rounded-input border border-hairline bg-input px-4 py-3.5 text-left text-[14px] text-text-muted">
        <Icon name="MessageCircle" size={16} color="var(--text-muted)" />
        Add a comment
      </button>
    </div>
  );
}

function UnlockSheet({
  open,
  onClose,
  content,
  payment,
  onRetry,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  content: ContentPiece | null;
  payment: PaymentState;
  onRetry: () => void;
  onDone: () => void;
}) {
  if (!content) return null;
  const split = Math.round(content.price * SPLIT);

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
          <Button full variant="ghost" icon="Download" onClick={onDone}>
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

function ErrorState({ caption, onRetry }: { caption: string; onRetry: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 py-12 text-center">
      <span className="grid h-[64px] w-[64px] place-items-center rounded-button bg-tag text-text-muted">
        <Icon name="FileX" size={28} />
      </span>
      <div className="flex flex-col gap-1">
        <p className="m-0 text-[17px] font-bold">Could not open this piece</p>
        <p className="m-0 text-[13.5px] text-text-secondary">{caption}</p>
      </div>
      <Button variant="secondary" onClick={onRetry}>
        Try again
      </Button>
    </div>
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