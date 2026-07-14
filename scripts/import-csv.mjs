// Imports the Webflow "Projects" CSV export into Astro content collection
// markdown files under src/content/projects/. Run: npm run import
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const CSV_PATH =
  process.argv[2] ||
  "C:\\Users\\ltafu\\Downloads\\prettydamnsweet - Projects - 5e60746ddf9df82739e9d89e.decoded.csv";
const OUT_DIR = path.join(ROOT, "src", "content", "projects");

const KNOWN_CATEGORIES = [
  "design-and-motion",
  "branded-content",
  "immersive-experiences",
  "healthcare",
  "sports",
  "film-and-theater",
];

/** Minimal RFC-4180 CSV parser that supports quoted, multi-line fields. */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  const s = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inQuotes) {
      if (c === '"') {
        if (s[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function rewriteUrls(str) {
  if (!str) return str;
  return str.replaceAll(
    "https://uploads-ssl.webflow.com/",
    "https://cdn.prod.website-files.com/"
  );
}

function splitList(str) {
  if (!str) return [];
  return str
    .split(";")
    .map((x) => rewriteUrls(x.trim()))
    .filter(Boolean);
}

function splitCategories(str) {
  if (!str) return [];
  return str
    .split(";")
    .map((x) => x.trim())
    .filter((x) => KNOWN_CATEGORIES.includes(x));
}

function cleanHtml(str) {
  if (!str) return "";
  return rewriteUrls(str.trim());
}

function slugify(str) {
  return String(str)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function yamlString(v) {
  // JSON strings are valid YAML flow scalars (single line)
  return JSON.stringify(v ?? "");
}

function yamlList(arr) {
  if (!arr || arr.length === 0) return " []";
  return "\n" + arr.map((x) => `  - ${JSON.stringify(x)}`).join("\n");
}

function main() {
  if (!fs.existsSync(CSV_PATH)) {
    console.error("CSV not found at:", CSV_PATH);
    process.exit(1);
  }
  const text = fs.readFileSync(CSV_PATH, "utf8");
  const rows = parseCsv(text);
  const header = rows.shift().map((h) => h.trim());
  const idx = (name) => header.indexOf(name);

  const col = {
    name: idx("Name"),
    url: idx("URL"),
    draft: idx("Draft"),
    archived: idx("Archived"),
    client: idx("Client"),
    thumbnail: idx("Thumbnail"),
    mainVideo: idx("Main Video Link"),
    summary: idx("Project Summary"),
    styleFrames: idx("Style Frames / Screen Shots"),
    secondVideo: idx("Second Video"),
    thirdVideo: idx("Third Video"),
    fourthVideo: idx("Fourth Video"),
    processDescription: idx("What We Did / Process Description"),
    processVideo: idx("Process / Case Study Video"),
    processImages: idx("Process Images"),
    btsDescription: idx("Behind the Scenes Description"),
    btsVideo: idx("BTS / CaseStudy Video"),
    btsPhotos: idx("BTS Photos"),
    credits: idx("Credits"),
    portfolio: idx("Portfolio Page"),
    order: idx("Order"),
  };

  // Clean output dir of previously generated files
  fs.mkdirSync(OUT_DIR, { recursive: true });
  for (const f of fs.readdirSync(OUT_DIR)) {
    if (f.endsWith(".md")) fs.unlinkSync(path.join(OUT_DIR, f));
  }

  const seen = new Set();
  const projects = [];

  for (const r of rows) {
    if (!r || r.length < 3) continue;
    const name = (r[col.name] || "").trim();
    if (!name) continue;
    if ((r[col.archived] || "").trim() === "true") continue;

    let slug = slugify(r[col.url] || name);
    if (!slug) slug = slugify(name);
    let unique = slug;
    let n = 2;
    while (seen.has(unique)) unique = `${slug}-${n++}`;
    seen.add(unique);

    const categories = splitCategories(r[col.portfolio]);
    const orderRaw = parseInt((r[col.order] || "").trim(), 10);

    projects.push({
      slug: unique,
      name,
      draft: (r[col.draft] || "").trim() === "true",
      client: (r[col.client] || "").trim(),
      thumbnail: rewriteUrls((r[col.thumbnail] || "").trim()),
      mainVideo: (r[col.mainVideo] || "").trim(),
      summary: cleanHtml(r[col.summary]),
      styleFrames: splitList(r[col.styleFrames]),
      secondVideo: (r[col.secondVideo] || "").trim(),
      thirdVideo: (r[col.thirdVideo] || "").trim(),
      fourthVideo: (r[col.fourthVideo] || "").trim(),
      processDescription: cleanHtml(r[col.processDescription]),
      processVideo: (r[col.processVideo] || "").trim(),
      processImages: splitList(r[col.processImages]),
      btsDescription: cleanHtml(r[col.btsDescription]),
      btsVideo: (r[col.btsVideo] || "").trim(),
      btsPhotos: splitList(r[col.btsPhotos]),
      credits: cleanHtml(r[col.credits]),
      categories,
      order: Number.isFinite(orderRaw) ? orderRaw : 0,
    });
  }

  // Feature a handful for the homepage: design-and-motion items with media,
  // lowest order first.
  const featuredSet = new Set(
    projects
      .filter(
        (p) =>
          p.thumbnail &&
          p.mainVideo &&
          p.categories.includes("design-and-motion")
      )
      .sort((a, b) => a.order - b.order)
      .slice(0, 6)
      .map((p) => p.slug)
  );

  let written = 0;
  for (const p of projects) {
    const featured = featuredSet.has(p.slug);
    const fm = [
      "---",
      `title: ${yamlString(p.name)}`,
      `client: ${yamlString(p.client)}`,
      `thumbnail: ${yamlString(p.thumbnail)}`,
      `mainVideo: ${yamlString(p.mainVideo)}`,
      `secondVideo: ${yamlString(p.secondVideo)}`,
      `thirdVideo: ${yamlString(p.thirdVideo)}`,
      `fourthVideo: ${yamlString(p.fourthVideo)}`,
      `styleFrames:${yamlList(p.styleFrames)}`,
      `processDescription: ${yamlString(p.processDescription)}`,
      `processVideo: ${yamlString(p.processVideo)}`,
      `processImages:${yamlList(p.processImages)}`,
      `btsDescription: ${yamlString(p.btsDescription)}`,
      `btsVideo: ${yamlString(p.btsVideo)}`,
      `btsPhotos:${yamlList(p.btsPhotos)}`,
      `credits: ${yamlString(p.credits)}`,
      `categories:${yamlList(p.categories)}`,
      `order: ${p.order}`,
      `featured: ${featured}`,
      `draft: ${p.draft}`,
      "---",
      "",
      p.summary || "",
      "",
    ].join("\n");

    fs.writeFileSync(path.join(OUT_DIR, `${p.slug}.md`), fm, "utf8");
    written++;
  }

  console.log(`Imported ${written} projects to ${OUT_DIR}`);
  console.log(`Featured on homepage: ${[...featuredSet].join(", ")}`);
  const byCat = {};
  for (const p of projects)
    for (const c of p.categories) byCat[c] = (byCat[c] || 0) + 1;
  console.log("By category:", byCat);
}

main();
