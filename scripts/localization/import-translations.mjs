import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { validateExerciseTranslation } from "../../lib/exercises/translation-content.mjs";
import { createLocalizationClient, readExerciseSources, readOption } from "./common.mjs";

const args = process.argv.slice(2);
const inputPath = readOption(args, "--input", "");
if (!inputPath) throw new Error("Usage: npm run localization:import -- --input <json> --dry-run | --apply");
if (args.includes("--dry-run") && args.includes("--apply")) throw new Error("Choose --dry-run or --apply");
// Writes require an explicit --apply; omitting both flags is a dry run.
const apply = args.includes("--apply");
const input = fs.readFileSync(inputPath, "utf8");
const payload = JSON.parse(input);
if (payload.version !== 1 || !Array.isArray(payload.translations) || payload.translations.length === 0) throw new Error("Expected version: 1 and a nonempty translations array");
const client = createLocalizationClient();
const sources = new Map((await readExerciseSources(client)).map((row) => [row.id, row]));
const errors = [];
const keys = new Set();
const rows = payload.translations.map((item) => {
  const key = `${item.exercise_id}:${item.locale}`;
  if (keys.has(key)) errors.push({ key, error: "Duplicate translation in input" });
  keys.add(key);
  const source = sources.get(item.exercise_id);
  if (!source) errors.push({ key, error: "Source exercise not found" });
  else for (const error of validateExerciseTranslation(item, source)) errors.push({ key, error });
  return {
    exercise_id: item.exercise_id, locale: item.locale, name: item.name,
    description: item.description, steps: item.steps, source_locale: item.source_locale,
    source_hash: item.source_hash, translation_status: item.translation_status,
    reviewed_at: item.translation_status === "reviewed" ? item.reviewed_at : null,
  };
});
const toWrite = [];
let unchanged = 0;
let tableMissing = false;
for (let offset = 0; offset < rows.length && errors.length === 0; offset += 50) {
  const batch = rows.slice(offset, offset + 50);
  const { data, error } = await client.from("exercise_translations")
    .select("exercise_id,locale,name,description,steps,source_locale,source_hash,translation_status,reviewed_at,updated_at")
    .in("exercise_id", [...new Set(batch.map((row) => row.exercise_id))]);
  if (error) {
    if (["42P01", "PGRST205"].includes(error.code)) { tableMissing = true; toWrite.push(...batch.map((row) => ({ row, expectedUpdatedAt: null }))); continue; }
    throw new Error(`Unable to inspect existing translations (${error.code ?? "unknown"})`);
  }
  const existing = new Map((data ?? []).map((item) => [`${item.exercise_id}:${item.locale}`, item]));
  for (const row of batch) {
    const previous = existing.get(`${row.exercise_id}:${row.locale}`);
    const same = previous && Object.keys(row).every((key) => key === "reviewed_at"
      ? (previous[key] === null && row[key] === null) || Date.parse(previous[key]) === Date.parse(row[key])
      : JSON.stringify(previous[key]) === JSON.stringify(row[key]));
    if (same) { unchanged++; continue; }
    if (previous?.translation_status === "reviewed" && !args.includes("--replace-reviewed")) errors.push({ key: `${row.exercise_id}:${row.locale}`, error: "Refusing to overwrite a reviewed translation; use --replace-reviewed after review" });
    toWrite.push({ row, expectedUpdatedAt: previous?.updated_at ?? null });
  }
}
const summary = { mode: apply ? "apply" : "dry-run", inputRows: rows.length, unchanged, pendingWrites: toWrite.length, migrationRequired: tableMissing, errors };
if (errors.length || (apply && tableMissing)) {
  console.log(JSON.stringify(summary, null, 2));
  process.exitCode = 1;
} else if (!apply) {
  console.log(JSON.stringify(summary, null, 2));
} else {
  const checkpointPath = path.resolve(readOption(args, "--checkpoint", `artifacts/localization/import-${createHash("sha256").update(input).digest("hex").slice(0, 16)}.json`));
  fs.mkdirSync(path.dirname(checkpointPath), { recursive: true });
  let written = 0;
  const saveCheckpoint = (completed = false) => fs.writeFileSync(checkpointPath, `${JSON.stringify({
    inputHash: createHash("sha256").update(input).digest("hex"), updatedAt: new Date().toISOString(),
    completedAt: completed ? new Date().toISOString() : null, written, unchanged, total: rows.length,
  }, null, 2)}\n`);
  for (let offset = 0; offset < toWrite.length; offset += 50) {
    const batch = toWrite.slice(offset, offset + 50);
    for (const { row, expectedUpdatedAt } of batch) {
      // Protect edits and approvals made in admin after the preflight read.
      const query = expectedUpdatedAt === null
        ? client.from("exercise_translations").insert(row)
        : client.from("exercise_translations").update(row).eq("exercise_id", row.exercise_id).eq("locale", row.locale).eq("updated_at", expectedUpdatedAt);
      const { data, error } = await query.select("updated_at").maybeSingle();
      if (error || !data) {
        saveCheckpoint();
        throw new Error(`Translation write stopped (${error?.code ?? "revision_conflict"}); ${written} rows completed. Recheck current translations and rerun the input to resume.`);
      }
      written++;
    }
    saveCheckpoint();
  }
  saveCheckpoint(true);
  console.log(JSON.stringify({ ...summary, written, checkpoint: path.relative(process.cwd(), checkpointPath) }, null, 2));
}
