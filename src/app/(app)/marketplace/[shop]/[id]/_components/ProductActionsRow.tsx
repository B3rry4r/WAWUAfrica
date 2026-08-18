"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/Button";
import { TipSheet } from "@/components/dm/TipSheet";
import { saveMarketplaceItem, unsaveMarketplaceItem } from "@/lib/api/marketplace";
import type { ShopId } from "@/types/marketplace";

/**
 * Save / Share / Tip row (design D11, desktop-only — the mobile product
 * design has no equivalent row, just a header Share icon). Save persists via
 * POST/DELETE /marketplace/saves — it used to be local-only state that was
 * lost on reload, even though those endpoints were already wired.
 * Share follows the same navigator.share-with-clipboard-fallback pattern as
 * src/app/(app)/content/[id]/page.tsx.
 */
export function ProductActionsRow({
  shop,
  productId,
  productTitle,
  seller,
}: {
  shop: ShopId;
  productId: string;
  productTitle: string;
  /** Only present when the seller is a known WAWU creator — enables the tip button. */
  seller: { wawuId: string; name: string } | null;
}) {
  const [saved, setSaved] = useState(false);
  const [shared, setShared] = useState(false);
  const [tipOpen, setTipOpen] = useState(false);

  const toggleSaved = useCallback(async () => {
    const next = !saved;
    setSaved(next);
    try {
      if (next) await saveMarketplaceItem(shop, productId);
      else await unsaveMarketplaceItem(productId);
    } catch {
      setSaved(!next);
    }
  }, [saved, shop, productId]);

  const share = useCallback(async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (navigator.share) {
      try {
        await navigator.share({ title: productTitle, url });
        return;
      } catch {
        // user dismissed the native share sheet — fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setShared(true);
      setTimeout(() => setShared(false), 1600);
    } catch {
      // clipboard unavailable — nothing more we can do here
    }
  }, [productTitle]);

  return (
    <div className="hidden flex-wrap gap-2.5 xl:flex">
      <Button size="sm" variant="secondary" icon={saved ? "Check" : "Bookmark"} onClick={toggleSaved} aria-pressed={saved}>
        {saved ? "Saved" : "Save"}
      </Button>
      <Button size="sm" variant="secondary" icon={shared ? "Check" : "Share2"} onClick={share}>
        {shared ? "Link copied" : "Share"}
      </Button>
      {seller ? (
        <>
          <Button size="sm" variant="secondary" icon="HandCoins" onClick={() => setTipOpen(true)}>
            Tip the seller
          </Button>
          <TipSheet open={tipOpen} onClose={() => setTipOpen(false)} creator={seller} />
        </>
      ) : null}
    </div>
  );
}
