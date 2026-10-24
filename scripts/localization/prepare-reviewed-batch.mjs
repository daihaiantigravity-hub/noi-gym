import fs from "node:fs";
import { getExerciseContentHash, getSourceLocale, validateExerciseTranslation } from "../../lib/exercises/translation-content.mjs";
import { readOption } from "./common.mjs";
import { getExerciseSourceIssues } from "../../lib/exercises/source-quality.mjs";

// This command packages an explicitly reviewed text file. It never translates or writes to the database.
const args = process.argv.slice(2);
const inputPath = readOption(args, "--input", "");
const sourcePath = readOption(args, "--sources", "");
const outputPath = readOption(args, "--output", "");
if (!inputPath || !sourcePath || !outputPath) throw new Error("Required: --input <reviewed-text.json> --sources <snapshot.json> --output <new-manifest.json>");
const input = JSON.parse(fs.readFileSync(inputPath, "utf8"));
if (input.reviewStatus !== "reviewed" || !Array.isArray(input.translations) || !input.translations.length) throw new Error("Expected explicitly reviewed translations");
const snapshot = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
const sources = new Map((snapshot.sources ?? snapshot.items ?? []).map((row) => [row.id, row]));
const seen = new Set();
const reviewedAt = new Date().toISOString();
const translations = input.translations.map((text) => {
  const source = sources.get(text.exercise_id);
  if (!source || source.name !== text.sourceName || seen.has(text.exercise_id)) throw new Error(`Missing, changed or duplicate source: ${text.exercise_id}`);
  seen.add(text.exercise_id);
  const capturedSource = { name: source.name, description: source.description, steps: source.steps };
  const sourceIssues = getExerciseSourceIssues(capturedSource);
  if (sourceIssues.length) throw new Error(`Verify source before approval: ${source.id}: ${sourceIssues.join(", ")}`);
  const row = {
    exercise_id: source.id, locale: text.locale ?? "vi", source_locale: getSourceLocale(capturedSource),
    source_hash: getExerciseContentHash(capturedSource), name: text.name, description: text.description ?? "", steps: text.steps,
    translation_status: "reviewed", reviewed_at: reviewedAt, source: capturedSource,
  };
  const errors = validateExerciseTranslation(row, { id: source.id, ...capturedSource });
  if (errors.length) throw new Error(`${source.id}: ${errors.join("; ")}`);
  const numbers = (steps) => steps.flatMap((step) => step.match(/\d+(?:[.,]\d+)?/g) ?? []);
  if (JSON.stringify(numbers(source.steps)) !== JSON.stringify(numbers(row.steps))) throw new Error(`Instruction numbers changed: ${source.id}`);
  return row;
});
fs.writeFileSync(outputPath, `${JSON.stringify({
  version: 1, reviewStatus: "Reviewed against captured source; approved for public display.",
  reviewMethod: input.reviewMethod, sourceExceptions: input.sourceExceptions ?? [], translations,
}, null, 2)}\n`, { flag: "wx" });
console.log(JSON.stringify({ output: outputPath, translations: translations.length, steps: translations.reduce((sum, row) => sum + row.steps.length, 0) }));
