import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const dataDir = path.join(projectRoot, "scripts", "migration", "data");
const slugs = [
  "abdominals", "biceps", "calves", "chest", "forearms", "front-shoulders",
  "glutes", "hamstrings", "lats", "lowerback", "obliques", "quads",
  "rear-shoulders", "traps", "traps-middle", "triceps",
];

const bySourceUrl = new Map();
for (const slug of slugs) {
  const filePath = path.join(dataDir, `musclewiki-${slug}-medicine-ball-import.json`);
  const dataset = JSON.parse(fs.readFileSync(filePath, "utf8"));
  for (const record of dataset.results || []) {
    const existing = bySourceUrl.get(record.source_url);
    if (!existing) {
      bySourceUrl.set(record.source_url, {
        ...record,
        primary_muscles: [...new Set(record.primary_muscles || [])],
      });
      continue;
    }
    existing.primary_muscles = [...new Set([
      ...(existing.primary_muscles || []),
      ...(record.primary_muscles || []),
    ])];
  }
}

const results = [...bySourceUrl.values()];
const output = { total: results.length, limit: results.length, offset: 0, count: results.length, results };
const outputPath = path.join(dataDir, "musclewiki-medicine-ball-import.json");
fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
console.log(JSON.stringify({
  outputPath,
  exercises: results.length,
  videos: results.reduce((total, record) => total + (record.videos || []).length, 0),
  withSteps: results.filter((record) => (record.steps || []).length > 0).length,
}, null, 2));
