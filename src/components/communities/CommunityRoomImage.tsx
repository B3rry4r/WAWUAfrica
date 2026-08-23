"use client";

import { useRef, useState } from "react";
import { updateCommunityImage } from "@/lib/api/communities";
import { describeError } from "@/lib/api/errors";
import { uploadFile, UploadError } from "@/lib/api/uploads";
import { CommunityImage } from "@/components/ui/CommunityImage";
import { Icon } from "@/components/ui/Icon";

/** Mirrors the server's image-only allowlist for the `community/image` folder. */
const ACCEPTED_IMAGES = "image/png,image/jpeg,image/webp";

export interface CommunityRoomImageProps {
  communityId: string;
  src?: string | null;
  /** Placeholder glyph when the room has no picture yet. */
  icon?: "Users" | "Lock";
  iconSize?: number;
  /** Box classes for the tile — size, radius, border, background. Tokens only. */
  className?: string;
  /**
   * The signed-in account hosts this room. Only then is the change control
   * rendered — PATCH /communities/:id is host-only on the server, and drawing
   * a control that will always 403 is how dead ends get shipped.
   */
  canEdit?: boolean;
  /** Fires with the new URL (or null) once the server has really stored it. */
  onChanged?: (imageUrl: string | null) => void;
  /** Where the caller renders the failure — beside its existing error line. */
  onError?: (message: string | null) => void;
}

/**
 * The room's picture in its own header, plus the host's way to change it.
 *
 * There was no edit surface for a community at all, so a host who picked the
 * wrong picture — or created the room before pictures existed — had no way
 * back. This is deliberately just the picture: name and description are also
 * PATCHable server-side but have no screen yet, and inventing one here would
 * be a second create form.
 */
export function CommunityRoomImage({
  communityId,
  src,
  icon = "Users",
  iconSize = 19,
  className = "",
  canEdit = false,
  onChanged,
  onError,
}: CommunityRoomImageProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const pick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setBusy(true);
    onError?.(null);
    try {
      const uploaded = await uploadFile(file, "community/image");
      // Only report the change once the server has stored it — a picture that
      // looks changed and is not is worse than one that failed loudly.
      const updated = await updateCommunityImage(communityId, uploaded.fileUrl);
      onChanged?.(updated.imageUrl ?? null);
    } catch (err) {
      if (err instanceof UploadError) {
        onError?.(err.message);
      } else {
        const described = describeError(err);
        onError?.(`${described.title}. ${described.body}`);
      }
    } finally {
      setBusy(false);
    }
  };

  if (!canEdit) {
    return <CommunityImage src={src} icon={icon} iconSize={iconSize} className={className} />;
  }

  return (
    <span className="relative shrink-0">
      <input ref={inputRef} type="file" accept={ACCEPTED_IMAGES} onChange={pick} className="hidden" tabIndex={-1} />
      <CommunityImage src={src} icon={icon} iconSize={iconSize} className={className} />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        aria-label={src ? "Change the room picture" : "Add a room picture"}
        className="absolute -bottom-[3px] -right-[3px] grid h-[20px] w-[20px] cursor-pointer place-items-center rounded-full border border-hairline bg-elevated text-text-secondary enabled:hover:bg-state-hover enabled:active:bg-state-press disabled:cursor-default"
      >
        <Icon
          name={busy ? "Loader2" : "Camera"}
          size={11}
          strokeWidth={2.2}
          className={busy ? "[animation:wawuSpin_900ms_linear_infinite]" : ""}
        />
      </button>
    </span>
  );
}
