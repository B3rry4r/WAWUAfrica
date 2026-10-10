"use client";

import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import type { IconProps } from "./Icon";
import { findIcon } from "./icon-lookup";

/**
 * An icon whose name the source never writes out (an id that came from the
 * backend, such as "building-office"), so it is not in the generated set.
 *
 * The full library is fetched once, after the page has rendered, and only when
 * something asks for a name that is not in the set. Until then this draws
 * nothing, on the server and in the browser's first render alike, so the two
 * agree and hydration is never disturbed; the icon appears a moment later.
 */
let fullSet: ReadonlyMap<string, LucideIcon> | null = null;
let loading: Promise<void> | null = null;

function loadFullSet(): Promise<void> {
  loading ??= import("lucide-react").then((all) => {
    const map = new Map<string, LucideIcon>();
    for (const [key, value] of Object.entries(all)) {
      if (/^[A-Z]/.test(key) && value && typeof value === "object" && "$$typeof" in value) map.set(key, value as unknown as LucideIcon);
    }
    fullSet = map;
  });
  return loading;
}

export function LateIcon({ name, size = 18, color = "currentColor", strokeWidth = 2, ...rest }: IconProps) {
  // Always starts "not ready", even when the set was loaded earlier by another
  // icon: the server drew nothing, so the first client render must draw nothing.
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (fullSet) {
      setReady(true);
      return;
    }
    let live = true;
    void loadFullSet().then(() => live && setReady(true));
    return () => {
      live = false;
    };
  }, []);

  const Cmp = ready && fullSet ? findIcon(fullSet, name) : undefined;
  if (!Cmp) return null;
  return <Cmp width={size} height={size} color={color} strokeWidth={strokeWidth} {...rest} aria-hidden="true" />;
}
