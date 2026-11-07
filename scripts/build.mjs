import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceDir = path.join(root, "src");
const slidesDir = path.join(sourceDir, "slides");
const outputDir = path.join(root, "_site");

const manifest = JSON.parse(
  await readFile(path.join(sourceDir, "slides.json"), "utf8"),
);
const shell = await readFile(path.join(sourceDir, "page-shell.html"), "utf8");

if (!Array.isArray(manifest) || manifest.length === 0) {
  throw new Error("src/slides.json must contain an ordered list of slides.");
}

if (shell.split("<!-- SLIDES -->").length !== 2) {
  throw new Error("src/page-shell.html must contain exactly one <!-- SLIDES --> marker.");
}

const seenIds = new Set();
const seenFiles = new Set();
const slideMarkup = [];

for (const [index, slide] of manifest.entries()) {
  if (
    !slide ||
    typeof slide.id !== "string" ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slide.id) ||
    typeof slide.file !== "string" ||
    path.basename(slide.file) !== slide.file ||
    !slide.file.endsWith(".html") ||
    typeof slide.notes !== "string"
  ) {
    throw new Error(`Invalid slide entry at src/slides.json position ${index + 1}.`);
  }
  if (seenIds.has(slide.id) || seenFiles.has(slide.file)) {
    throw new Error(`Duplicate slide id or file at src/slides.json position ${index + 1}.`);
  }
  seenIds.add(slide.id);
  seenFiles.add(slide.file);

  const filePath = path.join(slidesDir, slide.file);
  let markup = (await readFile(filePath, "utf8")).trim();
  const openingTag = markup.match(/^<section\b[^>]*>/i);
  const closingTags = markup.match(/<\/section\s*>/gi) ?? [];
  if (!openingTag || closingTags.length !== 1 || !/<h1\b/i.test(markup)) {
    throw new Error(`${filePath} must contain one slide section with an h1 heading.`);
  }

  const idAttribute = openingTag[0].match(/\bid="([^"]+)"/);
  if (!idAttribute || idAttribute[1] !== slide.id) {
    throw new Error(`${filePath} must have id="${slide.id}" on its section.`);
  }

  const noteAttribute = ` data-note="${escapeAttribute(slide.notes)}"`;
  markup = markup.replace(openingTag[0], openingTag[0].slice(0, -1) + noteAttribute + ">");
  slideMarkup.push(markup);
}

const availableSlides = new Set(await readdir(slidesDir));
for (const file of availableSlides) {
  if (file.endsWith(".html") && !seenFiles.has(file)) {
    throw new Error(`Slide file ${file} is not listed in src/slides.json.`);
  }
}

const buildId = new Date().toISOString();
const page = shell
  .replace("<!-- SLIDES -->", () => slideMarkup.join("\n\n"))
  .replace("__BUILD_ID__", buildId);

// Validate every asset reference BEFORE writing any output.
for (const reference of page.matchAll(/(?:src|href)="(assets\/[^"#?]+)"/g)) {
  await assertFile(path.join(root, reference[1]), `HTML reference ${reference[1]}`);
}
const stylesheet = await readFile(path.join(root, "assets", "css", "styles.css"), "utf8");
for (const reference of stylesheet.matchAll(/url\(["']?([^"')]+)["']?\)/g)) {
  if (/^(?:data:|https?:|#)/i.test(reference[1])) continue;
  await assertFile(
    path.resolve(root, "assets", "css", reference[1]),
    `CSS reference ${reference[1]}`,
  );
}

await writeFile(path.join(root, "index.html"), page, "utf8");
await rm(outputDir, { recursive: true, force: true }); // no stale files in the deployment
await mkdir(outputDir, { recursive: true });
await writeFile(path.join(outputDir, "index.html"), page, "utf8");
await buildEditorExportPack();
await cp(path.join(root, "assets"), path.join(outputDir, "assets"), {
  recursive: true,
  force: true,
});

console.log(`Built ${manifest.length} slides into index.html and _site/.`);

function escapeAttribute(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

async function assertFile(filePath, description) {
  try {
    await readFile(filePath);
  } catch (error) {
    throw new Error(`Missing ${description}: ${filePath}`, { cause: error });
  }
}

async function buildEditorExportPack() {
  const files = {};
  const mime = { '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.svg':'image/svg+xml', '.gif':'image/gif', '.webp':'image/webp', '.ttf':'font/ttf', '.mp4':'video/mp4', '.mp3':'audio/mpeg' };
  let css = await readFile(path.join(root,'assets/css/styles.css'),'utf8');
  const required = new Set([...page.matchAll(/(?:src|href)="(assets\/[^"#?]+)"/g)].map(match => match[1]).filter(ref => mime[path.extname(ref)]));
  for (const match of css.matchAll(/url\(["']?([^"')]+)["']?\)/g)) {
    const ref = path.posix.normalize(`assets/css/${match[1]}`);
    if (mime[path.extname(ref)]) required.add(ref);
  }
  for (const ref of required) files[ref] = `data:${mime[path.extname(ref)]};base64,${(await readFile(path.join(root,ref))).toString('base64')}`;
  css = css.replace(/url\(["']?([^"')]+)["']?\)/g,(match,ref) => {
    const key = path.posix.normalize(`assets/css/${ref}`);
    return files[key] ? `url("${files[key]}")` : match;
  });
  const scripts = {};
  for (const name of ['editor-bootstrap.js','route-map.js','presentation.js','title-screen.js','intro-video.js','slide-sounds.js','credits.js','github-sync.js','editor.js']) scripts[name] = await readFile(path.join(root,'assets/js',name),'utf8');
  await writeFile(path.join(root,'assets/js/editor-export-assets.js'), `window.turExportAssets=${JSON.stringify({shell,css,files,scripts}).replaceAll('<','\\u003c')};\n`);
}
