/**
 * A QR encoder, for one job: a ticket code at a door.
 *
 * ── WHY THIS IS HERE AND NOT A DEPENDENCY ──────────────────────────────────
 * The payload is always a ticket code — 19 characters from a fixed alphabet
 * with three hyphens, e.g. `A7K2-9QMF-3XPT-R5WD`. Every character of that is
 * in QR's ALPHANUMERIC mode, which packs two characters into 11 bits, so the
 * whole thing fits a version-2 symbol with error correction to spare. The
 * general-purpose encoders solve a much larger problem (kanji, byte mode,
 * structured append, PNG rasterising) and this repo runs on four runtime
 * dependencies. A scanned ticket is money, so the encoder is verified rather
 * than trusted: `scripts/check-qr.mjs` generates codes and decodes them back
 * with an independent decoder.
 *
 * ── ERROR CORRECTION LEVEL Q, DELIBERATELY ─────────────────────────────────
 * Level L would fit a smaller symbol. This code gets scanned off a cracked
 * phone screen, in a queue, under a stadium light, and Q recovers ~25% damage
 * against L's ~7%. The symbol is a few modules larger; the failure it avoids
 * is a person who paid being turned away.
 *
 * Implements ISO/IEC 18004 for the subset it needs: alphanumeric mode,
 * versions 1–4, EC level Q, all eight masks scored by the standard's penalty
 * rules.
 */

/** QR's alphanumeric charset, in its defined order. Index IS the value. */
const ALPHANUM = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:";

/** Data codewords available at EC level Q, by version (1-indexed). */
const DATA_CODEWORDS_Q = [0, 13, 22, 34, 48];
/** EC codewords per block at level Q, by version. */
const EC_CODEWORDS_Q = [0, 13, 22, 18, 26];
/** Number of EC blocks at level Q, by version. */
const EC_BLOCKS_Q = [0, 1, 1, 2, 2];

/** Alignment pattern centres, by version. Version 1 has none. */
const ALIGNMENT_CENTRES: number[][] = [[], [], [6, 18], [6, 22], [6, 26]];

/**
 * Format information for EC level Q and one mask: 15 bits of BCH(15,5).
 *
 * COMPUTED, not tabulated. The published table was in here as literals and it
 * was wrong — 267 of 300 generated codes failed to decode, and a transposed
 * coordinate elsewhere hid inside the same symptom. Deriving it is eight
 * lines and cannot be mistyped.
 *
 * Level Q is `0b11`; the low three bits are the mask; the result is XORed
 * with 0x5412 so an all-zero format still has non-zero modules.
 */
function formatBitsQ(mask: number): number {
  const data = (0b11 << 3) | mask;
  let remainder = data;
  for (let i = 0; i < 10; i += 1) {
    remainder = (remainder << 1) ^ ((remainder >>> 9) * 0x537);
  }
  return ((data << 10) | remainder) ^ 0x5412;
}

/* ------------------------------------------------------------------ *
 * GF(256) arithmetic for Reed-Solomon
 * ------------------------------------------------------------------ */

const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);
(() => {
  let x = 1;
  for (let i = 0; i < 255; i += 1) {
    EXP[i] = x;
    LOG[x] = i;
    x <<= 1;
    // The QR field polynomial, x^8 + x^4 + x^3 + x^2 + 1.
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i += 1) EXP[i] = EXP[i - 255];
})();

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return EXP[LOG[a] + LOG[b]];
}

/** The generator polynomial for `degree` error-correction codewords. */
function generatorPoly(degree: number): number[] {
  let poly = [1];
  for (let i = 0; i < degree; i += 1) {
    const next = new Array<number>(poly.length + 1).fill(0);
    for (let j = 0; j < poly.length; j += 1) {
      next[j] ^= gfMul(poly[j], 1);
      next[j + 1] ^= gfMul(poly[j], EXP[i]);
    }
    poly = next;
  }
  return poly;
}

function reedSolomon(data: number[], ecCount: number): number[] {
  const gen = generatorPoly(ecCount);
  const remainder = new Array<number>(ecCount).fill(0);
  for (const byte of data) {
    const factor = byte ^ remainder[0];
    remainder.shift();
    remainder.push(0);
    for (let i = 0; i < ecCount; i += 1) {
      remainder[i] ^= gfMul(gen[i + 1], factor);
    }
  }
  return remainder;
}

/* ------------------------------------------------------------------ *
 * Bit assembly
 * ------------------------------------------------------------------ */

