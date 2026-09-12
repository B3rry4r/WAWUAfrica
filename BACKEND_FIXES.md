# Backend fixes required by frontend bugs

This is the backend side of the 7-bug frontend pass (`fix/profile-explore-ui-fixes`).
The backend repo (WAWU-Hub-API) is not available in this workspace, so nothing
here is code — it is the exact contract the frontend now expects, written so the
backend can be changed to match without another frontend round-trip.

Contract target: `docs/02_TECHNICAL_CONTEXT.md`. Every item below is either a
missing endpoint, a DTO limit that rejects the backend's own output, or a
persistence gap surfaced by adding mock mode.

---

## 1. Comment like — endpoint absent (Bug 1)

The content-comment heart was a decorative `<span>` with no handler. It is now a
real toggle and calls a like endpoint that does not exist yet. The frontend will
keep calling it regardless (see `src/lib/api/content.ts` `setCommentLiked`), so
the moment this ships the button starts working with zero frontend change.

**Current state:** `POST /api/hub/content/:id/comments` (create) and the list
read both exist; there is no like/unlike route.

**Required:**
```
POST   /api/hub/content/:id/comments/:commentId/like
DELETE /api/hub/content/:id/comments/:commentId/like
```

- Both authed (the caller's own like state is meaningless anonymous).
- `POST` is idempotent (already-liked → no-op, same payload), `DELETE` likewise
  (not-liked → no-op). No atomic toggle route — the client sends the exact
  method for the exact transition it wants.
- Response: `{ likes: number, likedByMe: true | false }` — likedByMe is
  redundant on the response but the client treats the resolved count as truth
  for rollback, so it must be the server's authoritative post-call figure.
- Crawl target: a `CommentLike`-style table keyed on the existing comment id and
  `authorWawuId`, mirroring the account-level like on content pieces.

**Also on list reads:** `GET /api/hub/content/:id/comments` should return
`likedByMe` per comment when the requester is authed (null/false for anonymous).
The client maps this into its `ContentComment` wire shape today (defaults false
when absent), so missing it only means hearts can't re-render correctly after
reload in authed sessions.

## 2. Community image — DTO rejects the backend's own presign URL (Bug 2)

`CreateCommunity` uploads through the standard presign flow
(`src/lib/api/uploads.ts`, folder `community/image`), then sends the returned
signed `fileUrl` as `imageUrl` on `POST /api/hub/communities`:

```json
{ "name": "...", "description": "...", "kind": "open|private", "imageUrl": "<presigned url>" }
```

The backend's own presigned `fileUrl` exceeds the `@MaxLength(500)` on that DTO
field (presigned GET URLs carry the bucket, region, path and the full signed
query), so **any community created with a picture 400s on the backend's own
output**. Frontend masks are out — the fix must be real.

**Pick one:**

1. **Raise the limit** to at least 2048 on `imageUrl` in the create-community DTO
   (and any community-update DTO that carries it), or
2. **Return the short storage key/path** from presign and have the server rebuild
   the full CDN URL on read (like content assets do), keeping `@MaxLength(500)`
   for a *key* that is genuinely short.

Option 2 is the durable one — it stops the same signed-URL overflow from
recurring on feedback/patch endpoints later.

## 3. Follow relationship — read endpoint unverifiable (Bug 3)

Persisting follows across reload exposed that the frontend cannot prove the real
read exists. Two files disagree:

- `src/lib/api/mocks/profile.ts`: "follow-relationship.controller.ts only exposes
  the two write endpoints, no GET" — `setMockProfileFollowing` exists as the sync
  point *because there is no real GET to re-check against*.
- `src/lib/api/profile.ts` `isFollowing`: calls `GET /api/hub/creators/:wawuId/follow`
  as the primary real read.

**Verify which is true.** Whichever wins, the contract should be:

```
GET /api/hub/creators/:wawuId/follow   → { following: boolean }   (authed)
POST   /api/hub/creators/:wawuId/follow                          (authed)
DELETE /api/hub/creators/:wawuId/follow                          (authed)
```

- If the GET exists, delete the "no GET" comment in `mocks/profile.ts` and the
  misleading `setMockProfileFollowing` fallback narrative; the frontend keeps
  falling back to local state only in no-backend mock mode.
- If it does not exist, add it — `FollowButton` now self-corrects on mount via
  `isFollowing()` (and the home-rail/search call sites that used to hardcode
  `initial={false}` rely on that GET exactly like the profile page does).

## 4. DM settings — mock persistence only, no backend gap (informational)

`DM price saved state` (Bug 7) was a pure frontend bug (the "Saved" label
self-reverted after 2 seconds; `save()` never needed to persist for it to be a
lie). Real-mode persistence already works through
`PATCH /api/hub/creator/dm-settings` + `reloadCreatorState()`.

The mock store's `updateDmSettings` is a no-op, so mock mode cannot demonstrate
cross-reload persistence. Not a backend issue — noted so nobody re-files it.

---

## Verified working (no backend change needed)

- Profile picture / name sync in headers after profile save (Bug 5): frontend-only
  (session patch via `updateUser`, mock store update in `verification.ts`).
- Earnings calculator overflow (Bug 6): frontend-only (compact-naira formatting).
- Earnings calculator numbers: max input 50,000 followers × ₦20,000 × 90% × 12
  months = ₦10.8B/year — a billion branch reaches it; no trillion branch needed.