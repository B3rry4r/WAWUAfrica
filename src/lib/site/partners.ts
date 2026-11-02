/**
 * The partner logo wall (BRAND-SITE, owner 2 Nov 2026), in the owner's order.
 *
 * Each logo is a trimmed, web-sized file at the root of public/ (root files
 * are the ones join-only mode serves, see src/lib/site-mode.ts).
 * `width` and `height` are the size it is drawn at, picked so every logo
 * carries about the same visual weight; the file itself is 2x that size
 * (ISN Hubs came in tiny and is drawn at its own size).
 *
 * No imports (scripts/check-site-mode.mjs loads this file).
 */
export interface Partner {
  slug: string;
  name: string;
  src: string;
  width: number;
  height: number;
}

export const PARTNERS: readonly Partner[] = [
  { slug: "isn-hubs", name: "ISN Hubs", src: "/wawu-partner-isn-hubs.png", width: 86, height: 39 },
  { slug: "plli", name: "Pistis Life and Leadership Institute", src: "/wawu-partner-plli.png", width: 60, height: 60 },
  { slug: "edc-pan-atlantic", name: "Enterprise Development Centre, Pan-Atlantic University", src: "/wawu-partner-edc-pan-atlantic.png", width: 150, height: 60 },
  { slug: "dbn", name: "Development Bank of Nigeria", src: "/wawu-partner-dbn.png", width: 131, height: 69 },
  { slug: "learning-curve", name: "Learning Curve", src: "/wawu-partner-learning-curve.png", width: 116, height: 72 },
  { slug: "soueast", name: "Soueast", src: "/wawu-partner-soueast.png", width: 200, height: 15 },
  { slug: "canva", name: "Canva", src: "/wawu-partner-canva.png", width: 60, height: 60 },
  { slug: "flixora", name: "Flixora", src: "/wawu-partner-flixora.png", width: 170, height: 33 },
  { slug: "africa-trade-gateway", name: "Africa Trade Gateway", src: "/wawu-partner-africa-trade-gateway.png", width: 151, height: 60 },
  { slug: "fmyd", name: "Federal Ministry of Youth Development", src: "/wawu-partner-fmyd.png", width: 130, height: 69 },
  { slug: "pencom", name: "PenCom", src: "/wawu-partner-pencom.png", width: 39, height: 72 },
  { slug: "nuvion", name: "Nuvion", src: "/wawu-partner-nuvion.png", width: 170, height: 30 },
  { slug: "dreamax", name: "Dreamax", src: "/wawu-partner-dreamax.png", width: 170, height: 32 },
  { slug: "alison", name: "Alison", src: "/wawu-partner-alison.png", width: 66, height: 60 },
];
