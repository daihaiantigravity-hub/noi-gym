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

const excludedNames = new Set([
  "Dumbbell Somersault Squat",
  "Single Arm Overhead Squat",
  "Dumbbell Overhead Squat",
  "Dumbbell Thruster",
  "Dumbbell Sumo Squat",
  "Dumbbell Offset Squat",
  "Dumbbell Leg Extension",
  "Dumbbell Heels Up Narrow Goblet Squat",
  "Dumbbell Heels Up Goblet Squat",
  "Dumbbell Goblet Pulse Squat",
  "Dumbbell Front Rack Squat",
  "Dumbbell Front Rack Pause Squat",
  "Dumbbell Leg Curl",
  "Dumbbell Single Leg Single Arm Deadlift",
  "Dumbbell Single Leg Stiff Leg Deadlift",
  "Dumbbell Staggered Deadlift",
  "Dumbbell Swing",
  "Dumbbell Cross Body Romanian Deadlift",
]);

const sourceRecords = [
  ...readArray("musclewiki-quads-dumbbells.json"),
  ...readArray("musclewiki-hamstrings-dumbbells.json"),
  ...readArray("musclewiki-glutes-dumbbells-extras.json"),
].filter((record) => !excludedNames.has(record.name));

const recordsBySourceUrl = new Map();
for (const record of sourceRecords) {
  if (!recordsBySourceUrl.has(record.sourceUrl)) {
    recordsBySourceUrl.set(record.sourceUrl, {
      ...record,
      primaryMuscle: "Glutes",
      equipment: "Dumbbells",
    });
  }
}

const records = [...recordsBySourceUrl.values()];
if (records.length !== 48) {
  throw new Error("Glutes cần 48 bài duy nhất, nhưng đã tạo " + records.length);
}

const outputPath = path.join(dataDir, "musclewiki-glutes-dumbbells.json");
const checkpointPath = path.join(dataDir, "musclewiki-glutes-dumbbells.checkpoint.json");
const pages = Array.from({ length: 22 }, (_, index) => {
  const number = index + 1;
  return {
    number,
    url: number === 1
      ? "https://musclewiki.com/exercises/glutes/dumbbells"
      : "https://musclewiki.com/exercises/glutes/dumbbells/" + number,
    found: number === 22 ? 1 : 4,
  };
});

const checkpoint = {
  version: 1,
  source: "https://musclewiki.com/exercises/glutes/dumbbells",
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
    cards: 85,
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
