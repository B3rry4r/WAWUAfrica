import type { Purchase, PurchasesResponse } from "@/types/purchase";

export const mockPurchases: PurchasesResponse = {
  items: [
    { id: "p1", contentId: "cac-in-7-days", contentType: "course", title: "CAC in 7 days", creatorName: "Adaeze Okonkwo", price: 2500, purchasedAt: "2026-08-12T09:00:00Z" },
    { id: "p2", contentId: "highlife-horn-stems", contentType: "audio", title: "Horn stems, vol. 2", creatorName: "Tolu Balogun", price: 1000, purchasedAt: "2026-08-10T14:00:00Z" },
    { id: "p3", contentId: "the-traders-playbook", contentType: "pdf", title: "The trader's playbook", creatorName: "Zainab Bello", price: 1500, purchasedAt: "2026-08-09T11:00:00Z" },
    { id: "p4", contentId: "invoice-pack-for-tailors", contentType: "template", title: "Invoice pack for tailors", creatorName: "Ifeanyi Nwosu", price: 0, purchasedAt: "2026-08-08T08:00:00Z" },
    { id: "p5", contentId: "welding-rebar", contentType: "video", title: "Welding rebar", creatorName: "Musa Danladi", price: 1500, purchasedAt: "2026-08-06T16:00:00Z" },
    { id: "p6", contentId: "nsukka-market-in-oils", contentType: "image", title: "Nsukka market, in oils", creatorName: "Chidi Umeh", price: 3000, purchasedAt: "2026-08-04T10:00:00Z" },
  ],
};