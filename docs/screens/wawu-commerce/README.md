# WAWU Commerce — MVP storefront

18 screenshots, mobile (390px) and desktop (1440px), captured 30 Aug 2026.

**These are the real thing.** Rendered by the app against the live backend
(`WAWU-Hub-API` on :3001, Postgres, `NEXT_PUBLIC_USE_MOCKS=false`). The twelve
products were uploaded through the real admin endpoint — `POST
/api/hub/admin/shop/products`, the same one the dashboard will call — and the
cart contents were added through the real cart API.

## Entry points

| To get here | From |
|---|---|
| Storefront | Sidebar → **Shop** (desktop) · Explore → Shop (mobile) |
| An aisle | A category card on the storefront |
| Shop by budget | A budget chip on the storefront or in an aisle |
| A product | Any product card |
| **Your WOW** (cart) | The WOW button in the shop header |
| Checkout | Cart → Checkout |
| My orders | Shop header → My orders · Settings → **Shop orders** |

## The screens

| # | Screen | What it shows |
|---|---|---|
| 01 | Storefront | "What are you creating?", the eleven aisles, budget bands, WAWU picks |
| 02 | One aisle | Subcategory chips **derived from stock**, budget chips, search |
| 03 | Shop by budget | A ceiling, not a band — everything under ₦150k |
| 04 | Product detail | Gallery, WAWU VERIFIED, a real "was" price, Add to WOW |
| 05 | Added to WOW | The header count after a real add through the API |
| 06 | Your WOW | Quantities, per-line totals, and delivery stated as a conversation |
| 07 | Checkout | The delivery address, which is the load-bearing part |
| 08 | My orders | What was bought, and where it has got to |
| 09 | Explore | The mobile entry point |

## Decisions worth knowing about

**No star rating anywhere.** The brief's product card shows "⭐ 4.8". There is
no review system on this platform to derive one from, and a seeded 4.8 is
invented social proof on items costing up to ₦4m. `ratingAvg` is null, the slot
renders nothing, and it will appear on its own the day reviews exist.

**No exact stock count on the storefront.** `inStock` and `lowStock` only. A
precise figure tells a competitor what WAWU is holding; a shopper only needs to
know whether they can buy.

**Delivery is named as a conversation, on the product page and again at
checkout.** Logistics is arranged physically and off-platform, so nothing is
added to the total — and somebody spending ₦3m on a camera should learn that
before they pay, not after. The address fields are all required for the same
reason: a person reads them and carries a box there.

**The last unit sells once.** Stock is claimed by a conditional write inside
the order transaction. There is a contract test that runs two buyers at one
unit and asserts the second is refused rather than seated.

**Publish rules refuse in the right direction**, verified against the live API:
a live product with no image → 400, with no stock → 400, a "was" price at or
below the real price → 400, and a *draft* with none of those → 201. A draft is
allowed to be unfinished; the storefront is not.

## Still to build

- The dashboard UI for uploading products and working the dispatch queue. The
  endpoints exist and are exercised above; the screens are not built.
- "Build my setup" — the brief's recommender. Deliberately deferred.

## Reproducing

```
cd WAWU-Hub-API && npm run start:dev          # :3001
node mock-wawu-id/server.js                    # :3002 (MOCK_WAWU_ID_PORT)
cd WAWU-Web && npx next dev -p 3100
```
