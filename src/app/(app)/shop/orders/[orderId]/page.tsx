"use client";

import { useParams } from "next/navigation";
import { ShopOrderDetail } from "@/components/shop/ShopOrders";

export default function ShopOrderPage() {
  const params = useParams<{ orderId: string }>();
  return <ShopOrderDetail orderId={params.orderId} />;
}
