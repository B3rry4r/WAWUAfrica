/**
 * The partner logo wall (BRAND-SITE, owner 2 Nov 2026), in the owner's order.
 *
 * Each logo is a trimmed, web-sized file at the root of public/ (root files
 * are the ones join-only mode serves, see src/lib/site-mode.ts), shown in its
 * own colours as supplied. `width` and `height` are the size it is drawn at,
 * picked so every logo carries about the same visual weight; the file itself is
 * 2x that size, or as large as the supplied file allows. ISN Hubs came in tiny
 * (116 x 69, 86 x 39 once trimmed), so it is drawn at its own pixel size: any
 * larger and it goes soft. A larger file from ISN Hubs would let it grow.
 *
 * `tile: "black"` is Dreamax, whose logo is white on black: it sits on a black
 * tile, as supplied (the file is the white mark on a clear background).
 * `wide` is a logo so long and thin that on a phone it gets a whole row.
 *
 * No imports (scripts/check-site-mode.mjs loads this file).
 */
export interface Partner {
  slug: string;
  name: string;
  src: string;
  width: number;
  height: number;
  tile?: "black";
  wide?: boolean;
}

export const PARTNERS: readonly Partner[] = [
  { slug: "isn-hubs", name: "ISN Hubs", src: "/wawu-partner-isn-hubs.png", width: 86, height: 39 },
  { slug: "plli", name: "Pistis Life and Leadership Institute", src: "/wawu-partner-plli.png", width: 88, height: 88 },
  { slug: "edc-pan-atlantic", name: "Enterprise Development Centre, Pan-Atlantic University", src: "/wawu-partner-edc-pan-atlantic.png", width: 220, height: 88 },
  { slug: "dbn", name: "Development Bank of Nigeria", src: "/wawu-partner-dbn.png", width: 182, height: 96 },
  { slug: "learning-curve", name: "Learning Curve", src: "/wawu-partner-learning-curve.png", width: 155, height: 96 },
  { slug: "soueast", name: "Soueast", src: "/wawu-partner-soueast.png", width: 220, height: 16, wide: true },
  { slug: "canva", name: "Canva", src: "/wawu-partner-canva.png", width: 88, height: 88 },
  { slug: "africa-trade-gateway", name: "Africa Trade Gateway", src: "/wawu-partner-africa-trade-gateway.png", width: 220, height: 87 },
  { slug: "fmyd", name: "Federal Ministry of Youth Development", src: "/wawu-partner-fmyd.png", width: 181, height: 96 },
  { slug: "pencom", name: "PenCom", src: "/wawu-partner-pencom.png", width: 53, height: 96 },
  { slug: "nuvion", name: "Nuvion", src: "/wawu-partner-nuvion.png", width: 220, height: 39 },
  { slug: "dreamax", name: "Dreamax", src: "/wawu-partner-dreamax-white.png", width: 220, height: 42, tile: "black" },
  { slug: "alison", name: "Alison", src: "/wawu-partner-alison.png", width: 97, height: 88 },
];
