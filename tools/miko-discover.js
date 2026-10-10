const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "data");
const MOVIES_FILE = path.join(DATA_DIR, "movies.json");
const QUEUE_FILE = path.join(DATA_DIR, "miko-review-queue.json");
const ENDPOINT = "https://query.wikidata.org/sparql";

function readJson(file, fallback) {
  if (!fs.existsSync(file)) return fallback;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\s*\(\d{4}\)\s*$/, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

async function main() {
  if (!fs.existsSync(MOVIES_FILE)) {
    throw new Error("data/movies.json موجود نہیں؛ عمل روک دیا گیا۔");
  }

  const movies = readJson(MOVIES_FILE, []);
  const queue = readJson(QUEUE_FILE, []);

  if (!Array.isArray(movies) || !Array.isArray(queue)) {
    throw new Error("موویز یا review queue کا JSON درست array نہیں ہے۔");
  }

  const query = `
    SELECT DISTINCT ?film ?filmLabel ?date WHERE {
      ?film wdt:P31 wd:Q11424;
            wdt:P577 ?date;
            rdfs:label ?filmLabel.
      FILTER(LANG(?filmLabel) = "en")
      FILTER(
        ?date >= "2020-01-01T00:00:00Z"^^xsd:dateTime
        && ?date <= NOW()
      )
    }
    ORDER BY DESC(?date)
    LIMIT 10
  `;

  const url = ENDPOINT + "?query=" + encodeURIComponent(query);

  console.log("Miko: مختصر query سے فلمیں تلاش کر رہا ہے...");

  const response = await fetch(url, {
    headers: {
      Accept: "application/sparql-results+json",
      "User-Agent": "WorldMovieApp-Miko/1.0"
    },
    signal: AbortSignal.timeout(20000)
  });

  if (!response.ok) {
    throw new Error("Wikidata HTTP " + response.status);
  }

  const data = await response.json();
  const results = data.results?.bindings || [];

  const existing = new Set(movies.map(m => normalize(m.title)));
  const queued = new Set(queue.map(m => normalize(m.title)));
  const added = [];

  for (const item of results) {
    const label = item.filmLabel?.value?.trim();
    const date = item.date?.value;
    const sourceUrl = item.film?.value;

    if (!label || !date || !sourceUrl) continue;
    if (/^Q\d+$/i.test(label)) continue;

    const year = Number(date.slice(0, 4));
    const releaseDate = new Date(date);

    if (!Number.isFinite(year) || Number.isNaN(releaseDate.getTime())) continue;
    if (releaseDate > new Date()) continue;

    const title = `${label} (${year})`;
    const key = normalize(title);

    if (!key || existing.has(key) || queued.has(key)) continue;

    const record = {
      title,
      year,
      releaseDate: date,
      sourceName: "Wikidata",
      sourceUrl,
      posterStatus: "NOT_VERIFIED",
      videoRightsStatus: "NOT_VERIFIED",
      publicationStatus: "PENDING_HUMAN_REVIEW",
      discoveredAt: new Date().toISOString()
    };

    queue.push(record);
    queued.add(key);
    added.push(record);
  }

  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2) + "\n");

  console.log("Wikidata نتائج:", results.length);
  console.log("نئی تجاویز:", added.length);
  console.log("کل زیرِ جائزہ تجاویز:", queue.length);

  for (const movie of added) {
    console.log("- " + movie.title);
  }

  console.log("کوئی فلم خودکار طور پر شائع نہیں کی گئی۔");
  console.log("Review queue:", QUEUE_FILE);
}

main().catch(error => {
  console.error("Miko discovery error:", error.message);
  process.exitCode = 1;
});
