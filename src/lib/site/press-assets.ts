/**
 * The WAWU logo pack offered on /press (BRAND-SITE, owner 2 Nov 2026): the
 * six marks from the owner's logo files, each as an SVG and a PNG. Files sit
 * at the root of public/ so join-only mode serves them.
 *
 * No imports (scripts/check-site-mode.mjs loads this file).
 */
export interface PressAsset {
  id: string;
  title: string;
  note: string;
  svg: string;
  png: string;
  /** What the preview sits on, so each mark is seen on a surface it is meant for. */
  surface: "light" | "dark";
  kind: "wordmark" | "icon";
  /** The preview's size in pixels. */
  width: number;
  height: number;
}

export const PRESS_ASSETS: readonly PressAsset[] = [
  { id: "wordmark-colour", title: "Wordmark, full colour", note: "For white and light surfaces.", svg: "/wawu-brand-wordmark-colour.svg", png: "/wawu-brand-wordmark-colour.png", surface: "light", kind: "wordmark", width: 240, height: 55 },
  { id: "wordmark-purple", title: "Wordmark, deep purple", note: "One colour, for light surfaces.", svg: "/wawu-brand-wordmark-purple.svg", png: "/wawu-brand-wordmark-purple.png", surface: "light", kind: "wordmark", width: 240, height: 55 },
  { id: "wordmark-white", title: "Wordmark, white", note: "For dark and purple surfaces.", svg: "/wawu-brand-wordmark-white.svg", png: "/wawu-brand-wordmark-white.png", surface: "dark", kind: "wordmark", width: 240, height: 55 },
  { id: "icon-colour", title: "The smiling W, full colour", note: "For white and light surfaces.", svg: "/wawu-brand-icon-colour.svg", png: "/wawu-brand-icon-colour.png", surface: "light", kind: "icon", width: 120, height: 90 },
  { id: "icon-purple", title: "The smiling W, deep purple", note: "One colour, for light surfaces.", svg: "/wawu-brand-icon-purple.svg", png: "/wawu-brand-icon-purple.png", surface: "light", kind: "icon", width: 120, height: 90 },
  { id: "icon-white", title: "The smiling W, white", note: "For dark and purple surfaces.", svg: "/wawu-brand-icon-white.svg", png: "/wawu-brand-icon-white.png", surface: "dark", kind: "icon", width: 120, height: 90 },
];
