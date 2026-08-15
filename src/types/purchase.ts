import type { ContentType } from "./content";

export interface Purchase {
  id: string;
  contentId: string;
  contentType: ContentType;
  title: string;
  creatorName: string;
  price: number;
  purchasedAt: string;
}

export interface PurchasesResponse {
  items: Purchase[];
}