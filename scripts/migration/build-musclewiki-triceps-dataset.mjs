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
  "Dumbbell Bench Press",
  "Dumbbell Skullcrusher",
  "Dumbbell Seated Overhead Tricep Extension",
  "Dumbbell Decline Skullcrusher",
  "Dumbbell Rolling Tricep Extension",
  "Dumbbell Overhead Tricep Extension",
  "Dumbbell Tricep Kickback",
  "Dumbbell Single Arm Overhead Tricep Extension",
  "Dumbbell Tate Press",
  "Dumbbell Alternating Single Arm Press",
  "Dumbbell Decline Alternating Single Arm Press",
  "Dumbbell Decline Bench Press",
  "Dumbbell Decline Guillotine Bench Press",
  "Dumbbell Decline Neutral Bench Press",
  "Dumbbell Decline Single Arm Bench Press",
  "Dumbbell Decline Squeeze Press",
  "Dumbbell Guillotine Bench Press",
  "Dumbbell Guillotine Incline Bench Press",
  "Dumbbell Neutral Bench Press",
  "Dumbbell Neutral Incline Bench Press",
  "Dumbbell Neutral Seated Overhead Press",
  "Dumbbell Seated Arnold Press",
  "Dumbbell Squeeze Press",
  "Dumbbell Single Arm Press",
  "Dumbbell Alternating Arnold Press",
  "Dumbbell Alternating Overhead Press",
  "Dumbbell Neutral Alternating Overhead Press",
  "Dumbbell Neutral Overhead Press",
  "Dumbbell Overhead Press",
  "Dumbbell Push Press",
  "Dumbbell Single Arm Arnold Press",
  "Dumbbell Single Arm Neutral Overhead Press",
  "Dumbbell Single Arm Overhead Press",
  "Dumbbell Elevated Pushup",
  "Dumbbell Floor Press",
  "Dumbbell Incline Skullover",
  "Dumbbell Arnold Press",
  "Dumbbell Seated Single Arm Arnold Press",
  "Dumbbell Seated Y Press",
  "Dumbbell Weighted Dip",
  "Dumbbell Y Press",
  "Dumbbell Bench Braced Single Arm Overhead Tricep Extension",
  "Dumbbell Tricep Guillotine Press",
  "Dumbbell High Incline Skullover",
  "Dumbbell Incline Skullcrusher",
  "Dumbbell Neutral High Incline Bench Press",
  "Dumbbell Single Arm Incline Skullcrusher",
  "Dumbbell Single Arm Push Press",
  "Dumbbell Single Arm Seated Overhead Tricep Extension",
  "Dumbbell Single Arm Skullcrusher",
  "Dumbbell Larsen Press",
  "Dumbbell Single Arm Larsen Press",
  "Dumbbell Single Arm Tricep Guilotine Press",
];

const sourceRecords = [
  ...readArray("musclewiki-front-shoulders-dumbbells.json"),
  ...readArray("musclewiki-chest-dumbbells.json"),
  ...readArray("musclewiki-triceps-dumbbells-extras.json"),
];
const byName = new Map(sourceRecords.map((record) => [record.name, record]));
const records = names.map((name) => {
  const record = byName.get(name);
  if (!record) throw new Error("Không tìm thấy record Triceps: " + name);
  return { ...record, primaryMuscle: "Triceps", equipment: "Dumbbells" };
});

const outputPath = path.join(dataDir, "musclewiki-triceps-dumbbells.json");
const checkpointPath = path.join(dataDir, "musclewiki-triceps-dumbbells.checkpoint.json");
const pages = Array.from({ length: 14 }, (_, index) => {
  const number = index + 1;
  return {
    number,
    url: number === 1
      ? "https://musclewiki.com/exercises/triceps/dumbbells"
      : "https://musclewiki.com/exercises/triceps/dumbbells/" + number,
    found: number === 14 ? 1 : 4,
  };
});

const checkpoint = {
  version: 1,
  source: "https://musclewiki.com/exercises/triceps/dumbbells",
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
    cards: 53,
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
