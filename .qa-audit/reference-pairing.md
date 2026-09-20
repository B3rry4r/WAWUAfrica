# Reference to screen pairing

Built by hand from the 17 images in `wawuafrica-build/refs/`, the crops produced
from the composites, and the route tree under `src/app/`. No canvas parsing was
run: the references are JPGs, there is nothing to parse.

Classes are taken from the filename prefix, which is load-bearing:
TARGET (build toward it) / SPEC (product logic, not visual direction) /
REJECT (the current app, the "before") / BUG (defect evidence) /
ANNOTATED (the product owner's own markup, outranks inference).

Routes are Next.js App Router paths. The `(app)`, `(auth)`, `(focused)` and
`(marketing)` segments are route groups and do not appear in the URL.

## Two files are misclassified in the A4b manifest

The A4b table and the actual file contents disagree on two filenames, and they
look swapped:

- `target-mobile-set-2.jpg` (1125x1896) is **not** a six-screen composite. It is
  a single screenshot of the current app's Edit Profile screen with the avatar
  and cover rendering as broken-image placeholders. It is bug evidence for C2.
  Copied here as `edit_profile_bug_evidence.jpg`.
- `bug-edit-profile-broken-images.jpg` (853x1280) is **not** the Edit Profile
  bug shot. It is a third six-screen mobile composite, the same six screens in
  the same 3x2 order as sets 1 and 3, at the same canvas size as set 3. It is a
  TARGET composite. It has been cropped here as the `*_mobile_set2.jpg` files so
  the three renderings the manifest promises are all available as single screens.

Everything below reflects what the files actually contain, with the manifest
class noted where it differs.

## Table 1: every reference, and the built screen it pairs with

### Composite crops (produced by this pass, in `.qa-audit/design_shots/`)

| File | Class | Built route | Part C item |
|---|---|---|---|
| `home_mobile_set1.jpg` | TARGET | `/home` | C9 |
| `home_mobile_set2.jpg` | TARGET | `/home` | C9 |
| `home_mobile_set3.jpg` | TARGET | `/home` | C9 |
| `profile_mobile_set1.jpg` | TARGET | `/profile` (own) and `/profile/[wawuId]` (visitor) | C2, and C3 for the visitor entry |
| `profile_mobile_set2.jpg` | TARGET | `/profile`, `/profile/[wawuId]` | C2, C3 |
| `profile_mobile_set3.jpg` | TARGET | `/profile`, `/profile/[wawuId]` | C2, C3 |
| `services_mobile_set1.jpg` | TARGET | `/services` (and `/professionals` for the Top Professionals list) | C4 (service tile grid), C5 (tile-and-chevron pattern replacing the pill wall) |
| `services_mobile_set2.jpg` | TARGET | `/services`, `/professionals` | C4, C5 |
| `services_mobile_set3.jpg` | TARGET | `/services`, `/professionals` | C4, C5 |
| `events_mobile_set1.jpg` | TARGET | `/events` (Discover / My Events / Host Event map to `/events`, `/events/mine`, `/events/new`) | C4 item 6 (Upcoming Events), C10 |
| `events_mobile_set2.jpg` | TARGET | `/events`, `/events/mine`, `/events/new` | C4, C10 |
| `events_mobile_set3.jpg` | TARGET | `/events`, `/events/mine`, `/events/new` | C4, C10 |
| `learning_mobile_set1.jpg` | TARGET | `/learn` (course rows to `/learn/courses`, `/learn/courses/[id]`) | C4 item 8 (Learning and Growth), C10 (trainings available) |
| `learning_mobile_set2.jpg` | TARGET | `/learn`, `/learn/courses` | C4, C10 |
| `learning_mobile_set3.jpg` | TARGET | `/learn`, `/learn/courses` | C4, C10 |
| `marketplace_mobile_set1.jpg` | TARGET | `/shop` (products to `/shop/product/[slug]`, browse to `/shop/browse/[category]`) | No dedicated Part C item. Drives C10 (shop as a cross-sell destination) and the storefront half of C2 |
| `marketplace_mobile_set2.jpg` | TARGET | `/shop` | C10, C2 (storefront) |
| `marketplace_mobile_set3.jpg` | TARGET | `/shop` | C10, C2 (storefront) |

Note on the mobile sets: the six screens in all three composites are Home,
Profile, Services, Events, Learning, Marketplace, reading left to right then top
to bottom. Sets 2 and 3 are the higher-fidelity renderings and A4b says to prefer
them where they differ.

### Non-composite references

| File (in `refs/`) | Copied to `design_shots/` as | Class | Built route | Part C item |
|---|---|---|---|---|
| `target-profile-desktop.jpg` | `profile_desktop.jpg` | TARGET | `/profile`, `/profile/[wawuId]` at desktop width | C2 (primary profile reference) |
| `target-explore-desktop-structure.jpg` | `explore_desktop_structure.jpg` | TARGET | `/explore` at desktop width | C4 (overall page structure, including Learning and Growth) |
| `target-explore-desktop-tiles.jpg` | `explore_desktop_tiles.jpg` | TARGET | `/explore` at desktop width | C4 (service tile grid treatment) |
| `target-home-mobile.jpg` | `home_mobile.jpg` | TARGET | `/home` | C9 (structure only, with WAWU icons and lower density) |
| `target-mobile-set-2.jpg` | `edit_profile_bug_evidence.jpg` | BUG (manifest says TARGET composite: wrong) | `/profile/edit` | C2 (the avatar and cover upload bug) |
| `bug-edit-profile-broken-images.jpg` | cropped into the six `*_mobile_set2.jpg` files above | TARGET composite (manifest says BUG: wrong) | see the crop rows | C2, C4, C9 |
| `bug-notifications-plain.jpg` | not copied (reject/bug evidence, kept in `refs/`) | BUG | `/notifications` | C8. Also shows a live WAWU Credits trial state, which A4b says to raise as an open question rather than build around |
| `annotated-bills-payment-circled.jpg` | not copied | ANNOTATED | The circled row sits on `/explore`; it links to `/services/pay` | C6 (highest priority pointer). The screen depicted is Explore, not Bills Payment |
| `reject-explore-mobile.jpg` | not copied | REJECT | `/explore` | C4 (the "before") |
| `reject-profile-mobile.jpg` | not copied | REJECT | `/profile` | C2 (the "before") |
| `reject-bills-payment.jpg` | not copied | REJECT | `/services/pay` | C6 and A5 (the multi-colour tile violation) |
| `reject-offer-services-pillwall.jpg` | not copied | REJECT | `/professionals/apply` (confirmed: `FlowHeader title="Offer your services"` and the "Which fields?" pill group live there) | C5 (the pill wall to eliminate) |
| `reject-category-pillwall.jpg` | not copied | REJECT | `/profile/edit` (confirmed: the copy "These decide where you show up when someone browses Explore." is in `src/app/(app)/profile/edit/page.tsx`). The related browse screen is `/explore/categories` | C1 and C5 (deprecated 25-category taxonomy, pill-wall pattern) |
| `spec-upload-categories.jpg` | not copied | SPEC | No single route. The flow it describes spans `/create`, `/create/new` and `/create/library` | B2 and C1 (upload flow logic, not a UI target) |
| `spec-platform-journey.jpg` | not copied | SPEC | No single route. Touches `/sign-up`, `/onboarding`, `/explore`, checkout under `/shop/checkout` | C1 and B3 (one account may hold several roles, not a UI target) |

The reject and bug captures are captures of **this** repo (the bottom bar reads
Home, Communities, Explore, Messages, Settings, which is this app's nav), so each
one pairs to a live route rather than to a screen that no longer exists.

### Part C items with no reference image at all

A4b states this and the route tree confirms it. Listed so nobody goes looking:

| Part C item | Built route, where one exists | Reference |
|---|---|---|
| C1 taxonomy and specialization selector | `/explore/categories`, `/profile/edit`, `/professionals/apply` | None. Design fresh from A3 and A5 |
| C3 shareable store link landing view | `/profile/[wawuId]` exists | None |
| C7 wallet balance, earnings, withdrawal | `/wallet`, `/earnings` | None |
| C8 admin push composer | No built route found under `src/app/` | None |
| C10 cross-sell blocks | Placed across existing screens | None |

## Table 2: built screens with no reference image

These routes exist under `src/app/` and nothing in `refs/` depicts them. Any
conformance pass against the references will leave them unverified, which is a
coverage gap to state rather than to paper over.

| Route | Note |
|---|---|
| `/` (marketing landing) | Rendered by `(marketing)/components/LandingContent` |
| `/communities`, `/communities/new`, `/communities/[id]`, `/communities/[id]/requests` | Nav slot 2, no reference at all |
| `/messages`, `/messages/[threadId]`, `/messages/settings` | Nav slot 4 |
| `/settings`, `/settings/notifications`, `/settings/delete-account` | Nav slot 5 |
| `/search` | Header search target on every screen |
| `/saved`, `/purchases`, `/tickets` | |
| `/wallet`, `/earnings` | C7 has no reference by design |
| `/profile/verification`, `/profile/verification/[tier]`, `/kyc` | KYC gate |
| `/subscription`, `/onboarding` | Subscription gate and first run |
| `/create`, `/create/new`, `/create/library` | Creator FAB destinations. Only the spec infographic touches this flow |
| `/creator`, `/creator/setup` | |
| `/content/[id]` | Content detail |
| `/services/[id]`, `/services/[id]/apply`, `/services/applications/[id]` | |
| `/services/legal`, `/services/legal/intake`, `/services/cac`, `/services/cac/apply`, `/services/nepc`, `/services/care` | Service verticals. Only the parent grid is referenced |
| `/professionals`, `/professionals/[id]`, `/professionals/mine` | The Top Professionals strip is referenced, these detail screens are not |
| `/explore/creators` | |
| `/events/[id]` and its `edit`, `manage`, `scan`, `tickets` children | Event detail and host tools |
| `/learn/guides`, `/learn/guides/[id]`, `/learn/playbook` | |
| `/shop/browse/[category]`, `/shop/product/[slug]`, `/shop/checkout`, `/shop/orders`, `/shop/orders/[orderId]`, `/shop/wow` | Only the Marketplace landing is referenced |
| `/sign-in`, `/sign-up`, `/forgot-password`, `/reset-password` | |
| `/about`, `/terms`, `/privacy`, `/privacy/policy`, `/privacy/blocked` | |
| `/payment/return` | Flutterwave return leg |

## Uncertainty worth recording

- The two Explore "desktop" targets are 747x1280 portrait artboards carrying a
  mobile bottom tab bar under a top nav row, and `target-profile-desktop.jpg` is
  768x1280 portrait with a left sidebar. None of the three is a landscape desktop
  artboard. Treat "desktop" in A4b as "the wide layout", and derive the real
  desktop widths deliberately (A4 point 3).
- `target-explore-desktop-tiles.jpg` contains a "People You May Like" section,
  which C4 explicitly says to remove. The reference is not authoritative there.
- `marketplace_mobile_set*` has no Part C item of its own. It is paired to
  `/shop` on content grounds, not on a brief instruction.
- The Events references show ticket prices and ticket calls to action (trending
  events at N10,000 and N5,000 in every set, a N25,000 summit card in set 2, and
  a "Get Tickets" button in `target-explore-desktop-tiles.jpg`). The product
  notes in `CLAUDE.md` say events carry no ticketing, no pricing and no payment,
  while the route tree already has `/events/[id]/tickets`, `/events/[id]/scan`
  and `/tickets`. The references and the code agree with each other and disagree
  with the product note. A4b point 2 says a reference is not authoritative for
  fact, so this is a conflict to raise, not to resolve silently in either
  direction.
