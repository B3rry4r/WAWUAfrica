/**
 * Tests for the /join plan helpers (JOIN-TIERS-WEB). Run like the referral test
 * (Node 22+, no runner in this repo):
 *
 *   node --experimental-strip-types \
 *     --import 'data:text/javascript,import{register}from"node:module";register("data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){return await n(s+\".ts\",c)}}",import.meta.url);' \
 *     src/lib/join-tiers.test.ts
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { fromKobo, lengthOf, periodOf, pointsOf, startingTier, tierItems } from "./join-tiers";
import type { WaitlistTier, WaitlistTiers } from "./join-tiers";

const verify: WaitlistTier = {
  id: "verify", name: "Verify", priceKobo: 299900, days: 365, products: 4, bonusPoints: 100,
  eventPass: { id: "watch_apply", name: "Watch live, apply" }, badge: { id: "verified", numbered: false }, packBonusPercent: 0, best: false,
};
const founding: WaitlistTier = {
  id: "founding", name: "Founding Maker", priceKobo: 999900, days: 365, products: 15, bonusPoints: 600,
  eventPass: { id: "maker_pass_priority", name: "Maker Pass, priority" }, badge: { id: "founding", numbered: true }, packBonusPercent: 10, best: true,
};

test("a year is 12 months, a month is a month, odd lengths are days", () => {
  assert.equal(lengthOf(365), "12 months");
  assert.equal(lengthOf(30), "30 days");
  assert.equal(lengthOf(1), "1 day");
  assert.equal(periodOf(365), "a year");
  assert.equal(periodOf(30), "a month");
  assert.equal(periodOf(90), "for 3 months");
});

test("points read with commas and the right word", () => {
  assert.equal(pointsOf(1), "1 point");
  assert.equal(pointsOf(1240), "1,240 points");
});

test("Verify lists length, products, points and its pass; nothing it does not give", () => {
  assert.deepEqual(tierItems(verify), ["12 months", "4 products", "100 points", "Watch live, apply"]);
});

test("Founding adds the numbered badge and the pack bonus, in the app's order", () => {
  assert.deepEqual(tierItems(founding), [
    "12 months", "15 products", "600 points", "Maker Pass, priority", "Numbered Founding badge", "10% bonus on points packs",
  ]);
});

test("the page starts on the Hub's best plan, and shows the cheapest as 'from'", () => {
  const all: WaitlistTiers = { currency: "NGN", bestTier: "founding", tiers: [verify, founding] };
  assert.equal(startingTier(all)?.id, "founding");
  assert.equal(startingTier({ ...all, bestTier: null, tiers: [{ ...founding, best: false }, verify] })?.id, "founding");
  assert.equal(fromKobo(all.tiers), 299900);
  assert.equal(fromKobo([]), null);
});
