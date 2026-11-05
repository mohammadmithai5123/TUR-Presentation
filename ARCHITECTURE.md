# Taheri Unity Ride — Architecture and Project Memory

2026-11-05 merge update (newest; supersedes older notes below where they disagree —
the deck now has 57 slides, not 29, 31, 44 or 55):

- **Order:** Route Overview (slides 1–29: cover, `briefing-agenda`, the original route
  slides up to `taheri-masjid-4`) → `section-activities` + 9 Activities slides →
  `section-web-application` + 8 `software-*` slides → `section-communication` + 4
  `communication-*` slides → `briefing-recap` → `one-ride-one-community` (the former
  final route slide, moved to the end). The manifest in `src/slides.json` is the order.
- **Sources merged:** `Taheri-Activities-Only` (folder/zip), `Taheri-Web-Application.html`
  and `Taheri-Communication-Application.html` from Downloads. All three were built on an
  older copy of this deck's CSS/JS; their slides were ported to one file per slide, their
  images moved to `assets/images/{activities,software,communication}/` as WebP, their
  embedded base64 data removed, and their CSS merged into the end of `styles.css`
  (one "Merged briefing" block using the shared `--deck-*` tokens).
- **Slide kinds added:** `agenda`/`recap` (four reveal cards), `section-divider`
  (`data-kind="section"`, no reveals, one click moves on), `route screen` (copy left,
  framed screenshot right; `brand` modifier for the Zello logo), and the `activity`
  family (`activity-hero`, `activity-process`, `activity-example`, `activity-results`,
  `intro`). Screenshot panels size to the image's aspect ratio (`width:auto`, so keep
  the `width`/`height` attributes on those `<img>` tags).
- **Footers:** slides in sections 02–04 and the agenda/recap use a four-section footer
  (Route Overview, Activities, Web Application, Communication) with the current one
  marked `class="current"`. Route slides keep their checkpoint footers. The counter
  `<b>` is rewritten at load, and the source files carry the correct `NN/55` text so
  the GitHub auto-save diff reports no change on an untouched deck.
- **Titles changed on merge:** `activities-intro` is "Activities overview" and
  `communication-overview` is "Communication overview" (the dividers own the section
  names); Web and Communication titles were set to sentence case. IDs are unchanged.
- **Editor:** the click-to-select list now also covers `small`, `em`, `.step-number`,
  `.image-note`, `.qr-note` and `.results span`. Activities artwork (`.process-image`,
  `.original-poster`, `.original-badge`) opens in the full-image viewer; an unrevealed
  poster/badge click advances instead.
- **Export size:** the portable HTML inlines each slide's three logos, so logo weight
  is multiplied by the slide count. Logos are now ≤512 px (173 KB per slide) and the
  export is about 38 MB. Keep new slides' repeated images small.
- **All points appear together (no click-by-click):** `show()` in `presentation.js` adds `.shown`
  to every `.detail` of the slide that opens (and removes it from the others, so the cascade plays
  again next time) and sets `--i` per point. One shared animation (`point-in`, 0.55 s, 0.14 s apart,
  in `styles.css`) makes them cascade in; with reduced motion, in the editor and in print they are
  simply visible. `total()` is 0 except for route-journey slides, so one Next press moves to the
  next slide; only the five `interactive-route` slides still step through their locations. The
  "Show details" button, `steps.js`, the "2 / 3 points" counter and the current/dimmed highlighting
  were removed on purpose: this replaces the earlier per-point pointer behaviour. The cover and
  closing subtitles (`.cover-detail`) join their staged entrance instead of waiting for a click.
- **Giveaways (section 05, slides 54–55):** `section-giveaways` (divider) and `giveaway-items`
  (three cards: Jacket, Bag, Subscription key). Pictures live in `assets/images/giveaways/` and are
  prepared from organiser-supplied images: the jacket is cropped to the product photo, the bag's
  placeholder "YOUR LOGO HERE" is replaced by the event logo (an obvious mock-up, noted in the
  slide notes), and the key on the sample Vouch365 card is pixelated so that a working key is never
  published. Dividers now read "SECTION 0X / 05", the footers list five sections, and the agenda
  and recap use five cards (`.agenda-grid.five`).
- **Naming:** the Frere Hall activity is called "Cleaning activity" everywhere (the slide that
  was "The cleaning activity" is now "Start of the cleaning activity" so titles stay unique).
