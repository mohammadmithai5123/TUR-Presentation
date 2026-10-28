import { cp, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
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

const page = shell.replace("<!-- SLIDES -->", slideMarkup.join("\n\n"));
await writeFile(path.join(root, "index.html"), page, "utf8");
await mkdir(outputDir, { recursive: true });
await writeFile(path.join(outputDir, "index.html"), page, "utf8");
await cp(path.join(root, "assets"), path.join(outputDir, "assets"), {
  recursive: true,
  force: true,
});

for (const reference of page.matchAll(/(?:src|href)="(assets\/[^"#?]+)"/g)) {
  await assertFile(path.join(root, reference[1]), `HTML reference ${reference[1]}`);
}

const css = await readFile(path.join(root, "assets", "css", "styles.css"), "utf8");
for (const reference of css.matchAll(/url\(["']?([^"')]+)["']?\)/g)) {
  if (/^(?:data:|https?:|#)/i.test(reference[1])) continue;
  await assertFile(
    path.resolve(root, "assets", "css", reference[1]),
    `CSS reference ${reference[1]}`,
  );
}

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
