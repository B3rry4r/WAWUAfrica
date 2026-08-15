import type { Content, FeedQuery, FeedTab } from "@/types/content";
import { delay } from "../client";

/**
 * Mock feed data. The backend is being rewritten — treat docs/02 §3 as the target
 * shape. These items cover all six content types and free/locked states so every
 * card variant can be exercised without a live API.
 *
 * Note: fullAssetUrl intentionally never exists here (or anywhere client-side).
 * A paid asset URL is server-side gated and must never appear before purchase.
 */

const creators = {
  adaeze: {
    wawuId: "wawu-adaeze",
    name: "Adaeze Okonkwo",
    handle: "adaeze",
    verification: "certified_professional" as const,
  },
  zainab: {
    wawuId: "wawu-zainab",
    name: "Zainab Bello",
    handle: "zainab",
    verification: "verified_business" as const,
  },
  musa: {
    wawuId: "wawu-musa",
    name: "Musa Danladi",
    handle: "musa",
  },
  ifeanyi: {
    wawuId: "wawu-ifeanyi",
    name: "Ifeanyi Nwosu",
    handle: "ifeanyi",
    verification: "verified_business" as const,
  },
  tunde: {
    wawuId: "wawu-tunde",
    name: "Tunde Bakare",
    handle: "tunde",
  },
  chioma: {
    wawuId: "wawu-chioma",
    name: "Chioma Eze",
    handle: "chioma",
    verification: "verified_user" as const,
  },
};

const img = (seed: number) => `https://picsum.photos/seed/wawu${seed}/800/1000`;

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const now = Date.now();
const ago = (ms: number) => new Date(now - ms).toISOString();

export const MOCK_FEED: Content[] = [
  {
    id: "content-cac-course",
    contentType: "course",
    deliveryMode: "stream",
    accessType: "paid",
    title: "CAC in 7 days",
    description:
      "Register your company with the Corporate Affairs Commission without an agent. Six lessons, 48 minutes, templates included.",
    price: 2500,
    previewAssetUrl: img(1),
    fullAssetLocked: true,
    status: "approved",
    creator: creators.adaeze,
    publishedAt: ago(2 * HOUR),
    views: 4821,
    commentCount: 214,
    rating: 4.9,
  },
  {
    id: "content-playbook-pdf",
    contentType: "pdf",
    deliveryMode: "download",
    accessType: "free",
    title: "The trader's playbook",
    description: "34 pages of sourcing, pricing and market entry notes. Free to download.",
    price: 0,
    previewAssetUrl: img(2),
    fullAssetLocked: false,
    status: "approved",
    creator: creators.zainab,
    publishedAt: ago(5 * HOUR),
    views: 12830,
    commentCount: 512,
    rating: 4.8,
  },
  {
    id: "content-welding-video",
    contentType: "video",
    deliveryMode: "stream",
    accessType: "paid",
    title: "Welding rebar the right way",
    description: "18 minutes of close-up technique for safe, code-compliant rebar work.",
    price: 1500,
    previewAssetUrl: img(3),
    fullAssetLocked: true,
    status: "approved",
    creator: creators.musa,
    publishedAt: ago(1 * HOUR),
    views: 943,
    commentCount: 38,
    rating: 4.6,
  },
  {
    id: "content-invoice-template",
    contentType: "template",
    deliveryMode: "download",
    accessType: "free",
    title: "Invoice pack for tailors",
    description: "Six editable invoice files sized for small tailoring businesses.",
    price: 0,
    previewAssetUrl: img(4),
    fullAssetLocked: false,
    status: "approved",
    creator: creators.ifeanyi,
    publishedAt: ago(6 * HOUR),
    views: 2104,
    commentCount: 86,
  },
  {
    id: "content-yoruba-audio",
    contentType: "audio",
    deliveryMode: "download",
    accessType: "paid",
    title: "Yoruba folktales, vol. 2",
    description: "Nine narrated stories with an accompanying study sheet.",
    price: 1000,
    previewAssetUrl: img(5),
    fullAssetLocked: true,
    status: "approved",
    creator: creators.chioma,
    publishedAt: ago(1 * DAY),
    views: 762,
    commentCount: 41,
    rating: 4.7,
  },
  {
    id: "content-prints-image",
    contentType: "image",
    deliveryMode: "download",
    accessType: "paid",
    title: "Naija street prints",
    description: "Twelve high-resolution art prints of Lagos street scenes.",
    price: 3000,
    previewAssetUrl: img(6),
    fullAssetLocked: true,
    status: "approved",
    creator: creators.tunde,
    publishedAt: ago(3 * DAY),
    views: 1520,
    commentCount: 97,
    rating: 4.9,
  },
  {
    id: "content-export-pdf",
    contentType: "pdf",
    deliveryMode: "download",
    accessType: "free",
    title: "Cassava flour export starter",
    description: "A plain-language guide to the documentation and standards for exporting cassava flour.",
    price: 0,
    previewAssetUrl: img(7),
    fullAssetLocked: false,
    status: "approved",
    creator: creators.zainab,
    publishedAt: ago(4 * DAY),
    views: 6311,
    commentCount: 204,
  },
];

const byTab: Record<FeedTab, string[]> = {
  for_you: MOCK_FEED.map((c) => c.id),
  following: MOCK_FEED.filter((c) => c.creator.wawuId !== "wawu-musa").map((c) => c.id),
  trending: [MOCK_FEED[1].id, MOCK_FEED[0].id, MOCK_FEED[6].id],
};

export async function getMockFeed(query: FeedQuery = {}): Promise<Content[]> {
  await delay(500);
  const ids = byTab[query.tab ?? "for_you"];
  const items = ids.map((id) => MOCK_FEED.find((c) => c.id === id)).filter((c): c is Content => Boolean(c));
  const limit = query.limit ?? items.length;
  return items.slice(0, limit);
}

export async function getMockContent(id: string): Promise<Content> {
  await delay(300);
  const item = MOCK_FEED.find((c) => c.id === id);
  if (!item) throw new Error("Content not found");
  return item;
}