class BitBuffer {
  private bits: number[] = [];

  put(value: number, length: number): void {
    for (let i = length - 1; i >= 0; i -= 1) {
      this.bits.push((value >>> i) & 1);
    }
  }

  get length(): number {
    return this.bits.length;
  }

  toBytes(): number[] {
    const bytes: number[] = [];
    for (let i = 0; i < this.bits.length; i += 8) {
      let byte = 0;
      for (let j = 0; j < 8; j += 1) byte = (byte << 1) | (this.bits[i + j] ?? 0);
      bytes.push(byte);
    }
    return bytes;
  }
}

/** True when every character is encodable in alphanumeric mode. */
export function isAlphanumeric(text: string): boolean {
  for (const ch of text) if (!ALPHANUM.includes(ch)) return false;
  return true;
}

/** The smallest version 1–4 whose level-Q capacity holds this text. */
function pickVersion(text: string): number {
  for (let v = 1; v <= 4; v += 1) {
    const countBits = v <= 9 ? 9 : 11;
    const dataBits = 4 + countBits + Math.floor(text.length / 2) * 11 + (text.length % 2) * 6;
    if (dataBits <= DATA_CODEWORDS_Q[v] * 8) return v;
  }
  throw new Error(`QR: ${text.length} alphanumeric characters exceed version 4 at EC level Q`);
}

/* ------------------------------------------------------------------ *
 * The symbol
 * ------------------------------------------------------------------ */

type Grid = Array<Array<boolean | null>>;

function placeFinder(grid: Grid, reserved: boolean[][], row: number, col: number): void {
  for (let r = -1; r <= 7; r += 1) {
    for (let c = -1; c <= 7; c += 1) {
      const rr = row + r;
      const cc = col + c;
      if (rr < 0 || cc < 0 || rr >= grid.length || cc >= grid.length) continue;
      const inRing = (r >= 0 && r <= 6 && (c === 0 || c === 6)) || (c >= 0 && c <= 6 && (r === 0 || r === 6));
      const inCore = r >= 2 && r <= 4 && c >= 2 && c <= 4;
      grid[rr][cc] = inRing || inCore;
      reserved[rr][cc] = true;
    }
  }
}

