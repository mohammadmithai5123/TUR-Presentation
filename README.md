# Taheri Unity Ride

Static, editable presentation with a small build step. Node.js is the only
requirement; there are no third-party packages.

## Live site

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
  images/               Branding, landmarks, maps, and slide photography
  js/
    presentation.js     Navigation, notes, and image magnifier
    route-map.js        Animated route and map controls
scripts/
  build.mjs             Validates and assembles the presentation
index.html              Generated local preview
_site/                  Generated GitHub Pages site (not committed)
```

## Edit, reorder, and add slides

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

Run `npm run build`. This checks slide IDs, markup, notes, and local asset paths,
then updates the root `index.html` preview and builds `_site/` for deployment.
Open the generated root `index.html` in a browser to preview the presentation.

Pushing to `main` runs the GitHub Pages workflow automatically.
