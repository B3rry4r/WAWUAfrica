/**
 * Tests for the join-only upload flow's rules (WEB-UPLOAD, R-126). Run like the other tests in this repo
 * (Node 22+, no runner):
 *
 *   node --no-warnings --experimental-strip-types \
 *     --import 'data:text/javascript,import{register}from"node:module";register("data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){return await n(s+\".ts\",c)}}",import.meta.url);' \
 *     src/lib/site-upload/rules.test.ts
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  COVER_MAX_BYTES,
  NO_TIER_SENTENCE,
  NOT_ON_LIST_SENTENCE,
  PLACES_FULL_SENTENCE,
  SITE_CLIENT_HEADER,
  SITE_CLIENT_VALUE,
  SITE_KINDS,
  WAITING_WALLET_TEXT,
  accessState,
  cleanPriceList,
  landingAfterSignIn,
  nairaText,
  pieceState,
  placesLine,
  refusalSentence,
  sizeText,
} from "./rules";

test("the marker is the one the Hub reads", () => {
  assert.equal(SITE_CLIENT_HEADER, "X-Wawu-Client");
  assert.equal(SITE_CLIENT_VALUE, "site");
});

test("no course, and the four kinds the Hub can take from the web", () => {
  assert.deepEqual([...SITE_KINDS], ["video", "audio", "pdf", "image"]);
});

test("a cover is at most 5 MB", () => {
  assert.equal(COVER_MAX_BYTES, 5 * 1024 * 1024);
});

test("the Hub's refusals are said in plain sentences", () => {
  assert.equal(refusalSentence("tier_required"), NO_TIER_SENTENCE);
  assert.equal(refusalSentence("product_limit_reached"), PLACES_FULL_SENTENCE);
  assert.equal(refusalSentence("price_not_on_list"), NOT_ON_LIST_SENTENCE);
  assert.equal(refusalSentence("something_else"), null);
  assert.equal(refusalSentence(undefined), null);
});

test("the no-tier sentence is the lead's and names /join", () => {
  assert.equal(
    NO_TIER_SENTENCE,
    "Your upload places come with a tier. Get one at wawuafrica.com/join, or sign in with the email or phone you paid with.",
  );
});

test("no sentence a person reads has an em-dash or a raw code", () => {
  for (const s of [NO_TIER_SENTENCE, PLACES_FULL_SENTENCE, NOT_ON_LIST_SENTENCE, WAITING_WALLET_TEXT]) {
    assert.ok(!s.includes("—"), s);
    assert.ok(!/tier_required|product_limit_reached|price_not_on_list/.test(s), s);
  }
});

test("access follows the places the Hub reports", () => {
  assert.equal(accessState({ total: 0, used: 0 }), "no-tier");
  assert.equal(accessState({ total: 4, used: 0 }), "ok");
  assert.equal(accessState({ total: 4, used: 3 }), "ok");
  assert.equal(accessState({ total: 4, used: 4 }), "full");
  assert.equal(accessState({ total: 15, used: 5 }), "ok");
  assert.equal(accessState({ total: 25, used: 25 }), "full");
  assert.equal(placesLine({ total: 4, used: 1 }), "1 of 4 places used");
});

test("the price list is whole naira, sorted, once each", () => {
  assert.deepEqual(cleanPriceList([500, 100, 100, 1000, -5, 0, 2.5, "7", null]), [100, 500, 1000]);
  assert.deepEqual(cleanPriceList(undefined), []);
  assert.equal(nairaText(1000000), "₦1,000,000");
  assert.equal(nairaText(100), "₦100");
});

test("a piece's state in words", () => {
  assert.deepEqual(pieceState({ status: "pending", waitingFor: null }), { key: "review", label: "In review", detail: null });
  assert.deepEqual(pieceState({ status: "live" }), { key: "live", label: "Live", detail: null });
  assert.deepEqual(pieceState({ status: "rejected", rejectionReason: "The audio is cut off." }), {
    key: "rejected",
    label: "Not approved: The audio is cut off.",
    detail: null,
  });
  assert.equal(pieceState({ status: "rejected", rejectionReason: null }).label, "Not approved");
  const held = pieceState({ status: "pending", waitingFor: "wallet" });
  assert.equal(held.key, "waiting-wallet");
  assert.equal(held.detail, "Approved. It goes live when you open your wallet in the WAWU app.");
});

test("sizes are written short", () => {
  assert.equal(sizeText(512), "512 B");
  assert.equal(sizeText(2048), "2 KB");
  assert.equal(sizeText(5 * 1024 * 1024), "5.0 MB");
  assert.equal(sizeText(1024 ** 3), "1.0 GB");
});

test("sign-in lands on an upload page, never on a closed one", () => {
  assert.equal(landingAfterSignIn(null), "/create/library");
  assert.equal(landingAfterSignIn("/create/new"), "/create/new");
  assert.equal(landingAfterSignIn("/create/library"), "/create/library");
  assert.equal(landingAfterSignIn("/home"), "/create/library");
  assert.equal(landingAfterSignIn("https://evil.example"), "/create/library");
  assert.equal(landingAfterSignIn("//evil.example"), "/create/library");
});
