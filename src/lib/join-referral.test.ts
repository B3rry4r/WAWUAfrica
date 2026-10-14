/**
 * Tests for the /join referral code helpers (REF-01). Run like the taxonomy
 * test (Node 22+, no runner in this repo):
 *
 *   node --experimental-strip-types \
 *     --import 'data:text/javascript,import{register}from"node:module";register("data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){return await n(s+\".ts\",c)}}",import.meta.url);' \
 *     src/lib/join-referral.test.ts
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  cleanReferral,
  isNoPayment,
  looksLikeReferral,
  payKoboFor,
  referralFromSearch,
  storeReferral,
  storedReferral,
} from "./join-referral";

test("cleanReferral upper-cases, drops anything that is not a letter or a digit, and stops at 20", () => {
  assert.equal(cleanReferral(" logo-art "), "LOGOART");
  assert.equal(cleanReferral("a".repeat(30)), "A".repeat(20));
  assert.equal(cleanReferral("--"), "");
});

test("looksLikeReferral is the 3 to 20 letters and digits the server takes", () => {
  assert.equal(looksLikeReferral("AB"), false);
  assert.equal(looksLikeReferral("ABC"), true);
  assert.equal(looksLikeReferral("A".repeat(20)), true);
  assert.equal(looksLikeReferral("A".repeat(21)), false);
  assert.equal(looksLikeReferral("AB CD"), false);
});

test("referralFromSearch reads ?ref=CODE in any case, and nothing else", () => {
  assert.equal(referralFromSearch("?ref=logoart"), "LOGOART");
  assert.equal(referralFromSearch("?utm=x&ref=Law%20School"), "LAWSCHOOL");
  assert.equal(referralFromSearch("?ref="), null);
  assert.equal(referralFromSearch("?other=1"), null);
  assert.equal(referralFromSearch(""), null);
});

test("storage that throws or is missing never breaks the page", () => {
  // No window in Node: both helpers must swallow the error.
  assert.equal(storedReferral(), null);
  assert.doesNotThrow(() => storeReferral("LOGOART"));
  assert.doesNotThrow(() => storeReferral(null));
});

test("the price is the code's only when the code applies; otherwise the offer's", () => {
  assert.equal(payKoboFor(200000, { kind: "applies", code: "X", priceKobo: 120000 }), 120000);
  assert.equal(payKoboFor(200000, { kind: "notApplied", code: "X", reason: "full", priceKobo: 200000 }), 200000);
  assert.equal(payKoboFor(200000, { kind: "unknown", code: "X", message: "m" }), 200000);
  assert.equal(payKoboFor(200000, { kind: "checking", code: "X" }), 200000);
  assert.equal(payKoboFor(200000, { kind: "none" }), 200000);
});

test("no payment only for a code that applies at 0", () => {
  assert.equal(isNoPayment(200000, { kind: "applies", code: "X", priceKobo: 0 }), true);
  assert.equal(isNoPayment(200000, { kind: "applies", code: "X", priceKobo: 1 }), false);
  assert.equal(isNoPayment(200000, { kind: "notApplied", code: "X", reason: "inactive", priceKobo: 200000 }), false);
  assert.equal(isNoPayment(0, { kind: "none" }), false);
});
