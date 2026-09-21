import { tileGradient } from "@/components/ui";

/*
  A DIFFERENT COLOUR EVERY DAY, and it has to actually LOOK different.

  Lifted out of TgifDaily when the home screen grew its own TGIF card
  (build brief C9): the hero on /home and the story behind it are the same
  reading on the same day, so they have to be the same colour. Two copies of
  a hash is how they would have drifted apart the first time either was
  touched.

  The first attempt at this was eleven hand-written gradients, and it failed
  for a reason worth writing down: ten of the eleven had a purple in them.
  Purple is the brand accent, so reaching for it is the reflex, and the result
  was that whatever the hash picked the card came out purple. A palette whose
  entries are all the same colour is not a palette.

  So this uses the app's own tile palette instead of a private one. Reusing it
  means this screen cannot drift from the rest of the app, and there is no
  second colour system to keep in step.

  HUES is which of that palette's seven entries to deal from, and it is a
  subset for one reason: entries 0 and 4 are both purple-into-purple and read
  as the same card. Dropping one takes the purple share of the year from 46%
  to 32% and makes a fortnight look like a fortnight rather than a theme.

  Picked from the date rather than from Math.random(), which matters twice
  over: it holds still while you tap back and forth through the cards instead
  of repainting under you, and everybody opening the app on the same day gets
  the same one, so it is something two people can actually mention to each
  other.
*/
/** The tile-palette entries this deals from, one per distinct hue. */
const HUES = [0, 1, 3, 5, 6, 2] as const;

/** The gradient class for a given day. Same date in, same colour out. */
export function tgifGradient(date: Date): string {
  /*
    FNV-1a over "2026-09-05", then an avalanche step.

    The obvious `h * 31 + charCode` was tried first and is not good enough
    here. On keys that differ by one digit it stays almost linear, so a month
    came out as 6, 5, 4, 3, 2... : the colour visibly counted down the list
    and back up again, which is the opposite of the "different every day" this
    is for.
  */
  const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  let h = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  h ^= h >>> 15;
  h = Math.imul(h, 0x2545f491);
  h ^= h >>> 13;
  return tileGradient(HUES[(h >>> 0) % HUES.length]);
}

/** Midnight on the reader's own device, which is the day the reading is for. */
export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
