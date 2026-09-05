"use client";

import { useState } from "react";
import { Icon } from "./Icon";

/**
 * THE PICTURE ON A CONTENT CARD.
 *
 * Every card in the app drew a hardcoded diagonal-stripe gradient and nothing
 * else, in every state. The preview URL was travelling the whole way from the
 * bucket, through the API, through the client mapper, onto ContentItem - and
 * then no component ever rendered it. A creator uploaded a cover and saw
 * hatching on the review screen, on their library, and in the feed.
 *
 * The stripes stay for what they were always right for: a piece with no
 * preview at all, and the moment before the image decodes.
 *
 * `locked` blurs it rather than hiding it, which is the whole point of a
 * paywall preview - showing enough that somebody can tell it is worth buying.
 */
export function ContentThumb({
  src,
  alt = "",
  locked = false,
  className = "",
  rounded = "var(--radius-media)",
}: {
  src?: string | null;
  alt?: string;
  locked?: boolean;
  className?: string;
  rounded?: string;
}) {
  // A signed URL that has expired, or a key the bucket no longer has, must
  // fall back to the placeholder rather than leave a broken-image glyph.
  const [failed, setFailed] = useState(false);
  const show = src && !failed;

  /*
    A video preview cannot go in an <img>, and this is a platform whose most
    common upload is video: putting one there fails the load and falls back to
    hatching, which is the bug this component exists to fix.

    A <video> with preload="metadata" paints its first frame, so the card gets
    a real still without downloading the file. Signed URLs carry a query
    string, so the extension has to be read from the path, not the whole URL.
  */
  const path = (src ?? "").split("?")[0];
  const isVideo = /\.(mp4|webm|mov|m4v)$/i.test(path);

  return (
    <span
      className={`relative block overflow-hidden border border-[var(--border-hairline)] bg-[repeating-linear-gradient(135deg,_var(--surface-tag)_0_12px,_var(--surface-card)_12px_24px)] ${className}`}
      style={{ borderRadius: rounded }}
    >
      {show && isVideo ? (
        <video
          src={src ?? undefined}
          onError={() => setFailed(true)}
          muted
          playsInline
          preload="metadata"
          tabIndex={-1}
          aria-label={alt || undefined}
          className={`h-full w-full object-cover ${locked ? "scale-[1.12] blur-[8px]" : ""}`}
        />
      ) : show ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          onError={() => setFailed(true)}
          loading="lazy"
          decoding="async"
          className={`h-full w-full object-cover ${locked ? "scale-[1.12] blur-[8px]" : ""}`}
        />
      ) : null}
      {locked ? (
        <span className="absolute inset-0 grid place-items-center bg-[var(--locked-veil)]">
          <Icon name="Lock" size={16} strokeWidth={2.2} color="var(--text-on-accent)" />
        </span>
      ) : null}
    </span>
  );
}