- **Font loading:** `@font-face` uses `font-display:block`, and a small inline script in
  `page-shell.html` keeps `#deck` hidden (`html.fonts-loading`) until Heading and Body are
  loaded, then fades it in; a 3 s timeout or a load error also reveals it, so the deck can
  never stay hidden. It is part of the shell, so the portable export has it too.
- **Cover (slide 1, class `cover-live`):** staged entrance (title wipe, gold bar, tagline, stats,
  logo pop), a slow 26 s camera push on the hero picture, a light sweep, and a route ribbon where the
  deck's bicycle rides Taheri Masjid → four checkpoints → Taheri Masjid while each stop lights up. All
  text (stats, stop names) is ordinary editable text; stop names are stored in capitals like the rest
  of the deck (no `text-transform`, which would make the editor save capitals). Base CSS is the
  finished look and every entrance animation uses `backwards`, so reduced-motion, the editor and
  screenshots see the final slide; animations wait for `html:not(.fonts-loading)` and replay whenever
  the cover is shown again. To change the picture, replace `.hero` in Edit Mode (or the file
  `assets/images/slides/hero.webp`); the scrim and sweep layers have `pointer-events:none`, so the
  picture stays clickable.
- **Browser-saved copies never silently hide a new publish:** `editor-bootstrap.js` records the
  published markup (`base`) next to every saved copy. On load, a copy that equals its `base`
  (saved with no edits, e.g. "Save & present" on an untouched deck) is dropped so the published
  deck shows. A copy with real edits is kept, but if the published deck has changed since (base
  differs, or for older saves the build id differs) a small banner offers "Use published version"
  or "Keep my copy". Before this, anyone who had pressed "Save & present" kept seeing the old deck
  forever (it looked like "my change is not live"). Tested with throw-away site folders and browser
  profiles: legacy save, unedited save, edited save, both button choices.
- **Closing slide (last slide, class `closing-live`):** the cover's bookend. Same stats row and route
  ribbon (it reuses the `.cover-*` pieces on purpose), but the cyclist now finishes the ride: stops light
  up one by one, a confetti burst (30 pieces, fixed layout) and a "RIDE COMPLETE" badge fire at the finish,
  embers rise over the sunset and the thank-you line glows softly. Same rules as the cover: base CSS is the
  finished look, entrance animations use `backwards`, they wait for fonts and replay on return. Content
  kept as it was: "ONE RIDE. ONE COMMUNITY.", "Thank you, riders and volunteers.", the closing-ceremony line
  and the logos.
- **Toolbar (`#controls`):** compact (about 41 px high) and it hides itself. `presentation.js` adds `.idle`
  a few seconds after the last pointer movement; pointer movement or keyboard focus (`:focus-visible`)
  brings it back, and it stays while the pointer is over it. Presenting with the keyboard never makes it
  pop up. The Notes button was removed (the shortcut `N` still toggles the notes panel); keep
  `presentation.js` free of references to `#note`.
- **Permanent GitHub link (2026-11-05):** the folder is a git repository (`origin` =
  mohammadmithai5123/TUR-Presentation, `main`; `.vscode/` is excluded locally in `.git/info/exclude`).
  In the editor, `DEFAULT_REPO` in `github-sync.js` pre-fills the repository on every origin (live site,
  local file, downloaded copy); the only per-browser secret is the fine-grained token, stored in
  localStorage and never in the project (a token committed to a public repo would be revoked by
  GitHub and exposed). Opening Edit Mode calls `checkGithub()`: first run opens the GitHub panel with
  one-time instructions and a "Create a token" link; later runs silently re-verify the token, report
  "connected", or say clearly when GitHub rejects it (expired) or the device is offline; it also asks
  the browser to keep the storage (`navigator.storage.persist()`). Safety: `commitOnce()` refuses to
  save when GitHub's `src/slides.json` lists a slide that this copy never saw (stale copy), because
  that would delete it; the error is `permanent` so it is not retried. The Pages workflow now has
  `cancel-in-progress: false`: frequent auto-save commits must not cancel a deploy that is already
  running (that leaves Pages "in progress" and blocks later deploys, as happened once).
- **Wording pass:** "CHECKPOINT 01–04" tags (one word, two digits), "in-charge" spelling in
  slides and notes, "Al Nadi Al Burhani" everywhere, articles added to terse points, and
  full instructions on the route slides ("press the Right Arrow key …").
