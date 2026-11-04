# Taheri Unity Ride

Static, editable presentation with a small build step. Node.js is the only
requirement; there are no third-party packages.

## Updated archive

This project contains the merged 55-slide presentation. Extract it and open
`index.html` to view it. See `OPEN-FIRST.txt` and `UPDATE-NOTES.md` for the
changes. The hosted website below has not been updated by editing this archive.

## Presentation structure

| Section | Slides | What it holds |
|---|---|---|
| Route Overview | 1–29 | Cover, agenda, animated route map and every checkpoint, ending with the closing ceremony at Taheri Masjid. |
| 02 Activities | 30–39 | Divider, overview, garbage collection, treasure hunt and giveaway criteria. |
| 03 Taheri Web Application | 40–48 | Divider, software overview and the eight feature screens. |
| 04 Communication Application | 49–53 | Divider, Zello overview, groups and channels, push-to-talk, internet requirement. |
| Close | 54–55 | Recap slide, then the "ONE RIDE. ONE COMMUNITY." closing banner. |

Each new section opens with its own divider slide. The footer of every slide in
sections 02–04 shows the four sections with the current one highlighted. Slide
numbers are generated at load time, so reordering never needs manual renumbering.

## Original live site

https://mohammadmithai5123.github.io/TUR-Presentation/

## Project structure

```text
src/
  page-shell.html       Shared page wrapper and presentation controls
  slides.json           Slide order, stable IDs, and slide notes
  slides/               One HTML file per slide
assets/
  css/styles.css        Presentation styles
  fonts/                Local typefaces
  images/               Branding, landmarks, maps, slide photography, and the
                        activities/, software/ and communication/ artwork
  js/
    presentation.js     Navigation, notes, and image magnifier
    activities.js       Highlights the current Activities step and counts steps
    route-map.js        Animated route and map controls
scripts/
  build.mjs             Validates and assembles the presentation
index.html              Generated local preview
_site/                  Generated GitHub Pages site (not committed)
```

## Edit, reorder, and add slides

### Edit without coding

Open `index.html` and click **Edit Mode** in the bottom toolbar.

1. Choose a slide on the left. Click text or a picture in the preview to select it.
2. Use the right panel to change text, font size, colour, image, image size, fit,
   background or speaker notes. Uploaded images can be PNG, JPG, WEBP or GIF,
   up to 20 MB each.
3. Use **Add slide**, **Add photo**, **Duplicate**, **Move up/down**, **Delete slide**
   and **Undo** to arrange the presentation. The animated map cannot be duplicated.
4. **Save & present** saves to this browser and reopens the presentation. Browser
   saves do not modify the source HTML files or publish changes to the live site.
5. **Download editable HTML** creates a standalone file with images, fonts,
   animations and Edit Mode included. Open the downloaded file to present or edit
   on another computer. Keep a downloaded copy as your backup.

The editor uses IndexedDB (with localStorage fallback). If browser storage is
unavailable, use Download editable HTML. Closing with unsaved changes prompts you
before discarding them.

### Edit project source

1. Edit a slide in `src/slides/`. Each file contains exactly one `<section
   class="slide">` with an `<h1>`.
2. Edit `src/slides.json` to change the order, stable ID, or speaker note for a
   slide. The array order is the presentation order; keep each entry's `id`
   consistent with its section ID.
3. To add a slide, copy an existing slide file, give its section a unique
   lowercase-hyphenated `id`, and add an entry for it to `src/slides.json`.
   To remove a slide, remove its manifest entry and source file.
4. Add images under the matching `assets/images/` folder and reference them
   from the slide using `assets/images/...`.

## Build and preview

Click a main slide image (or an expanded route photo) to open the complete image
in a screen-sized viewer without cropping. Use **Zoom in** to inspect long images
with scrolling, **Fit image** to see the whole image, and **Close** or Escape to
return to the same slide. Main images also open with Enter or Space when focused.
Slide copy is shortened; duty counts and fuller context remain in speaker notes.
Wide location photos (aspect ratio 1.85 or higher) automatically use a full-width
slide layout with a compact text strip below and a gentle entrance animation.
Every location photo slide includes a View full image button.

Run `npm run build`. This checks slide IDs, markup, notes, and local asset paths,
then updates the root `index.html` preview and builds `_site/` for deployment.
Open the generated root `index.html` in a browser to preview the presentation.

The build also generates `assets/js/editor-export-assets.js`, loaded only when
exporting. It bundles presentation assets for offline downloads and is ignored
by Git. Rebuild after source changes to update the export bundle.

Optional browser verification: install Playwright in your development environment
and run `node scripts/check-editor.mjs`. Alternatively set `TUR_PLAYWRIGHT_MODULE`
to a Playwright module URL. This checks editing, image upload, slide operations,
browser saving, portable export/re-export and route image popups.

Pushing to `main` runs the GitHub Pages workflow automatically.

## Route sections

Each route leg starts with a connected route overview and compact stop
thumbnails. Use Next or Right Arrow to open a location photograph; the route
collapses while the photograph expands, and the next action returns it to its
thumbnail before opening the next stop. Back or Left Arrow opens the previous
stop, selecting a thumbnail opens that location directly, and Route overview
returns to the route without advancing. The photo caption shows only the next
destination and the current stop's member count. Progression is
presenter-controlled. The square magnifier remains available on route
photographs.

This project builds an interactive browser presentation and does not include a
PowerPoint exporter. The route photo transitions and thumbnail navigation are
therefore available in the browser output.
