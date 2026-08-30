import { ShopHome } from "@/components/shop/ShopHome";

/**
 * /shop — WAWU Commerce.
 *
 * Open to every signed-in account, and the product pages beneath it are open
 * to everyone: a storefront a stranger cannot open sells nothing, and a shared
 * product link has to work before somebody has signed up.
 */
export default function ShopPage() {
  return <ShopHome />;
}