- **Verification run:** build; 27 behaviour checks (order and five sections, all points shown on opening
  for 25 multi-point slides, one Next per slide, Back across boundaries, route journeys and map
  still working, the renames and new wording, the Giveaways slide, layout overflow, a full walk of
  all 57 slides); 49 editor
  checks (edit every new element type, image replace, add/duplicate/undo/move, save +
  reload, portable export and re-export); font gate in normal, exported and
  fonts-blocked cases; GitHub auto-save with a stubbed API (untouched deck → no commit;
  one edit → one file). Run with puppeteer-core and Chrome.

2026-11-04 optimization and GitHub auto-save update (supersedes older notes below
where they disagree on images, build and auto-save):

- **Images:** all PNG/JPG converted to WebP (≤1920px wide); 11 unreferenced `stops/` photos
  removed. Images went from ~79 MB to ~11 MB. Originals are not in the repo.
- **Build:** validates all asset references before writing output, wipes `_site/` first,
  stamps `<meta name="tur-build">` with a build id; CI pins Node 22. The base64 export pack
  (`assets/js/editor-export-assets.js`, ~18 MB) is loaded only when "Download editable HTML"
  is clicked; it is no longer ~108 MB.
- **Editor auto-save:** edits save to IndexedDB ~1.2 s after each change (no reload needed).
- **GitHub auto-save (`assets/js/github-sync.js`):** with a fine-grained token
  (Contents: Read and write, this repo only) entered in the editor sidebar, each save is one
  commit via the Git Data API that updates only changed `src/slides/*.html`, `src/slides.json`
  (notes, order, additions, deletions) and uploaded images (downscaled to ≤2000px WebP into
  `assets/images/uploads/`). The existing Pages workflow redeploys in ~1 minute. The token
  lives only in that browser's localStorage. A browser copy already committed is discarded
  once a newer build is deployed (build id differs), so the deployed deck becomes authoritative.
  Concurrent editors overwrite each other's slides (last commit wins per slide).

2026-11-04 editor update (current state): the deck contains 29 slides after removing
the former slides 29–30. `editor-bootstrap.js` restores browser-saved markup before
the map and presentation initialize; `editor.js` provides a separate modal preview
with text/image/style editing, slide insertion/deletion/reordering/duplication,
Undo, notes, IndexedDB saving and standalone HTML export. Browser edits do not
write project source or deploy changes. The generated export asset bundle is
loaded on demand and includes only referenced images and fonts. Downloaded files
inline their assets and editor and can be exported again without the project.
The special animated map may be deleted or edited but cannot be duplicated.

Browser validation passed: text/font editing, image upload/size, adding, reordering,
duplicating, deleting, Undo, save/reload, offline export/re-export, route photograph
expansion and modal opening/closing, with no page errors. The editor preview was
also visually inspected at 1600×1000. Build and JavaScript syntax checks pass.

2026-11-03 update: the current build has 31 slides. Main images now open in a
native modal dialog with an uncropped fit view and scrollable zoom. Escape and
Close return focus to the opener; presentation shortcuts pause while it is open.
Visible operational copy has been shortened and guard terminology in source
slides and notes changed to members. Build and JavaScript syntax checks passed.

Formatting update: wide photos use the slide width above three large duty cards.
Shared green/gold styling now covers headings, photo frames, duty cards, route
captions, footers, focus indicators and controls. Reduced-motion settings remain
supported. The build and both JavaScript syntax checks pass. Headless Chrome
could not produce a screenshot in this environment, so visual QA remains pending.

Last reviewed: 2026-10-29. This document records the current implementation and
review findings. Update it when architecture, behavior, or operational content
changes. Recorded issues below are observations, not completed fixes.

## Purpose and scope

A static, editable 44-slide route and operations briefing for the Taheri Unity
Ride. It covers registration, the start and finish, four checkpoints, route duty
positions, cycle return, staffing reconciliation, and closing.

The presentation works from local generated HTML and is deployed to GitHub Pages:
https://mohammadmithai5123.github.io/TUR-Presentation/

There is no framework, backend, database, authentication, or third-party package
dependency. Node.js runs the build; the browser runs plain JavaScript and CSS.

## Source of truth and file map

```text
src/
  page-shell.html       HTML wrapper, shared controls, script/style references
  slides.json           Ordered manifest: stable id, source filename, speaker notes
  slides/*.html         One editable slide section per file
assets/
  css/styles.css        Layout, typography, theme, reveals, map and lens styling
  js/presentation.js    Navigation, detail reveals, notes, fullscreen, magnifier
  js/route-map.js       SVG route animation, playback, speed and seek controls
  fonts/                Local heading and body fonts
  images/
    branding/           Division, event and Sehat logos
    landmarks/          Architectural illustrations for checkpoint reveals
    maps/               Raster route basemap
    route/              Bicycle SVG
    slides/             Cover and rally backgrounds
    stops/              27 numbered route/detail photographs
scripts/build.mjs       Dependency-free assembly and validation
.github/workflows/      GitHub Pages build and deployment workflow
index.html              Generated preview; tracked, rebuild after source edits
_site/                  Generated deployment output; ignored by Git
README.md               Editing and build instructions
ARCHITECTURE.md         Architecture, constraints and review memory
```

