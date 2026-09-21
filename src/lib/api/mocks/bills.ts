import type { BillCategory } from "@/lib/api/lifestyle";

/**
 * Bill categories, for the fixture build only.
 *
 * Bills Payment was the one tool in the app with NO mock path: every call went
 * straight to Flutterwave through the Hub, so in a fixture build the screen
 * could only ever render "bill payments are not switched on yet". That made
 * the grid unreviewable without production credentials, which is how it stayed
 * a wall of colour blocks for as long as it did.
 *
 * The names and codes are NOT invented. They are the exact pairs recorded in
 * lifestyle.ts's `BillCategory.code` comment, which was written from a real
 * Flutterwave response after every category whose display name differed from
 * its code came back "Invalid category code". `id` is a local ordinal: the
 * provider's own ids are not recorded anywhere in this repo and guessing them
 * would be inventing data.
 *
 * This is reached ONLY through the mock-mode fallback in the page, which is
 * gated on NEXT_PUBLIC_USE_MOCKS / an unset API base. A configured build never
 * sees it.
 */
export const billCategories: BillCategory[] = [
  { id: 1, name: "Airtime", code: "AIRTIME" },
  { id: 2, name: "Mobile Data Service", code: "MOBILEDATA" },
  { id: 3, name: "Cable Bill Payment", code: "CABLEBILLS" },
  { id: 4, name: "Utility Bills", code: "UTILITYBILLS" },
  { id: 5, name: "Internet Service", code: "INTSERVICE" },
];
