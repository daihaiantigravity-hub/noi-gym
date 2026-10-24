import fs from "node:fs";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { createLocalizationClient, readExerciseSources, readOption } from "./common.mjs";
import { getExerciseContentHash, getSourceLocale, validateExerciseTranslation } from "../../lib/exercises/translation-content.mjs";
import { getExerciseSourceIssues } from "../../lib/exercises/source-quality.mjs";

// No database writes. Finalize the local reviewed manifest only after every live check passes.
const args = process.argv.slice(2);
const beforePath = readOption(args, "--before", "artifacts/localization/stage-8-before.json");
const repairsPath = readOption(args, "--repairs", "scripts/localization/data/source-restorations-001.json");
const preparedPath = readOption(args, "--translations", "scripts/localization/data/prepared-translations-035.json");
const output = readOption(args, "--reviewed-output", "scripts/localization/data/reviewed-translations-035.json");
const reportOutput = readOption(args, "--report-output", "artifacts/localization/stage-8-restoration-after.json");
assert.notEqual(output, preparedPath, "Prepared evidence must not be overwritten");
const before = JSON.parse(fs.readFileSync(beforePath, "utf8"));
const repairs = JSON.parse(fs.readFileSync(repairsPath, "utf8")).restorations;
const prepared = JSON.parse(fs.readFileSync(preparedPath, "utf8"));
assert.ok(repairs.length && prepared.translations.length, "Empty repair scope");
assert.equal(new Set(repairs.map(row => row.exercise_id)).size, repairs.length);
assert.equal(new Set(prepared.translations.map(row => `${row.exercise_id}:${row.locale}`)).size, prepared.translations.length);
for (const row of prepared.translations) assert.ok(repairs.some(repair => repair.exercise_id === row.exercise_id), "Translation outside repair scope");
const client = createLocalizationClient();
const allTranslations = async (db) => {
  const rows = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await db.from("exercise_translations").select("*").order("exercise_id").order("locale").range(offset, offset + 499);
    if (error) throw new Error(`Unable to read translations (${error.code})`);
    rows.push(...data);
    if (data.length < 500) return rows;
  }
};
const count = async (table) => {
  const { count, error } = await client.from(table).select("*", { count: "exact", head: true });
  if (error) throw new Error(`Unable to count ${table} (${error.code})`);
  return count;
};
const [sources, actualTranslations, personal, featured] = await Promise.all([
  readExerciseSources(client), allTranslations(client), count("user_favorite_exercises"), count("admin_featured_exercises"),
]);
const changes = new Map(repairs.map((row) => [row.exercise_id, row]));
const currentSources = new Map(sources.map((row) => [row.id, row]));
for (const row of repairs) {
  const source = currentSources.get(row.exercise_id);
  assert.equal(getExerciseContentHash(source), row.after_hash, `Restoration not applied or source changed: ${row.exercise_id}`);
  assert.equal(source.updated_at, row.expected_updated_at, `Ranking timestamp changed: ${row.exercise_id}`);
}
const expectedSources = before.sources.map((source) => changes.has(source.id) ? { ...source, steps: changes.get(source.id).after.steps } : source);
const hash = (value) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
assert.equal(hash(sources), hash(expectedSources), "Unexpected source, media, category or timestamp change");
assert.equal(personal, before.counts.user_favorite_exercises);
assert.equal(featured, before.counts.admin_featured_exercises);
const actual = new Map(actualTranslations.map((row) => [`${row.exercise_id}:${row.locale}`, row]));
for (const row of before.translations) assert.deepEqual(actual.get(`${row.exercise_id}:${row.locale}`), row, `Existing translation changed: ${row.exercise_id}`);
for (const row of prepared.translations) {
  const stored = actual.get(`${row.exercise_id}:${row.locale}`);
  assert.ok(stored, `Missing prepared translation: ${row.exercise_id}`);
  for (const key of ["name", "description", "steps", "locale", "source_locale", "source_hash", "translation_status"]) assert.deepEqual(stored[key], row[key], `${row.exercise_id}: ${key}`);
  assert.equal(Date.parse(stored.reviewed_at), Date.parse(row.reviewed_at));
  assert.deepEqual(validateExerciseTranslation(stored, currentSources.get(row.exercise_id)), []);
}
assert.equal(actualTranslations.length, before.translations.length + prepared.translations.length);
const anonymous = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
  global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(30000) }) },
});
const publicRows = await allTranslations(anonymous);
assert.equal(publicRows.length, actualTranslations.length);
for (const row of publicRows) {
  assert.equal(row.translation_status, "reviewed");
  assert.equal(row.source_hash, getExerciseContentHash(currentSources.get(row.exercise_id)));
}
const viIds = new Set([...actualTranslations.filter((row) => row.locale === "vi").map((row) => row.exercise_id), ...sources.filter((row) => getSourceLocale(row) === "vi").map((row) => row.id)]);
const report = {
  verifiedAt: new Date().toISOString(), sourceRepairs: repairs.length, addedVietnamese: prepared.translations.length,
  reviewed: actualTranslations.length, vietnameseContent: viIds.size, remainingVietnamese: sources.length - viIds.size,
  sourceHashBefore: before.sourceHash, expectedSourceHashAfter: hash(expectedSources), sourceHashAfter: hash(sources),
  sourceWarnings: sources.filter((row) => getExerciseSourceIssues(row).length).length,
  counts: { user_favorite_exercises: personal, admin_featured_exercises: featured }, anonymousReviewed: publicRows.length,
};
if (fs.existsSync(output)) {
  assert.deepEqual(JSON.parse(fs.readFileSync(output, "utf8")).translations, prepared.translations);
} else {
  fs.writeFileSync(output, JSON.stringify({
    ...prepared,
    preparationReviewMethod: prepared.reviewMethod,
    reviewMethod: `Reviewed against the corrected source blocks and evidence in ${repairsPath}; source corrections and translations verified against the live database before finalizing this manifest.`,
    databaseVerifiedAt: report.verifiedAt,
  }, null, 2) + "\n", { flag: "wx" });
}
fs.writeFileSync(reportOutput, JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify(report, null, 2));