Edit source files rather than generated HTML. The IDE tab named
`Taheri-Unity-Ride-Animated (3).html` was not present in the workspace at review;
do not assume that older filename is the current entry point.

## Build and deployment

1. Read `src/slides.json` and `src/page-shell.html`.
2. Require a nonempty manifest and exactly one `<!-- SLIDES -->` shell marker.
3. Check manifest fields, lowercase hyphenated IDs, unique IDs/files, and simple
   HTML filenames without directory components.
4. Read each slide; check its opening section, matching ID, one closing section,
   and presence of an `h1`. Inject escaped manifest notes as `data-note`.
5. Reject HTML slide files that are not listed in the manifest.
6. Assemble and write root `index.html` and `_site/index.html`; copy `assets/`.
7. Check matching local HTML asset references and CSS `url(...)` references.

The markup checks use regular expressions, not a full HTML parser. In particular,
the builder does not currently verify the `slide` class, footer numbering, all DOM
ID uniqueness, or JavaScript's required map elements. Asset validation occurs
after output writes. `_site/` is copied into without first removing stale files.

Build with `npm run build`. On Windows where PowerShell blocks `npm.ps1`, use
`npm.cmd run build`, or invoke `node scripts/build.mjs` directly. Open the generated
root `index.html` to preview. There is no configured development server or test
script.

Pushes to `main` and manual workflow dispatch build and publish `_site/` using
GitHub Pages Actions. The workflow uses the runner's Node installation and does
not currently pin a Node version with `setup-node`.

## Presentation runtime

`presentation.js` discovers `.slide` sections in document order and builds the
slide selector from their `h1` text. Its state is a zero-based slide index and a
count of revealed `.detail` elements.

- `show()` activates one slide, updates its detail visibility and route popup,
  positions its schematic bicycle, updates notes and selector, activates the map
  when appropriate, and writes the one-based slide number to the URL hash.
- Next reveals another detail before moving to the next slide. Back reverses a
  reveal before moving to the previous slide with all its details revealed.
- Clicking the deck advances. Magnifiable images and the interactive map stop
  click propagation.
- Buttons provide Back, Next, slide selection, Fullscreen and Lens on/off (plus Edit Mode). There is no Notes button; speaker notes toggle with N.
- Keyboard shortcuts: Space, Right, Enter or PageDown advance; Left or PageUp go
  back; Home and End select the first/last slide; F toggles fullscreen; M toggles
  the lens. Navigation shortcuts are skipped when a button or select has focus.
- The mouse/pointer lens magnifies contained route and landmark images by 2x;
  touch pointers do not activate it.

Slide kinds include cover, overview, monument, journey, route, text, map and
closing. Only the route-journey slides still count steps (one per location).

The runtime assumes the shell controls and slide headings exist. Preserve control
IDs when editing the shell. Scripts load at the end of the body; `route-map.js`
loads before `presentation.js` and exposes `window.rideMap.activate()` and
`window.rideMap.state()`.

## Animated map

The complete-ride slide contains SVG polylines over a raster basemap, five
checkpoint pins and a rider marker. The five legs are:

1. Taheri Masjid to Frere Hall.
2. Frere Hall to Jinnah House.
3. Jinnah House to Al Nadi Al Burhani.
4. Al Nadi Al Burhani to YMCA Ground.
5. YMCA Ground to Taheri Masjid.

`route-map.js` obtains path lengths from SVG geometry, allocates 42 seconds of
movement proportionally across the legs, and adds 2.2 seconds of arrival hold per
leg (53 seconds total at 1x). It animates stroke dash offsets and rider position
with `requestAnimationFrame`. Playback has pause/play, replay, seek and speed
controls. Time advances only while the map is active and playing, although the
animation callback remains scheduled while the map is inactive.

SVG coordinates in `src/slides/the-complete-ride.html` define the rendered route.
The JavaScript also contains leg metadata and duplicate point arrays; those
arrays are not used to construct the SVG paths. Keep route descriptions and
rendered geometry consistent when changing the route.

