# Seam proof — WAWU, 2026-08-31

Phase 4 of `legacy-app-repair`. Every layer below this runs against a mock by
construction; this is the only phase that can see the class of defect where a
screen renders real-looking data that never came from the server.

## Live gate — RUN, against production

Target: `https://api.wawuafrica.com` + `https://id.wawuafrica.com`, over the
public internet, from outside the droplet. Not localhost, not a tunnel.

Assertions are written as **capabilities**, not as "no error appeared"
(LESSONS § II.2):

| # | Capability | Result |
|---|---|---|
| 1 | A user can sign in against the production identity service | **PASS** — 1001-char RS256 token |
| 2 | That token is accepted by the production Hub API (real cross-service JWKS handshake, over the internet, between two separately-deployed services) | **PASS** — `GET /shop/cart` → 200 |
| 3 | **Mock-impossible:** a forged token is refused | **PASS** — → 401 |
| 4 | The JWKS serves the intended signing key | **FAILED, then FIXED — see below** |

## What the live gate caught

### 1. The production RS256 keypair was not the one I reported installing

Capability 4 returned a modulus beginning `tV9ZD1iq…`. That is the keypair I
generated in this sandbox — **not** the one carried over from Railway, whose
modulus begins `ixo999…`.

**I had reported the Railway keypair as installed. It was not.** The transport
wrote `KEY='<pem>'` into a file and read it back line by line; a PEM contains
real newlines, so the value spanned many physical lines, the per-line regex
never matched, and both RS256 entries were silently skipped. The script printed
`applied: 8 real keys` when ten were requested — **the evidence was in the
output and went unchecked** (LESSONS § VII).

Consequence had this gone unnoticed: tokens issued by the existing Railway
deployment would not validate against the new one. My earlier claim that
"tokens issued by the Railway deployment remain valid here" was false.

**Fixed:** the keypair is now transported base64-encoded so newlines cannot
break it, stored single-line with `\n` escapes (which `normalizePem()` expands),
and verified — live JWKS now serves `ixo999…`, sign-in still works, and the Hub
API still accepts a token signed by it (200).

### 2. Production has no data; the seeded data is in this sandbox

`GET /api/hub/shop/products` on production returns **0 products**. The 12
products and the ticketed events I created went to this sandbox's `wawu_hub_dev`
database via `localhost:3001`, **not** to the droplet.

This does not make the earlier commerce screenshots invalid — they were rendered
by the real app against a real Nest API and a real Postgres, through the real
admin endpoint. But my wording ("the live backend") described the **sandbox**
deployment, not `api.wawuafrica.com`. Production has never been seeded.

Not a defect in the product. A defect in how I reported it.

## Release artifact

**NOT APPLICABLE — no mobile artifact in this family.** All four repos are Node
(Nest/Next); there is no debug/release manifest split, so the
`android.permission.INTERNET` class of defect (LESSONS § II.6) cannot occur
here. Recorded explicitly rather than omitted, because an omitted row reads as
a pass.

The nearest equivalent for this stack — *does the built artifact differ from the
dev one* — **is** covered: the droplet runs `npm run build` and serves
`dist/src/main.js` under systemd, and the live gate above hits that build, not
`next dev` or `nest start --watch`.

## What is NOT proven

- **No end-to-end purchase.** Flutterwave is in test mode; no order has been
  driven through checkout on production.
- **No browser-driven UI gate.** Assertions 1–4 are HTTP-level. A Playwright
  driver logging in through the real UI is not written.
- **The dashboard is not deployed at all**, so its seam is untested.
