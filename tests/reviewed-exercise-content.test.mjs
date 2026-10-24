import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { getExerciseContentHash, getSourceLocale, validateExerciseTranslation } from "../lib/exercises/translation-content.mjs";
import { getExerciseSourceIssues } from "../lib/exercises/source-quality.mjs";
import { readReviewedContent } from "../scripts/localization/reviewed-content.mjs";

const dataDirectory = new URL("../scripts/localization/data/", import.meta.url);
const { batches, rows } = readReviewedContent();
const repairedHashes = new Map(fs.readdirSync(dataDirectory).filter((file) => /^source-restorations-\d+\.json$/.test(file)).flatMap((file) => {
  const manifest = JSON.parse(fs.readFileSync(new URL(file, dataDirectory), "utf8"));
  return manifest.reviewStatus === "reviewed" ? manifest.restorations.map((row) => [row.exercise_id, row.after_hash]) : [];
}));

test("all approved content matches its captured source hash and preserves complete instructions", () => {
  assert.deepEqual(batches.slice(0, 3).map((batch) => batch.translations.length), [30, 121, 8]);
  assert.ok(rows.length >= 159);
  for (const row of rows) {
    assert.equal(row.translation_status, "reviewed");
    assert.equal(row.source_hash, getExerciseContentHash(row.source), row.exercise_id);
    assert.deepEqual(validateExerciseTranslation(row, { ...row.source, id: row.exercise_id }), [], row.exercise_id);
    assert.equal(row.steps.length, row.source.steps.length, row.exercise_id);
    assert.deepEqual(getExerciseSourceIssues(row.source), [], row.exercise_id);
    if (row.locale === "vi") assert.equal(getSourceLocale(row), "vi", row.exercise_id);
  }
});

test("approved instructions retain numeric quantities and explicit left/right directions", () => {
  const numbers = (steps) => steps.flatMap((step) => step.match(/\d+(?:[.,]\d+)?/g) ?? []);
  for (const row of rows) {
    assert.deepEqual(numbers(row.steps), numbers(row.source.steps), row.exercise_id);
    if (row.locale !== "vi") continue;
    for (let index = 0; index < row.source.steps.length; index++) {
      const source = row.source.steps[index], translated = row.steps[index];
      // "right/sore spot" and "stand up right" do not name a body side.
      const directions = source.replace(/\bright\/sore\b|\bup right\b/gi, "");
      if (/\bright\b/i.test(directions)) assert.match(translated, /phải/i, `${row.exercise_id} step ${index + 1}`);
      if (/\bleft\b/i.test(source)) assert.match(translated, /trái/i, `${row.exercise_id} step ${index + 1}`);
    }
  }
});

test("review batches preserve exercise identities and exclude ambiguous source instructions", () => {
  const ids = new Set(rows.map((row) => row.exercise_id));
  assert.equal(ids.size, rows.length);
  assert.ok(rows.filter((row) => row.locale === "vi").length >= 158);
  assert.equal(rows.filter((row) => row.locale === "en").length, 1);
  for (const batch of batches) for (const exception of batch.sourceExceptions ?? []) {
    const approved = rows.find((row) => row.exercise_id === exception.exercise_id);
    if (approved) assert.equal(approved.source_hash, repairedHashes.get(exception.exercise_id), `Exception needs verified source repair: ${exception.exercise_id}`);
  }
  const videoRepairs = JSON.parse(fs.readFileSync(new URL("../scripts/localization/data/source-restorations-009.json", import.meta.url), "utf8")).restorations;
  for (const id of ["c96b4880-5799-4863-b84f-0c1c85cd9688", "a791dfde-e250-44eb-8465-dc8f59521061"]) {
    const approved = rows.find(row => row.exercise_id === id);
    const repair = videoRepairs.find(row => row.exercise_id === id);
    assert.ok(approved && repair, "Ambiguous source requires explicit video repair before approval");
    assert.equal(approved.source_hash, repair.after_hash);
    assert.equal(repair.after_hash, repairedHashes.get(id));
    assert.deepEqual(approved.source.steps, repair.after.steps);
    assert.equal(repair.evidence.videos.length, 4);
    assert.deepEqual(getExerciseSourceIssues(repair.after), []);
  }
  const restoredFly = rows.find(row => row.exercise_id === "379849bc-ad8a-48d3-8946-d74537ef15f2");
  if (restoredFly) {
    assert.equal(restoredFly.source_hash, repairedHashes.get(restoredFly.exercise_id));
    assert.ok(restoredFly.source.steps.length > 0, "The empty cable guide needs verified source instructions before approval");
  }
});

test("source quality checks flag missing angles and ambiguous body references without inventing a repair", () => {
  for (const steps of [
    ["Start with your elbow at a", "degree angle with your palm facing down."],
    ["Set the seat so the knees are at a", "degree angle at the starting position."],
    ["Raise your heels and hold for a", "count."],
    ["Push your hips back. Also make sure to", "Return to standing."],
    ["Stand on the band with one or", "feet depending on resistance."],
    ["The anchor point should be", "to", "inches above your head."],
    ["Place the elbow on the inside of your elbow."],
    ["Shift your weight and raise stay flat footed."],
    [],
  ]) assert.ok(getExerciseSourceIssues({ name: "Source", description: "", steps }).length);
  assert.deepEqual(getExerciseSourceIssues({ name: "Source", description: "", steps: ["Start with your elbow at a 90 degree angle.", "Return slowly to the starting position."] }), []);
});

test("translation-memory reuse matches full source blocks while retaining distinct names and IDs", () => {
  const decisions = JSON.parse(fs.readFileSync(new URL("../scripts/localization/data/memory-review-decisions-003.json", import.meta.url), "utf8"));
  const previous = batches.slice(0, 2).flatMap((batch) => batch.translations);
  for (const row of batches[2].translations) {
    assert.equal(row.name, decisions.names[row.exercise_id]);
    const match = previous.find((item) => item.locale === row.locale && item.source.description === row.source.description && JSON.stringify(item.source.steps) === JSON.stringify(row.source.steps));
    assert.ok(match, row.exercise_id);
    assert.deepEqual(row.steps, match.steps, row.exercise_id);
    assert.notEqual(row.exercise_id, match.exercise_id);
    if (row.source.name !== match.source.name) assert.notEqual(row.source_hash, match.source_hash);
    else assert.equal(row.source_hash, match.source_hash);
  }
});
