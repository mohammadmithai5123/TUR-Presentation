# Presentation update notes

## 2026-11-05 — merged presentation (55 slides)

The route briefing, the Activities deck, the Taheri Web Application deck and the
Communication Application deck are now one presentation:
Route Overview → Activities → Taheri Web Application → Communication Application →
recap → closing banner.

- The former final slide (ONE RIDE. ONE COMMUNITY.) moved to the very end.
- New slides: briefing agenda (slide 2), three section dividers (Activities,
  Taheri Web Application, Communication Application) and a recap (slide 54).
- All 9 Activities, 8 Web Application and 4 Communication slides were carried over
  with their text and speaker notes; their styling now follows the route deck.
- Three titles changed to avoid two "Activities" / "Communication Application"
  slides in a row: "Activities overview", "Communication overview". Web and
  Communication titles now use sentence case like the rest of the deck.
- Screenshots and artwork were converted to WebP; branding logos were reduced to
  512 px so the portable HTML export stays near 40 MB.

## 2026-11-05 — wording, points and font loading

- Wording pass over every slide: "CHECKPOINT 01–04" tags, "in-charge" spelling (slides and
  notes), "Al Nadi Al Burhani" used consistently, missing articles added, and the route
  slides now say "press the Right Arrow key to follow the route."
- Every slide that opens its points one by one now behaves like the Activities slides: the
  newest point is highlighted, earlier points dim, and a counter shows "2 / 3 points".
  All reveals use the same timing and easing.
- Fonts load before the deck appears, so text never flashes in a fallback font.

## 2026-11-05 — livelier cover

The first slide now builds in step by step (title, gold bar, tagline, "4 checkpoints · 2 activities ·
1 community", logos), the picture slowly pushes in, and a route ribbon shows the bicycle riding from
Taheri Masjid through the four checkpoints and back. Everything stays editable; the first Next still
reveals "ROUTE & OPERATIONS BRIEFING".

## 2026-11-05 — "I still see the old text" fix

A browser that had once used Edit Mode → Save & present kept its own copy of the deck and never
showed later published changes. Now an unedited copy defers to the published deck, and a copy with
edits shows a small bar: "Use published version" or "Keep my copy".

## 2026-11-05 — animated ending, tidier controls

- The last slide now mirrors the cover: the cyclist finishes the route, confetti bursts at the finish with a
  "RIDE COMPLETE" badge, embers rise over the sunset and "Thank you, riders and volunteers." glows softly.
- The bottom toolbar is smaller and hides itself when the mouse is still; move the mouse to bring it back.
  The Notes button is gone (press N to show or hide speaker notes).

## 2026-11-05 — fewer clicks, clearer wording, Giveaways

- Every slide now shows all of its points together as soon as it opens (a short, even cascade), so one
  Next press always moves to the next slide. The Show details button and the points counter are gone.
  Only the five route journeys still step through their locations.
- Route-slide wording tightened and made formal; the Frere Hall activity is called "Cleaning activity"
  on every slide instead of "Garbage collection".
- New section 05 "Giveaways": an introduction slide and one slide showing the jacket, the bag (with the
  event logo) and the subscription key card. The key on the sample card is masked on purpose.
  The agenda and recap now list five parts.

## Earlier route update (31 slides)

31 slides, using the original theme, local fonts, controls and animation effects.

| Slide | Scene | Update |
|---|---|---|
| 4 | noman-centre | noman-setup.png |
| 6 | taheri-masjid-2 | taheri-start.png |
| 9 | frere-hall-2 | frere-entry.png |
| 10 | frere-hall-3 | frere-courtyard.png |
| 11 | frere-hall-to-jinnah-house | frere-courtyard.png, jinnah-entry.png |
| 13 | jinnah-house-2 | jinnah-entry.png |
| 16 | al-nadi-al-burhani-2 | nadi-entry.png |
| 17 | al-nadi-cycle-parking | nadi-parking.png |
| 18 | al-nadi-al-burhani-3 | nadi-building.png |
| 19 | al-nadi-to-ymca-ground | ymca-entry.png |
| 21 | ymca-ground-2 | ymca-entry.png |
| 22 | ymca-cycle-parking | ymca-parking.png |
| 23 | ymca-ground-3 | ymca-pavilion.png |
| 24 | ymca-refreshments | ymca-pavilion.png |
| 26 | taheri-ending-arch | ending-arch.png |
| 27 | cycle-return-before-closing | taheri-cycle-return.png |

Added slides: Nadi outside cycle parking; YMCA inside cycle parking; YMCA refreshments/departure; Taheri ending arch.

Ending order: final return route → ending arch → cycle return and final scan → closing ceremony.

The earlier cycle-return image now illustrates the original text-only handoff slide. Frere Hall departure uses the approved courtyard image; it is not labeled as an exit-gate photograph.

The duty allocations remain those of the supplied presentation. Separate views do not add staff to the totals. Noman now explicitly shows three combined registration and giveaway desks. No bicycle quantity is asserted.

Original landmark reveal slides, route photos for other streets, final ceremony image, route map, logos, and navigation are retained.

Map initialization fix: defer SVG path measurement until the map slide is visible. This prevents a non-rendered SVG exception; routes, timing, effects and controls are unchanged. The presentation navigation script and stylesheet are byte-for-byte unchanged.
