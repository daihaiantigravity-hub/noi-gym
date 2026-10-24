import fs from "node:fs";
import path from "node:path";
import { getExerciseContentHash, getSourceLocale } from "../../lib/exercises/translation-content.mjs";
import { createLocalizationClient, readExerciseSources, readOption } from "./common.mjs";
import { getExerciseSourceIssues } from "../../lib/exercises/source-quality.mjs";

const args = process.argv.slice(2);
const capturedAt = new Date().toISOString();
const output = path.resolve(readOption(args, "--output", `artifacts/localization/${capturedAt.replace(/[:.]/g, "-")}`));
if (fs.existsSync(output)) throw new Error("Output directory already exists; choose a new snapshot directory");
const rows = await readExerciseSources(createLocalizationClient());
const items = rows.map((row) => ({
  id: row.id,
  source: row.source,
  sourceId: row.source_id,
  name: row.name,
  description: row.description ?? "",
  steps: row.steps ?? [],
  sourceLocale: getSourceLocale(row),
  sourceLocaleConfirmed: false,
  sourceHash: getExerciseContentHash(row),
  category: row.category,
  primaryMuscles: row.primary_muscles ?? [],
  status: row.status,
  genders: [...new Set((row.media ?? []).map((item) => item.gender))].sort(),
  updatedAt: row.updated_at,
}));
const categories = {};
const statuses = {};
const issues = [];
const contentIds = new Map();
const stepSet = new Set();
for (const item of items) {
  categories[item.category || "(uncategorized)"] = (categories[item.category || "(uncategorized)"] ?? 0) + 1;
  statuses[item.status] = (statuses[item.status] ?? 0) + 1;
  for (const type of getExerciseSourceIssues(item)) issues.push({ id: item.id, name: item.name, type });
  if (item.sourceLocale === "vi") issues.push({ id: item.id, name: item.name, type: "verify-vietnamese-source" });
  if (/^(.+?)\s+\1$/iu.test(item.name.trim())) issues.push({ id: item.id, name: item.name, type: "repeated-name" });
  contentIds.set(item.sourceHash, [...(contentIds.get(item.sourceHash) ?? []), item.id]);
  for (const step of item.steps) if (step.trim()) stepSet.add(step);
}
const report = {
  capturedAt, total: items.length, categories, statuses,
  steps: items.reduce((count, item) => count + item.steps.filter((step) => step.trim()).length, 0),
  uniqueSteps: stepSet.size,
  genders: Object.fromEntries(["male", "female"].map((gender) => [gender, items.filter((item) => item.genders.includes(gender)).length])),
  issues,
  identicalContentGroups: [...contentIds.values()].filter((ids) => ids.length > 1),
  translationBatchSize: 50,
  translationBatches: Math.ceil(items.length / 50),
};
fs.mkdirSync(path.join(output, "batches"), { recursive: true });
const write = (file, value) => fs.writeFileSync(path.join(output, file), `${JSON.stringify(value, null, 2)}\n`, "utf8");
write("inventory.json", { version: 1, capturedAt, items });
write("report.json", report);
const ordered = [...items].sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
for (let offset = 0; offset < ordered.length; offset += 50) {
  const number = String(offset / 50 + 1).padStart(3, "0");
  write(`batches/batch-${number}-source.json`, { version: 1, capturedAt, items: ordered.slice(offset, offset + 50) });
}
console.log(JSON.stringify({ output: path.relative(process.cwd(), output), total: report.total, steps: report.steps, batches: report.translationBatches, issues: report.issues.length }, null, 2));