function buildSymbol(text: string, version: number): boolean[][] {
  const size = version * 4 + 17;
  const grid: Grid = Array.from({ length: size }, () => new Array<boolean | null>(size).fill(null));
  const reserved: boolean[][] = Array.from({ length: size }, () => new Array<boolean>(size).fill(false));

  placeFinder(grid, reserved, 0, 0);
  placeFinder(grid, reserved, 0, size - 7);
  placeFinder(grid, reserved, size - 7, 0);

  // Timing patterns.
  for (let i = 8; i < size - 8; i += 1) {
    grid[6][i] = i % 2 === 0;
    grid[i][6] = i % 2 === 0;
    reserved[6][i] = true;
    reserved[i][6] = true;
  }

  // Alignment patterns, skipping the three that would sit on a finder.
  const centres = ALIGNMENT_CENTRES[version];
  for (const r of centres) {
    for (const c of centres) {
      const onFinder =
        (r <= 8 && c <= 8) || (r <= 8 && c >= size - 9) || (r >= size - 9 && c <= 8);
      if (onFinder) continue;
      for (let dr = -2; dr <= 2; dr += 1) {
        for (let dc = -2; dc <= 2; dc += 1) {
          grid[r + dr][c + dc] = Math.max(Math.abs(dr), Math.abs(dc)) !== 1;
          reserved[r + dr][c + dc] = true;
        }
      }
    }
  }

  // The dark module, which is always set and never masked.
  grid[size - 8][8] = true;
  reserved[size - 8][8] = true;

  // Reserve the format-information areas before any data is laid down.
  for (let i = 0; i <= 8; i += 1) {
    if (!reserved[8][i]) reserved[8][i] = true;
    if (!reserved[i][8]) reserved[i][8] = true;
  }
  for (let i = 0; i < 8; i += 1) {
    reserved[8][size - 1 - i] = true;
    reserved[size - 1 - i][8] = true;
  }

  /* ---- data ---- */
  const buffer = new BitBuffer();
  buffer.put(0b0010, 4); // alphanumeric mode
  buffer.put(text.length, version <= 9 ? 9 : 11);
  for (let i = 0; i + 1 < text.length; i += 2) {
    buffer.put(ALPHANUM.indexOf(text[i]) * 45 + ALPHANUM.indexOf(text[i + 1]), 11);
  }
  if (text.length % 2 === 1) buffer.put(ALPHANUM.indexOf(text[text.length - 1]), 6);

  const capacityBits = DATA_CODEWORDS_Q[version] * 8;
  // Terminator, up to four zero bits, then pad to a byte boundary.
  buffer.put(0, Math.min(4, capacityBits - buffer.length));
  if (buffer.length % 8 !== 0) buffer.put(0, 8 - (buffer.length % 8));

  const data = buffer.toBytes();
  // The standard's alternating pad bytes, until the block is full.
  const padBytes = [0xec, 0x11];
  for (let i = 0; data.length < DATA_CODEWORDS_Q[version]; i += 1) {
    data.push(padBytes[i % 2]);
  }

  /* ---- error correction, interleaved by block ---- */
  const blockCount = EC_BLOCKS_Q[version];
  const ecPerBlock = EC_CODEWORDS_Q[version];
  const shortLength = Math.floor(data.length / blockCount);
  const longBlocks = data.length % blockCount;

  const dataBlocks: number[][] = [];
  const ecBlocks: number[][] = [];
  let offset = 0;
  for (let b = 0; b < blockCount; b += 1) {
    const length = shortLength + (b >= blockCount - longBlocks ? 1 : 0);
    const block = data.slice(offset, offset + length);
    offset += length;
    dataBlocks.push(block);
    ecBlocks.push(reedSolomon(block, ecPerBlock));
  }

  const codewords: number[] = [];
  const maxData = Math.max(...dataBlocks.map((b) => b.length));
  for (let i = 0; i < maxData; i += 1) {
    for (const block of dataBlocks) if (i < block.length) codewords.push(block[i]);
  }
  for (let i = 0; i < ecPerBlock; i += 1) {
    for (const block of ecBlocks) codewords.push(block[i]);
  }

  /* ---- lay the codewords into the symbol, upwards in two-module columns ---- */
  let bitIndex = 0;
  let upward = true;
  for (let col = size - 1; col > 0; col -= 2) {
    if (col === 6) col -= 1; // skip the vertical timing column
    for (let step = 0; step < size; step += 1) {
      const row = upward ? size - 1 - step : step;
      for (let c = 0; c < 2; c += 1) {
        const cc = col - c;
        if (reserved[row][cc]) continue;
        const byte = codewords[bitIndex >>> 3];
        const bit = byte === undefined ? 0 : (byte >>> (7 - (bitIndex & 7))) & 1;
        grid[row][cc] = bit === 1;
        bitIndex += 1;
      }
    }
    upward = !upward;
  }

  /* ---- try every mask, keep the least penalised ---- */
  let best: boolean[][] | null = null;
  let bestPenalty = Infinity;
  for (let mask = 0; mask < 8; mask += 1) {
    const candidate = applyMask(grid, reserved, mask, size);
    writeFormat(candidate, mask, size);
    const penalty = scorePenalty(candidate, size);
    if (penalty < bestPenalty) {
      bestPenalty = penalty;
      best = candidate;
    }
  }
  return best as boolean[][];
}

function maskAt(mask: number, row: number, col: number): boolean {
  switch (mask) {
    case 0: return (row + col) % 2 === 0;
    case 1: return row % 2 === 0;
    case 2: return col % 3 === 0;
    case 3: return (row + col) % 3 === 0;
    case 4: return (Math.floor(row / 2) + Math.floor(col / 3)) % 2 === 0;
    case 5: return ((row * col) % 2) + ((row * col) % 3) === 0;
    case 6: return (((row * col) % 2) + ((row * col) % 3)) % 2 === 0;
    default: return (((row + col) % 2) + ((row * col) % 3)) % 2 === 0;
  }
}

function applyMask(grid: Grid, reserved: boolean[][], mask: number, size: number): boolean[][] {
  const out: boolean[][] = Array.from({ length: size }, () => new Array<boolean>(size).fill(false));
  for (let r = 0; r < size; r += 1) {
    for (let c = 0; c < size; c += 1) {
      const value = grid[r][c] === true;
      out[r][c] = reserved[r][c] ? value : value !== maskAt(mask, r, c);
    }
  }
  return out;
}