## Layout and assets

The deck maintains a centered 16:9 aspect ratio. Slides use absolute positioning,
percentage dimensions, and container-width (`cqw`) typography. This favors a
presentation display; it is not currently a reflowing mobile document.

The visual theme uses dark green backgrounds, cream text, gold accents and mint
secondary text. Local fonts avoid external font requests. Branding medallions
and checkpoint footers repeat across source slides. CSS contains earlier rules
followed by later theme and sizing overrides; the final matching declarations
control the appearance.

At review there were 39 image assets, approximately 26.2 MiB combined, all
referenced by the presentation. The largest included the route basemap, Jinnah
illustration, hero background, YMCA illustration and rally background. Images
are not currently configured for lazy loading or responsive source selection.

## Content constraints to preserve

Speaker notes in `src/slides.json` preserve source qualifications and operational
decisions. Consult them before editing staffing or route content.

- Architectural checkpoint illustrations are stylized AI visuals, not verified
  architectural surveys. Source route scenes are proposed mockups.
- Route sequences and the traced map are briefing aids, not verified turn-by-turn
  navigation. Al Nadi's return retraces the incoming road.
- Registration placement follows the Noman Centre visual.
- Outbound and return Shaheen Complex slides describe different passages.
- Cooperative Market has no separate draft duty count; do not double count its
  illustrated guide.
- YMCA's 16 spot duties include the two gate guards on the preceding slide;
  the six internal zones total 14. Activity start/end scanning remain separate.
- Cycle return must precede the closing ceremony.
- The reconciliation states 106 spot duties plus 10 sub-incharges: scouts
  24 + 2, guards 82 + 8, totaling 116 assignments before separately listed command
  roles. Assignments are not confirmed unique people.
- No event date is confirmed by the current source.
- Activities: winner counts, weight unit, tare and tie rules, and QR mapping are still
  pending (see the giveaway slide and its notes); "75 × 2 = 150" is an illustration.
- Web Application screenshots are a supplied test snapshot and show participant names
  and ITS numbers; the Zello channel screen is an organiser-supplied example, not a
  verified TUR channel. Review both before publishing the site publicly.
- The original referenced `TUR_Duty_Draft.pdf` was absent from this workspace;
  staffing totals and route accuracy were not independently verified against it.

## Known issues and improvements

These findings remain open as of the review date:

1. **URL navigation:** the runtime reads the initial numeric hash but has no
   `hashchange` listener. Browser Back/Forward can change the URL without updating
   the visible slide. Stable manifest IDs are not used as navigation hashes.
2. **End boundary:** advancing after the last reveal on the last slide calls
   `show()` with an out-of-range index, clamps back to the last slide, and resets
   its reveals to zero.
3. **Map pause state:** reentering the map sets playback to playing, even if it
   was manually paused before leaving.
4. **Reduced motion:** CSS respects `prefers-reduced-motion`, but JavaScript map
   autoplay does not consult that preference.
5. **Narrow screens:** fixed horizontal controls have no wrapping/mobile layout;
   slide text scales down with the 16:9 deck.
6. **Accessibility:** many image alt texts are numeric or generic; the slide and
   speed selectors lack accessible labels. Incremental details use opacity rather
   than explicit accessibility visibility state.
7. **Build robustness:** validate before writing outputs, strengthen markup
   checks where useful, and prevent stale deployment files from accumulating.
8. **Maintainability:** generate footer numbering, reduce repeated shared markup,
   consolidate CSS overrides, and format JavaScript for easier review.
9. **Loading:** optimize large raster assets while preserving readable route
   detail; measure browser loading before choosing an approach.

## Validation and future edit checklist

The 2026-10-29 review passed JavaScript syntax checks and the 44-slide build.
Generated root HTML matched the source assembly. Browser rendering and interactive
behavior were not visually tested during that review.

For future changes:

- Edit slides, manifest, shell and assets as the authoritative sources.
- Preserve unique section IDs and manifest/file correspondence.
- Update manual footer numbering when reordering or adding slides.
- Rebuild and check `git diff` for intended generated changes.
- Run `node --check assets/js/presentation.js` and
  `node --check assets/js/route-map.js` after JavaScript changes.
- Preview affected slides and reveal steps, especially journey popups and image
  placement. Check navigation, map controls, lens, notes and fullscreen as relevant.
- Check narrow-screen behavior and reduced-motion behavior after layout or
  animation changes.
- Update this document when a recorded issue is fixed or a constraint changes.
