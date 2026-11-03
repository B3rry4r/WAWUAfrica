"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "@/lib/auth/session-provider";
import { NotACreatorAccount, readMyTier, readPlaces, sentenceFor, type Places } from "@/lib/api/site-upload";
import { accessState, type AccessState } from "@/lib/site-upload/rules";

/**
 * What the signed-in person may do on the join-only site (WEB-UPLOAD, R-126), from the Hub.
 *
 * Two reads, in this order. GET /me/tier first: it is also what claims a /join payment made with the
 * person's proven email or phone (R-125), so the places below already include it. Then GET
 * /creator/state for the places themselves (slotsTotal: 4, 8 or 15 by tier, 25 with a tick; slotsUsed).
 * The flat 5 of the full site is never used on this path.
 */
export type Access =
  | { phase: "loading" }
  | { phase: "error"; message: string }
  | { phase: "not-creator" }
  | { phase: "ready"; places: Places; tierName: string | null; state: AccessState };

interface Value {
  access: Access;
  reload: () => void;
}

const Ctx = createContext<Value | null>(null);

export function UploadAccessProvider({ children }: { children: ReactNode }) {
  const { user, hydrated } = useSession();
  const [access, setAccess] = useState<Access>({ phase: "loading" });
  const [key, setKey] = useState(0);
  const wawuId = user?.wawuId ?? null;
  // Read again on every move between the two pages, so the places are never one upload out of date.
  const pathname = usePathname();

  useEffect(() => {
    if (!hydrated || !wawuId) return;
    let cancelled = false;
    (async () => {
      try {
        let tierName: string | null = null;
        try {
          const tier = await readMyTier();
          tierName = tier.tier?.name ?? null;
        } catch {
          // A failed tier read does not block the places read below, which is the one that decides.
        }
        const places = await readPlaces();
        if (!cancelled) setAccess({ phase: "ready", places, tierName, state: accessState(places) });
      } catch (e) {
        if (cancelled) return;
        if (e instanceof NotACreatorAccount) setAccess({ phase: "not-creator" });
        else setAccess({ phase: "error", message: sentenceFor(e) });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hydrated, wawuId, key, pathname]);

  const reload = useCallback(() => setKey((k) => k + 1), []);
  const value = useMemo(() => ({ access, reload }), [access, reload]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useUploadAccess(): Value {
  const v = useContext(Ctx);
  if (!v) throw new Error("useUploadAccess must be used inside UploadAccessProvider");
  return v;
}
