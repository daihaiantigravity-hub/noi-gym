import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const dataDir = path.join(projectRoot, "scripts", "migration", "data");
const transferPath = path.join(dataDir, "musclewiki-yoga-transfer.json");
const muscleNames = {
  abdominals: "Abdominals",
  biceps: "Biceps",
  calves: "Calves",
  chest: "Chest",
  forearms: "Forearms",
  "front-shoulders": "Front Shoulders",
  glutes: "Glutes",
  hamstrings: "Hamstrings",
  lats: "Lats",
  lowerback: "Lower Back",
  obliques: "Obliques",
  quads: "Quads",
  "rear-shoulders": "Rear Shoulders",
  traps: "Traps",
  "traps-middle": "Middle Traps",
  triceps: "Triceps",
};

const transfer = JSON.parse(fs.readFileSync(transferPath, "utf8"));

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

for (const [slug, muscleName] of Object.entries(muscleNames)) {
  const collection = transfer[slug] || { pages: [], exercises: [] };
  const records = (collection.exercises || []).map((record) => ({
    name: record.name,
    sourceUrl: record.sourceUrl,
    difficulty: record.difficulty || "",
    cardText: record.cardText || "",
    media: Array.isArray(record.media) ? record.media : [],
  }));
  const pages = (collection.pages || []).map((page, index) => ({
    number: index + 1,
    url: page.sourcePage || `https://musclewiki.com/exercises/${slug}/yoga${index ? `/${index + 1}` : ""}`,
    found: Array.isArray(page.exercises) ? page.exercises.length : 0,
  }));
  const candidates = records.map(({ name, sourceUrl, difficulty, cardText, media }) => ({
    name,
    sourceUrl,
    cardText,
    difficulty,
    media,
  }));
  const source = `https://musclewiki.com/exercises/${slug}/yoga`;
  const baseName = `musclewiki-${slug}-yoga`;

  writeJson(path.join(dataDir, `${baseName}.json`), records);
  writeJson(path.join(dataDir, `${baseName}.checkpoint.json`), {
    version: 1,
    source,
    status: "complete",
    listingDone: true,
    nextPageUrl: null,
    pages,
    candidates,
    records: [],
    processedDetailUrls: [],
    error: null,
    verification: {
      pages: pages.length,
      cards: pages.reduce((total, page) => total + page.found, 0),
      candidates: records.length,
      videos: records.reduce((total, record) => total + record.media.filter((item) => item?.type === "video").length, 0),
    },
  });

  console.log(JSON.stringify({ slug, muscleName, pages: pages.length, cards: pages.reduce((total, page) => total + page.found, 0), candidates: records.length }));
}