/**
 * The two copies of the format information.
 *
 * Indices here are [row][column], and the two copies do NOT run in the same
 * direction — the first is a bent line down column 8 and along row 8 around
 * the top-left finder, the second is split between the other two finders.
 * Getting a row and a column the wrong way round produces a symbol that looks
 * perfectly plausible and decodes in no reader at all, which is exactly what
 * scripts/check-qr.mjs caught.
 */
function writeFormat(grid: boolean[][], mask: number, size: number): void {
  const bits = formatBitsQ(mask);
  for (let i = 0; i < 15; i += 1) {
    const on = ((bits >>> i) & 1) === 1;

    // First copy: down column 8, then left along row 8.
    if (i < 6) grid[i][8] = on;
    else if (i === 6) grid[7][8] = on;
    else if (i === 7) grid[8][8] = on;
    else if (i === 8) grid[8][7] = on;
    else grid[8][14 - i] = on;

    // Second copy: along row 8 from the right, then up column 8 from the bottom.
    if (i < 8) grid[8][size - 1 - i] = on;
    else grid[size - 15 + i][8] = on;
  }
  grid[size - 8][8] = true; // the dark module, restated after the format write
}

/** The standard's four penalty rules. Lower is more reliably scanned. */
function scorePenalty(grid: boolean[][], size: number): number {
  let penalty = 0;

  // Rule 1: runs of five or more identical modules in a row or column.
  for (let i = 0; i < size; i += 1) {
    for (const horizontal of [true, false]) {
      let run = 1;
      for (let j = 1; j < size; j += 1) {
        const prev = horizontal ? grid[i][j - 1] : grid[j - 1][i];
        const curr = horizontal ? grid[i][j] : grid[j][i];
        if (curr === prev) {
          run += 1;
          if (run === 5) penalty += 3;
          else if (run > 5) penalty += 1;
        } else run = 1;
      }
    }
  }

  // Rule 2: 2x2 blocks of one colour.
  for (let r = 0; r < size - 1; r += 1) {
    for (let c = 0; c < size - 1; c += 1) {
      const v = grid[r][c];
      if (v === grid[r][c + 1] && v === grid[r + 1][c] && v === grid[r + 1][c + 1]) penalty += 3;
    }
  }

  // Rule 3: the finder-like 1:1:3:1:1 pattern, which confuses a decoder.
  const pattern = [true, false, true, true, true, false, true, false, false, false, false];
  const reversed = [...pattern].reverse();
  for (let i = 0; i < size; i += 1) {
    for (let j = 0; j + 11 <= size; j += 1) {
      const row: boolean[] = [];
      const col: boolean[] = [];
      for (let k = 0; k < 11; k += 1) {
        row.push(grid[i][j + k]);
        col.push(grid[j + k][i]);
      }
      for (const candidate of [row, col]) {
        if (candidate.every((v, k) => v === pattern[k]) || candidate.every((v, k) => v === reversed[k])) {
          penalty += 40;
        }
      }
    }
  }

  // Rule 4: deviation from a 50/50 light/dark balance.
  let dark = 0;
  for (let r = 0; r < size; r += 1) for (let c = 0; c < size; c += 1) if (grid[r][c]) dark += 1;
  const percent = (dark * 100) / (size * size);
  penalty += Math.floor(Math.abs(percent - 50) / 5) * 10;

  return penalty;
}

/**
 * Encode `text` as a square matrix of modules. `true` is dark.
 *
 * Throws on anything outside the alphanumeric charset rather than silently
 * producing a symbol that decodes to something else — a ticket code is always
 * inside it, so a throw here means the caller passed the wrong thing.
 */
export function encodeQr(text: string): boolean[][] {
  const upper = text.toUpperCase();
  if (!isAlphanumeric(upper)) {
    throw new Error("QR: this encoder handles the alphanumeric charset only");
  }
  return buildSymbol(upper, pickVersion(upper));
}

/**
 * The matrix as a single SVG path `d`, one `M…h1v1h-1z` per dark module.
 *
 * One path rather than a rect per module: a version-3 symbol is ~700 modules,
 * and 700 DOM nodes on a screen someone holds up in a queue is a scroll that
 * stutters on the phones this app is actually used on.
 */
export function qrPath(matrix: boolean[][]): string {
  let d = "";
  for (let r = 0; r < matrix.length; r += 1) {
    for (let c = 0; c < matrix.length; c += 1) {
      if (matrix[r][c]) d += `M${c} ${r}h1v1h-1z`;
    }
  }
  return d;
}
