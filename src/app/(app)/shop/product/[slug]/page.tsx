"use client";

import { useParams } from "next/navigation";
import { ProductDetail } from "@/components/shop/ProductDetail";

export default function ProductPage() {
  const params = useParams<{ slug: string }>();
  return <ProductDetail slug={params.slug} />;
}
