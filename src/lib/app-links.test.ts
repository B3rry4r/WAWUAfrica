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
  profileHandleFrom,
  receiptCodeFrom,
  roomSlugFrom,
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

test("a receipt is /receipt/ and one code, never the invite path", () => {
  assert.equal(receiptCodeFrom("/receipt/7K3M9QX2B4TV"), "7K3M9QX2B4TV");
  assert.equal(receiptCodeFrom("/receipt/7k3m-9qx2-b4tv/"), "7k3m-9qx2-b4tv");
  // an invite path is not a receipt, and a receipt path is not an invite
  assert.equal(receiptCodeFrom("/r/7K3M9QX2B4TV"), null);
  assert.equal(inviteCodeFrom("/receipt/7K3M9QX2B4TV"), null);
  for (const path of ["/receipt", "/receipt/", "/receipt//", "/receipt/a/b", "/receipt/a.png", "/receipt/a_b", "/receipt/-a", "/receipt/a-", "/receipt/a--b", "/receipt/a b", "/receipt/" + "a".repeat(65), "/receipts/x", "/x/receipt/a"]) {
    assert.equal(receiptCodeFrom(path), null, path);
  }
  assert.equal(receiptCodeFrom("/receipt/" + "a".repeat(64)), "a".repeat(64));
});

test("a profile is /u/ and one handle: letters, digits, dots and underscores, up to 30", () => {
  assert.equal(profileHandleFrom("/u/ada"), "ada");
  assert.equal(profileHandleFrom("/u/Ada_Obi.2/"), "Ada_Obi.2");
  assert.equal(profileHandleFrom("/u/ada.png"), "ada.png");
  assert.equal(profileHandleFrom("/u/" + "a".repeat(30)), "a".repeat(30));
  for (const path of ["/u", "/u/", "/u//", "/u/a/b", "/u/.", "/u/..", "/u/...", "/u/a b", "/u/a-b", "/u/@ada", "/u/a%20b", "/u/" + "a".repeat(31), "/us/x", "/x/u/ada", "/wawu/ada"]) {
    assert.equal(profileHandleFrom(path), null, path);
  }
});

test("a room is /c/ and one slug: letters and digits in groups joined by single hyphens, up to 64", () => {
  assert.equal(roomSlugFrom("/c/aba-tailors"), "aba-tailors");
  assert.equal(roomSlugFrom("/c/Aba-Tailors-2/"), "Aba-Tailors-2");
  assert.equal(roomSlugFrom("/c/" + "a".repeat(64)), "a".repeat(64));
  for (const path of ["/c", "/c/", "/c//", "/c/a/b", "/c/a.png", "/c/a_b", "/c/-a", "/c/a-", "/c/a--b", "/c/a b", "/c/" + "a".repeat(65), "/cc/x", "/x/c/room", "/communities/x"]) {
    assert.equal(roomSlugFrom(path), null, path);
  }
});

test("the app links are the six paths, nothing wider", () => {
  for (const path of ["/selfie", "/selfie/", "/r/lennox", "/activate", "/activate/", "/receipt/7K3M9QX2B4TV", "/u/ada", "/c/aba-tailors"]) {
    assert.equal(isAppLinkPath(path), true, path);
  }
  for (const path of ["/selfie/x", "/selfies", "/activate/x", "/activated", "/join", "/join/paid", "/reset-password", "/wawu/lennox", "/.well-known/x", "/r", "/receipt", "/u", "/c", "/u/a-b", "/c/a_b"]) {
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
  assert.equal(appAddressFor("/activate"), "wawu://activate");
  assert.equal(appAddressFor("/receipt/7K3M9QX2B4TV"), "wawu://receipt/7K3M9QX2B4TV");
  assert.equal(appAddressFor("/u/ada.obi"), "wawu://u/ada.obi");
  assert.equal(appAddressFor("/c/aba-tailors"), "wawu://c/aba-tailors");
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
    applinks: {
      details: [
        {
          appIDs: [`AB12CD34EF.${APP_ID}`],
          components: [{ "/": "/r/*" }, { "/": "/selfie" }, { "/": "/activate" }, { "/": "/receipt/*" }, { "/": "/u/*" }, { "/": "/c/*" }],
        },
      ],
    },
  });
  assert.deepEqual(APP_LINK_PATTERNS, ["/r/*", "/selfie", "/activate", "/receipt/*", "/u/*", "/c/*"]);
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
