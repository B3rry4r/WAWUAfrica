# Backend Fix Prompt — 3 Issues Requiring Server-Side Changes

**Date:** 2026-09-10  
**Frontend branch:** `fix/ui-conformance-dev-a`  
**Context:** Frontend fixes for Issues 2/3/4 are done. These 3 issues require backend work.

---

## Issue 1 — Creator Profile Content Not Showing

### Problem
When a user views a creator's profile (`/profile/[wawuId]`), the **Content tab** always shows "Nothing published yet" — even for creators with published content.

The frontend calls `GET /api/hub/users/:wawuId/public-profile`, which returns `contentCount` (a number) but **never the actual content items**. The frontend `CreatorProfile.content` field is hardcoded to `[]` because the backend doesn't provide the list.

**Frontend file:** `src/lib/api/profile.ts:70-74,114`

### What the backend needs

A new endpoint (or extension to the existing public-profile endpoint) that returns a creator's published content items:

```
GET /api/hub/users/:wawuId/content
```

**Query params (optional):**
- `page` (default 1)
- `limit` (default 20, max 50)

**Response shape (paginated):**
```json
{
  "data": [
    {
      "id": "uuid",
      "contentType": "video" | "course" | "audio" | "pdf" | "image" | "template",
      "title": "string",
      "price": 2500,
      "previewAssetUrl": "signed-url",
      "status": "live"
    }
  ],
  "total": 12,
  "page": 1,
  "limit": 20
}
```

**Rules:**
- Only return `status: "live"` items (not pending/rejected)
- `previewAssetUrl` must be a valid signed URL (safe to serve publicly)
- `fullAssetUrl` should NOT be included here (it's server-side gated per 02_TECHNICAL_CONTEXT.md §3.2)
- The content is public — any authenticated user can view it

**Frontend integration:** Once this endpoint exists, `getCreatorProfile()` in `src/lib/api/profile.ts` should call it and populate `content[]` instead of returning `[]`.

---

## Issue 2 — Video Previews Not Playing

### Problem
Content cards show video thumbnails as static images or striped placeholders, even when the creator uploaded a video. The `ContentThumb` component (`src/components/ui/ContentThumb.tsx`) correctly detects video extensions (`.mp4`, `.webm`, `.mov`, `.m4v`) and renders a `<video>` tag, but the preview URL either:
1. Points to an image format (e.g., a poster frame) instead of the video file
2. Is served with a wrong `Content-Type` header
3. Has a signed URL that expired before the client could fetch it

**Frontend file:** `src/components/ui/ContentThumb.tsx:48-49`

### What the backend needs

1. **Ensure `previewAssetUrl` for video content points to the actual video file**, not a still frame or thumbnail image. The URL extension must match a video format the browser can play (`.mp4` is safest for broad compatibility).

2. **Set correct `Content-Type` headers** on the signed URL response:
   - `.mp4` → `video/mp4`
   - `.webm` → `video/webm`
   - `.mov` → `video/quicktime`

3. **Ensure signed URL TTL is long enough** for the client to initiate playback (minimum 10 minutes recommended). The `ContentThumb` component uses `preload="metadata"`, which only fetches the first frame — but the browser still needs a valid URL at fetch time.

**Optional improvement:** If the backend can provide a separate `previewThumbnailUrl` (image) alongside the video `previewAssetUrl`, the frontend can show the image first and swap to video on hover/tap — better UX than relying on `preload="metadata"`.

---

## Issue 3 — No Delete Post Option for Creators

### Problem
Creators have no way to remove/delete content they've published. The `ContentLibrary` component (`src/components/create/ContentLibrary.tsx`) only offers:
- **Resubmit** for rejected items (sends them back to the review wizard)
- No action for live or in-review items

There is no delete button, no confirmation dialog, and no backend endpoint to call.

**Frontend files:**
- `src/components/create/ContentLibrary.tsx` (no delete UI)
- `src/components/ui/ContentCard.tsx` (`CreatorUploadCard` — no delete prop)

### What the backend needs

```
DELETE /api/hub/content/:id
```

**Auth:** Creator-only (the caller must be the content's owner). `WawuAuthGuard` + owner check.

**Behavior:**
- Soft-delete or hard-delete (your choice — but if soft-delete, the item must disappear from the creator's library and from public profile immediately)
- If the content has purchases, handle according to your refund/retention policy (the spec doesn't mandate a specific behavior here)
- Return `204 No Content` on success
- Return `403` if not the owner
- Return `404` if content doesn't exist

**Frontend integration:** Once this endpoint exists, the `ContentLibrary` and `CreatorUploadCard` components need:
1. A delete button (trash icon) on each card
2. A confirmation dialog ("Delete this piece? This cannot be undone.")
3. An `onDelete` callback that calls `DELETE /api/hub/content/:id` and removes the item from the local list
4. The `contentApi` module (`src/lib/api/creator-content.ts`) needs a `delete(id: string)` method

---

## Summary

| Issue | Endpoint needed | Priority |
|---|---|---|
| Creator profile content | `GET /api/hub/users/:wawuId/content` | High — content tab is completely empty |
| Video previews | Fix `previewAssetUrl` / headers on existing endpoint | Medium — affects first impression |
| Delete content | `DELETE /api/hub/content/:id` | High — creators can't manage their library |

All three are independent and can be developed in parallel.
