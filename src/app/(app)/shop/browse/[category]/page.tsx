"use client";

import { useParams } from "next/navigation";
import { CategoryBrowser } from "@/components/shop/CategoryBrowser";
import { PRODUCT_CATEGORY_LABEL, type ProductCategory } from "@/types/shop";

/**
 * /shop/browse/[category] — one aisle, or "all".
 *
 * `all` is a real segment rather than a separate route: the budget bands and
 * the picks shelf both want the same grid without an aisle filter, and a
 * second component would be a fork of this one.
 */
export default function BrowsePage() {
  const params = useParams<{ category: string }>();
  const raw = params.category;
  const category =
    raw !== "all" && raw in PRODUCT_CATEGORY_LABEL ? (raw as ProductCategory) : null;
  return <CategoryBrowser category={category} />;
}
