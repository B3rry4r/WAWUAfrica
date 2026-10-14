/**
 * Tests for reading the admin role from the Hub's admin token (REF-01 round 2).
 * Run like the other web tests (Node 22+, no runner in this repo):
 *
 *   node --experimental-strip-types \
 *     --import 'data:text/javascript,import{register}from"node:module";register("data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){return await n(s+\".ts\",c)}}",import.meta.url);' \
 *     src/lib/admin-role.test.ts
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { adminRoleFromToken, canChangeReferralCodes } from "./admin-role";

function token(claims: Record<string, unknown>): string {
  const part = (o: unknown) => Buffer.from(JSON.stringify(o)).toString("base64url");
  return `${part({ alg: "HS256", typ: "JWT" })}.${part(claims)}.signature`;
}

test("reads the role claim of an admin token", () => {
  for (const role of ["superadmin", "finance", "support", "reviewer"]) {
    assert.equal(adminRoleFromToken(token({ email: "a@example.test", role, typ: "admin_access" })), role);
  }
});

test("reads a claim that holds non-ASCII text", () => {
  assert.equal(adminRoleFromToken(token({ email: "adaé@example.test", role: "support" })), "support");
});

test("no token, a malformed token or a missing role gives null", () => {
  assert.equal(adminRoleFromToken(null), null);
  assert.equal(adminRoleFromToken(""), null);
  assert.equal(adminRoleFromToken("abc"), null);
  assert.equal(adminRoleFromToken("a.%%%.c"), null);
  assert.equal(adminRoleFromToken(token({ email: "a@example.test" })), null);
  assert.equal(adminRoleFromToken(token({ role: 7 })), null);
  assert.equal(adminRoleFromToken(token({ role: "" })), null);
});

test("only a superadmin changes referral codes", () => {
  assert.equal(canChangeReferralCodes("superadmin"), true);
  for (const role of ["finance", "support", "reviewer", "", "SUPERADMIN"]) {
    assert.equal(canChangeReferralCodes(role), false);
  }
  assert.equal(canChangeReferralCodes(null), false);
});
