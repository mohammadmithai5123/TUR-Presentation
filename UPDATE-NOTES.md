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

## 2026-11-05 — GitHub link made permanent

- The project folder is now linked to the GitHub repository, so commits and pushes can be made straight from it.
- Edit Mode is pre-linked to the repository. Paste a token once per browser (see README, "Edits go live
  automatically") and every later edit commits itself and goes live; each time Edit Mode opens it re-checks the
  token and says if it has expired.
- Saving from an old copy can no longer delete newer slides: it is refused with a clear message instead.
- The deploy workflow no longer cancels a deployment in progress, so rapid auto-save commits cannot block Pages.

## 2026-11-05 — fix: "GitHub: No internet connection." when connecting

Connecting always failed in a real browser because of a stray "/" in the request address. Fixed; a wrong token now
says "Token was rejected", and other problems (token with odd characters, GitHub blocked by a VPN or firewall,
really offline) each get their own clear message.

## 2026-11-05 — Valuable Sponsors

- New section 06 after Giveaways: an introduction slide and one slide with all 13 sponsor logos together on equal plaques
  in a gold frame, with a quick, uniform entrance (no clicking) and a slow gloss. 58 slides in total (the browser-editor edits made by the deck owner are kept).
- The agenda and recap now list six parts; footers show six sections and dividers read "SECTION 0X / 06".

## 2026-11-05 — text fits automatically

The deck owner's new, longer wording could run over the footer (for example on the YMCA Ground activity slide). The text of
the open slide now shrinks just enough to stay above the footer. Nothing is changed in the saved text.

## 2026-11-07 — new closing slide (team celebration)

The last slide ("Thank you") now uses the supplied closing poster: dark teal and gold background, the group of six riders and
one volunteer celebrating, and the wording ONE RIDE. / ONE TEAM. / ONE COMMUNITY., "Together, we make it happen.", "Thank you,
riders and volunteers.", the 4 / 2 / 1 stats, the three original logos and the organiser and ceremony lines.
- It uses the deck's own fonts (Heading and Body), not the poster's Arial.
- Entrance: the team rises into place and the three lines appear one after another (about 2 seconds), then a short confetti burst
  on the right. It is plain CSS (28 small pieces, gone after about 7 seconds), with no script, so nothing keeps running. With
  "reduce motion" the finished slide shows at once without confetti. The editor preview always shows the finished slide.
- Removed to keep the deck light: the old closing's route ribbon, rising embers, "RIDE COMPLETE" badge, confetti burst and their
  CSS (about 160 lines). The pack's victory-cue sound (1.7 MB) and pointer parallax were left out; they can be added later.
- The team picture has a soft studio halo (not a clean cut-out), so it is blended with a mask and a dark gradient. Editing the
  heading in the editor turns its three lines into plain text (the gold second line is lost); edit the other texts freely.
- Pictures: assets/images/closing/background.webp (27 KB) and team-celebration.webp (388 KB), converted from the PNGs in the pack.

## 2026-11-07 — interactive opening title screen

Slide 1 is now a designed opening screen: dark-teal and gold background, the heading "TAHERI UNITY RIDE", the three stats,
a **START PRESENTATION** button, the three original event logos at the bottom left and the cyclist standing beside his bike.

What it does
- The cyclist's **eyes follow the mouse pointer**, his **head turns** up to about 12° sideways and 6° up/down, and he shifts a
  couple of pixels with it. His feet and the bike never move. Movement is eased, and he goes back to a neutral pose when the
  pointer leaves the window. He breathes slowly, blinks now and then (sometimes twice), and nods with relaxed eyes when the
  pointer reaches the Start button.
- Touch screens and devices without a mouse get a slow idle gaze instead, so the character still feels alive.
- Everything enters in about two seconds. **Start** (click, or Enter / Space / Right Arrow / a click on the slide) plays one
  acknowledgement (the cyclist nods) and a one-second exit, then opens slide 2 through the normal Next. Extra clicks while it
  plays are ignored. Back or Home returns to a fresh title with the entrance replayed.
- Animation runs only while this slide is open (it stops on every other slide and in a hidden tab). With "reduce motion" on,
  the cyclist stays in his neutral pose, everything is visible at once and Start works immediately.
- Phones and portrait screens get their own stacked layout (heading and stats on top, cyclist in the middle, a full-width Start
  button and the logos at the bottom). Text that becomes longer after editing is shrunk automatically to fit (never saved).

How it is built (honest description)
- The character is a small **2.5D rig of separate pictures**: body, head (behind the body, joined at the collar), two irises
  clipped to the eye openings, and two eyelid layers. A script writes a few CSS variables; there is no video and no WebGL.
- The head "turn" is a perspective tilt of one flat picture, so it is an approximation, not a true 3D head. The eyes are small in
  the artwork, so the iris movement is subtle by design. The "friendly" hover is a nod with half-closed eyelids, not a redrawn face.
- Heading, tag, tagline, subtitle, stats, Start button, logos and every character picture are separate elements; the editor can
  edit all text and select/replace the pictures.

Assets used (all local, about 0.2 MB): assets/images/title/background.webp, body.webp, head.webp, iris-l.webp, iris-r.webp.
Still needed for a **full** facial animation (head turning in real 3D, mouth, eyebrows, expressions): a layered source file or
separately painted layers from the artist (head without hair/helmet, eyelids, mouth shapes, eyebrows, sclera behind the irises),
or a rigged 3D model of the character.

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
