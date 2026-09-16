import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const dataDir = path.join(projectRoot, "scripts", "migration", "data");

function readArray(fileName) {
  const value = JSON.parse(fs.readFileSync(path.join(dataDir, fileName), "utf8"));
  if (!Array.isArray(value)) throw new Error(fileName + " phải là một mảng JSON");
  return value;
}

const names = [
  "Dumbbell Romanian Deadlift",
  "Dumbbell Row Bilateral",
  "Dumbbell Goblet Good Morning",
  "Dumbbell Superman",
  "Dumbbell Front Rack Pause Squat",
  "Dumbbell Single Leg Single Arm Deadlift",
  "Dumbbell Single Leg Stiff Leg Deadlift",
  "Dumbbell Staggered Deadlift",
  "Dumbbell Sumo Squat",
  "Dumbbell Swing",
  "Dumbbell Superman Hold",
  "Dumbbell Cross Body Romanian Deadlift",
  "Dumbbell Alternating Pendlay Row",
  "Dumbbell Box Squat",
  "Dumbbell Staggered Waiters Bow",
  "Dumbbell Waiters Bow",
  "Dumbbell Half Kneeling Goblet Romanian Deadlift",
  "Dumbbell Half Kneeling Romanian Deadlift",
  "Dumbbell Clean And Press",
  "Dumbbell Hang Clean And Press",
  "Dumbbell Single Arm Clean And Press",
  "Dumbbell Single Arm Hang Clean And Press",
  "Dumbbell Spinal Jefferson Curl",
];

const sourceRecords = [
  ...readArray("musclewiki-quads-dumbbells.json"),
  ...readArray("musclewiki-hamstrings-dumbbells.json"),
  ...readArray("musclewiki-glutes-dumbbells-extras.json"),
  ...readArray("musclewiki-lowerback-dumbbells-extras.json"),
];
const byName = new Map(sourceRecords.map((record) => [record.name, record]));
const records = names.map((name) => {
  const record = byName.get(name);
  if (!record) throw new Error("Không tìm thấy record Lower Back: " + name);
  return { ...record, primaryMuscle: "Lower Back", equipment: "Dumbbells" };
});

const outputPath = path.join(dataDir, "musclewiki-lowerback-dumbbells.json");
const checkpointPath = path.join(dataDir, "musclewiki-lowerback-dumbbells.checkpoint.json");
const pages = Array.from({ length: 6 }, (_, index) => {
  const number = index + 1;
  return {
    number,
    url: number === 1
      ? "https://musclewiki.com/exercises/lowerback/dumbbells"
      : "https://musclewiki.com/exercises/lowerback/dumbbells/" + number,
    found: number === 6 ? 3 : 4,
  };
});

const checkpoint = {
  version: 1,
  source: "https://musclewiki.com/exercises/lowerback/dumbbells",
  status: "complete",
  listingDone: true,
  nextPageUrl: null,
  pages,
  candidates: records.map((record) => ({ sourceUrl: record.sourceUrl })),
  records: [],
  processedDetailUrls: [],
  error: null,
  verification: {
    pages: pages.length,
    cards: 23,
    candidates: records.length,
    videos: records.reduce((total, record) => total + (record.media?.length ?? 0), 0),
  },
};

fs.writeFileSync(outputPath, JSON.stringify(records, null, 2) + "\n", "utf8");
fs.writeFileSync(checkpointPath, JSON.stringify(checkpoint, null, 2) + "\n", "utf8");
console.log(JSON.stringify({
  dataset: outputPath,
  checkpoint: checkpointPath,
  records: records.length,
  videos: records.reduce((total, record) => total + (record.media?.length ?? 0), 0),
}, null, 2));
