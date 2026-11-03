"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, EmptyState, ErrorState, Icon, Sheet, Skeleton } from "@/components/ui";
import { ContentThumb } from "@/components/ui/ContentThumb";
import { deletePiece, listMyPieces, sentenceFor, type UploadedPiece } from "@/lib/api/site-upload";
import { getStorageUsage, type StorageUsage } from "@/lib/api/uploads";
import {
  KIND_LABEL,
  nairaText,
  pieceState,
  placesLine,
  sizeText,
  type PieceState,
  type SiteKind,
} from "@/lib/site-upload/rules";
import { NoTierPanel, PlacesFullPanel } from "./AccessPanels";
import { useUploadAccess } from "./UploadAccess";

// A status chip that wraps: a reviewer's reason can be a sentence, and a one-line chip pushed the card off a phone's edge.
const CHIP: Record<PieceState["key"], string> = {
  review: "bg-info-tint text-info border-info",
  live: "bg-success-tint text-success border-success",
  rejected: "bg-danger-tint text-danger border-danger",
  "waiting-wallet": "bg-warning-tint text-warning border-warning",
};

function kindLabel(type: string): string {
  return (KIND_LABEL as Record<string, string>)[type] ?? type;
}

function PieceRow({ piece, onDelete }: { piece: UploadedPiece; onDelete: () => void }) {
  const state = pieceState(piece);
  const thumb = piece.coverUrl ?? piece.previewAssetUrl;
  const priceText = piece.accessType === "free" || piece.price === 0 ? "At no charge" : nairaText(piece.price);
  return (
    <li className="flex min-w-0 gap-3.5 overflow-hidden rounded-card border border-hairline bg-card p-3.5">
      <ContentThumb src={thumb} alt="" rounded="12px" className="aspect-square w-[76px] shrink-0 self-start" />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-start gap-2">
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="truncate text-[15px] font-semibold text-text-primary">{piece.title}</span>
            <span className="text-[12.5px] text-text-muted">
              {kindLabel(piece.contentType)} · {priceText}
            </span>
          </div>
          <button
            type="button"
            onClick={onDelete}
            aria-label={`Delete ${piece.title}`}
            className="grid h-[36px] w-[36px] shrink-0 cursor-pointer place-items-center rounded-full border-0 bg-transparent text-text-muted hover:bg-state-hover hover:text-danger active:bg-state-press"
          >
            <Icon name="Trash2" size={17} strokeWidth={2.1} />
          </button>
        </div>
        <div className="flex flex-col items-start gap-1.5">
          <span className={`max-w-full break-words rounded-[13px] border px-[10px] py-[4px] text-[12px] font-semibold leading-[1.35] ${CHIP[state.key]}`}>
            {state.label}
          </span>
          {state.detail ? <span className="text-[13px] leading-[1.45] text-text-secondary">{state.detail}</span> : null}
        </div>
      </div>
    </li>
  );
}

/** My uploads: every piece, newest first, with where it stands in words. */
export function MyUploads() {
  const { access, reload } = useUploadAccess();
  const [items, setItems] = useState<UploadedPiece[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [usage, setUsage] = useState<StorageUsage | null>(null);
  const [pending, setPending] = useState<UploadedPiece | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    setItems(null);
    listMyPieces()
      .then(setItems)
      .catch((e) => setError(sentenceFor(e)));
    getStorageUsage()
      .then(setUsage)
      .catch(() => setUsage(null));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const confirmDelete = async () => {
    if (!pending) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deletePiece(pending.id);
      setItems((prev) => (prev ? prev.filter((i) => i.id !== pending.id) : prev));
      setPending(null);
      reload();
      getStorageUsage()
        .then(setUsage)
        .catch(() => setUsage(null));
    } catch (e) {
      setDeleteError(sentenceFor(e));
    } finally {
      setDeleting(false);
    }
  };

  const ready = access.phase === "ready" ? access : null;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="m-0 text-[26px] font-bold leading-[1.15] tracking-[-0.03em] text-text-primary">My uploads</h1>
          {ready && ready.state !== "no-tier" ? (
            <p className="m-0 text-[13.5px] text-text-secondary">
              {placesLine(ready.places)}
              {usage ? ` · ${sizeText(usage.usedBytes)} of ${sizeText(usage.limitBytes)} stored` : ""}
            </p>
          ) : null}
        </div>
        {ready?.state === "ok" ? (
          <Button size="md" icon="Plus" href="/create/new">
            Upload a piece
          </Button>
        ) : null}
      </div>

      {ready?.state === "no-tier" ? <NoTierPanel /> : null}
      {ready?.state === "full" ? <PlacesFullPanel showMyUploads={false} /> : null}

      {error ? (
        <ErrorState title="We could not load your uploads" description={error} onRetry={load} />
      ) : items === null ? (
        <div className="flex flex-col gap-3">
          <Skeleton variant="row" className="h-[104px] rounded-card" />
          <Skeleton variant="row" className="h-[104px] rounded-card" />
        </div>
      ) : items.length === 0 ? (
        ready && ready.state === "no-tier" ? null : (
          <EmptyState
            icon="Upload"
            title="Nothing uploaded yet"
            caption="Pieces you upload show here, with where each one is in review."
            {...(ready?.state === "ok" ? { action: "Upload a piece", actionHref: "/create/new" } : {})}
          />
        )
      ) : (
        <ul className="m-0 grid list-none gap-3 p-0 dt:grid-cols-2">
          {items.map((piece) => (
            <PieceRow
              key={piece.id}
              piece={piece}
              onDelete={() => {
                setDeleteError(null);
                setPending(piece);
              }}
            />
          ))}
        </ul>
      )}

      <Sheet
        open={pending !== null}
        onClose={() => (deleting ? null : setPending(null))}
        title="Delete this piece?"
        caption="This cannot be undone. It leaves your uploads right away and gives its place back."
        desktop="modal"
      >
        <div className="flex flex-col gap-4 px-4 pb-4">
          {pending ? <span className="truncate text-[14.5px] font-semibold text-text-primary">{pending.title}</span> : null}
          {deleteError ? <span className="text-[13px] text-danger">{deleteError}</span> : null}
          <div className="flex flex-col gap-3 dt:flex-row-reverse">
            <Button full variant="danger" loading={deleting} onClick={confirmDelete}>
              Delete
            </Button>
            <Button full variant="secondary" onClick={() => setPending(null)} disabled={deleting}>
              Cancel
            </Button>
          </div>
        </div>
      </Sheet>
    </div>
  );
}
