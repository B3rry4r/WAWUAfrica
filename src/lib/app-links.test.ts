/**
 * Tests for the app links (LINKS-01): which paths are app links, what the two
 * /.well-known files say, and that a missing signing value names no app.
 * Run like the other tests here (Node 22+, no runner in this repo):
 *
 *   node --experimental-strip-types \
 *     --import 'data:text/javascript,import{register}from"node:module";register("data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){return await n(s+\".ts\",c)}}",import.meta.url);' \
 *     src/lib/app-links.test.ts
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  APP_ID,
  APP_LINK_PATTERNS,
  appAddressFor,
  appleAppSiteAssociation,
  appleTeamIdFrom,
  assetLinks,
  fingerprintsFrom,
  inviteCodeFrom,
  isAppLinkFile,
  isAppLinkPath,
} from "./app-links";

const PRINT = Array.from({ length: 32 }, (_, i) => (i * 7 + 3).toString(16).padStart(2, "0").toUpperCase()).join(":");

test("an invite is /r/ and one code of letters, digits, dash and underscore", () => {
  assert.equal(inviteCodeFrom("/r/lennox"), "lennox");
  assert.equal(inviteCodeFrom("/r/LOGO-ART_2/"), "LOGO-ART_2");
  assert.equal(inviteCodeFrom("/r/a".padEnd(3 + 80, "a")), "a".repeat(80));
});

test("anything else is not an invite", () => {
  for (const path of ["/r", "/r/", "/r//", "/r/a/b", "/r/a.png", "/r/a b", "/r/%2e", "/rr/x", "/x/r/a", "/R/a", "/r/" + "a".repeat(81), "/join", "/"]) {
    assert.equal(inviteCodeFrom(path), null, path);
  }
});

test("the app links are /r/<code> and /selfie, nothing wider", () => {
  assert.equal(isAppLinkPath("/selfie"), true);
  assert.equal(isAppLinkPath("/selfie/"), true);
  assert.equal(isAppLinkPath("/r/lennox"), true);
  for (const path of ["/selfie/x", "/selfies", "/join", "/join/paid", "/reset-password", "/wawu/lennox", "/.well-known/x", "/r"]) {
    assert.equal(isAppLinkPath(path), false, path);
  }
});

test("the two files phones read are the only /.well-known paths", () => {
  assert.equal(isAppLinkFile("/.well-known/apple-app-site-association"), true);
  assert.equal(isAppLinkFile("/.well-known/assetlinks.json"), true);
  for (const path of ["/.well-known", "/.well-known/", "/.well-known/security.txt", "/.well-known/assetlinks.json.map", "/.well-known/apple-app-site-association/x"]) {
    assert.equal(isAppLinkFile(path), false, path);
  }
});

test("the button opens the app's own address", () => {
  assert.equal(appAddressFor("/r/lennox"), "wawu://r/lennox");
  assert.equal(appAddressFor("/selfie"), "wawu://selfie");
});

test("an Apple team id is exactly 10 capitals or digits", () => {
  assert.equal(appleTeamIdFrom(" AB12CD34EF "), "AB12CD34EF");
  for (const bad of [undefined, "", "ab12cd34ef", "AB12CD34E", "AB12CD34EFG", "AB12-D34EF"]) assert.equal(appleTeamIdFrom(bad), null, String(bad));
});

test("fingerprints are 32 colon separated bytes; others are left out; repeats are dropped", () => {
  assert.deepEqual(fingerprintsFrom(`${PRINT}, ${PRINT.toLowerCase()} ,nonsense,AA:BB`), [PRINT]);
  assert.deepEqual(fingerprintsFrom(undefined), []);
});

test("iOS is given the app paths and only those, once a team id is set", () => {
  const file = appleAppSiteAssociation({ APPLE_TEAM_ID: "AB12CD34EF" });
  assert.deepEqual(file, {
    applinks: { details: [{ appIDs: [`AB12CD34EF.${APP_ID}`], components: [{ "/": "/r/*" }, { "/": "/selfie" }] }] },
  });
  assert.deepEqual(APP_LINK_PATTERNS, ["/r/*", "/selfie"]);
});

test("with no team id the iOS file names no app", () => {
  assert.deepEqual(appleAppSiteAssociation({}), { applinks: { details: [] } });
  assert.deepEqual(appleAppSiteAssociation({ APPLE_TEAM_ID: "short" }), { applinks: { details: [] } });
});

test("Android is given the app and its fingerprints; with none it names no app", () => {
  assert.deepEqual(assetLinks({ ANDROID_SHA256_CERT_FINGERPRINTS: PRINT }), [
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: { namespace: "android_app", package_name: APP_ID, sha256_cert_fingerprints: [PRINT] },
    },
  ]);
  assert.deepEqual(assetLinks({}), []);
  assert.deepEqual(assetLinks({ ANDROID_SHA256_CERT_FINGERPRINTS: "nonsense" }), []);
});
