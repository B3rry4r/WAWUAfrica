/**
 * Proves the ticket QR encoder actually scans.
 *
 * src/lib/qr.ts is hand-written rather than a dependency, and a QR code that
 * a door scanner cannot read is somebody who paid being turned away. So every
 * symbol it produces is decoded back with an INDEPENDENT decoder (jsQR, a
 * devDependency — it never ships) and compared to what went in. A bug in the
 * encoder cannot hide behind a bug in the same author's decoder.
 *
 * Run: node scripts/check-qr.mjs
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import jsQR from "jsqr";

const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

/** The exact shape the server mints: four groups of four, hyphen separated. */
function ticketCode(rand) {
  let out = "";
  for (let i = 0; i < 16; i += 1) out += ALPHABET[Math.floor(rand() * ALPHABET.length)];
  return `${out.slice(0, 4)}-${out.slice(4, 8)}-${out.slice(8, 12)}-${out.slice(12, 16)}`;
}

/** Deterministic, so a failure is reproducible from the seed alone. */
function mulberry32(seed) {
  return function next() {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Render a module matrix to RGBA at 4x with the required 4-module quiet zone. */
function rasterise(matrix, scale = 4, quiet = 4) {
  const modules = matrix.length;
  const size = (modules + quiet * 2) * scale;
  const data = new Uint8ClampedArray(size * size * 4).fill(255);
  for (let r = 0; r < modules; r += 1) {
    for (let c = 0; c < modules; c += 1) {
      if (!matrix[r][c]) continue;
      for (let dy = 0; dy < scale; dy += 1) {
        for (let dx = 0; dx < scale; dx += 1) {
          const y = (r + quiet) * scale + dy;
          const x = (c + quiet) * scale + dx;
          const i = (y * size + x) * 4;
          data[i] = 0;
          data[i + 1] = 0;
          data[i + 2] = 0;
        }
      }
    }
  }
  return { data, size };
}

// The encoder is TypeScript; compile just that file to plain ESM to import it.
const dir = mkdtempSync(join(tmpdir(), "wawu-qr-"));
try {
  execFileSync(
    "npx",
    [
      "tsc",
      "src/lib/qr.ts",
      "--target", "es2020",
      "--module", "es2020",
      "--outDir", dir,
      // The encoder imports nothing. Compiling it in isolation must not drag
      // in @types/node, whose own dependencies are not this file's problem.
      "--types",
      "--skipLibCheck",
    ],
    { stdio: "pipe" },
  );
  writeFileSync(join(dir, "package.json"), JSON.stringify({ type: "module" }));
  const { encodeQr } = await import(join(dir, "qr.js"));

  const rand = mulberry32(20260829);
  const CASES = 300;
  let failures = 0;

  for (let i = 0; i < CASES; i += 1) {
    const code = ticketCode(rand);
    let matrix;
    try {
      matrix = encodeQr(code);
    } catch (e) {
      console.error(`  ENCODE FAILED  ${code}: ${e.message}`);
      failures += 1;
      continue;
    }
    const { data, size } = rasterise(matrix);
    const decoded = jsQR(data, size, size);
    if (!decoded) {
      console.error(`  UNREADABLE     ${code} (${matrix.length}x${matrix.length})`);
      failures += 1;
    } else if (decoded.data !== code) {
      console.error(`  MISREAD        wrote ${code}, read ${decoded.data}`);
      failures += 1;
    }
  }

  if (failures > 0) {
    console.error(`\nqr: ${failures} of ${CASES} ticket codes did not survive a round trip.`);
    process.exit(1);
  }
  console.log(`qr: ${CASES} ticket codes encoded and decoded back correctly.`);
} finally {
  rmSync(dir, { recursive: true, force: true });
}
