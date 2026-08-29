# Event ticketing — what was built, and where to reach it

25 screenshots, mobile (390px) and desktop (1440px), captured 29 Aug 2026.

**These are the real thing.** Every screen below was rendered by the actual app
talking to the actual backend — `WAWU-Hub-API` on :3001 against Postgres, with
`NEXT_PUBLIC_USE_MOCKS=false`. No fixtures stood in for anything. The event,
the ticket tiers, the orders, the ticket codes in the QR images and the money
on the dashboard were all created through the live API before the camera was
pointed at them:

- an event created via `POST /events`, then published
- four tiers set via `PUT /events/:id/tickets` (Early bird, Regular, VIP, and
  one that costs nothing)
- eight real orders — the paid ones through the full charge-then-verify path,
  the no-charge one issued immediately without touching a payment provider
- a real check-in via `POST /events/:id/check-in`, then the SAME code scanned
  again to produce ALREADY USED
- a second event cancelled for real: `1 order refunded`, both tickets `void`,
  order status `refunded` in the database

## Entry points — how a person actually gets to each screen

| To get here | From |
|---|---|
| Events calendar | Sidebar → **Events** (desktop) · Explore → Events (mobile) |
| An event's page | Any event card on the calendar, or a shared link |
| **Buy a ticket** | The Tickets panel on the event page |
| **My tickets** | Settings → **My tickets** · Events header → My tickets · automatically after buying |
| **Set up tickets** | Event page → host strip → **Set up tickets** (organiser only) |
| **Ticket sales** | Event page → host strip → **Sales** · Set-up screen → See sales |
| **Check people in** | Sales dashboard → **Open the scanner** · host strip → Check people in |
| Submit an event | Events → **Submit an event** |

## The screens

| # | Screen | What it shows |
|---|---|---|
| 01 | Events calendar | Browse by category — a second axis from the format/type chips, because "Music" and "Webinar" are both true of one event |
| 02 | Event page, buying | Four real tiers with what is left of each. A tier that costs nothing says so in words, never ₦0 |
| 03 | My tickets | Real QR codes carrying real server-minted codes, with the code printed underneath in mono |
| 04 | Event page, organiser | The host strip: set up tickets, sales, check people in |
| 05 | Ticket tier setup | Per tier, and the net figure shown while they type |
| 06 | Sales dashboard | 20 sold, ₦244,500 in, **₦211,900 net** — net is the headline, gross the footnote |
| 07 | Door scanner, idle | Camera offered, keypad always present |
| 08 | Door scanner, **LET THEM IN** | A real valid scan, with live counts |
| 09 | Door scanner, **ALREADY USED** | The same code twice. Amber, not red — this is an answer, not a failure — and it names when it was first scanned |
| 10 | Door scanner, **NOT A VALID TICKET** | A code no ticket carries |
| 11 | Submit an event | Banner, category, and contact email/phone |
| 12 | Cancel confirmation | States how many people and how much money before the button |
| 13 | Cancelled | Reports what came back. The scanner and shared-links sections are gone — both are dead on a cancelled event |
| 14 | Buyer's wallet | What the buyer sees afterwards |

## Three things worth looking at closely

**The QR is real, and verified.** `src/lib/qr.ts` is a hand-written encoder
rather than a dependency, because the payload is always a fixed-format ticket
code. A QR a door cannot read is somebody who paid being turned away, so it is
not trusted — `npm run check:qr` generates 300 ticket codes, renders each, and
decodes them back with an independent decoder. It caught a real bug: the
format-information block had rows and columns transposed, and 267 of 300 codes
were unreadable. All 300 round-trip now.

**A used ticket has no QR.** Screens 03 and 14: checked-in and voided tickets
drop to "Used and cancelled" and render an explanation instead of a scannable
code. Showing one would send somebody to a door to be turned away in front of a
queue.

**The money is the platform's existing split.** 15%, or 10% on a paid tier —
verified against the database, and snapshotted per order so an organiser who
upgrades mid-sale keeps the split each sale was made under. No events-specific
rate was invented.

## Reproducing

```
# backend
cd WAWU-Hub-API && npm run start:dev          # :3001
node mock-wawu-id/server.js                    # :3002 (MOCK_WAWU_ID_PORT)

# frontend
cd WAWU-Web && npx next dev -p 3100
```
