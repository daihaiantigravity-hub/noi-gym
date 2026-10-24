import assert from "node:assert/strict";
import fs from "node:fs";
import { createHash } from "node:crypto";
import test from "node:test";
import { extractNumberedCardSteps } from "../scripts/migration/dom-instructions.mjs";
import { getExerciseContentHash, getSourceLocale, validateExerciseTranslation } from "../lib/exercises/translation-content.mjs";
import { getExerciseSourceIssues } from "../lib/exercises/source-quality.mjs";

const manifest = JSON.parse(fs.readFileSync(new URL("../scripts/localization/data/source-restorations-001.json", import.meta.url), "utf8"));
const prepared = JSON.parse(fs.readFileSync(new URL("../scripts/localization/data/prepared-translations-035.json", import.meta.url), "utf8"));
const clean = (value) => String(value ?? "").replace(/\u00a0/g, " ").replace(/[ \t]+/g, " ").trim();
const legacySteps = (text) => [...new Set([...clean(text).matchAll(/(?:^|\s)\d+[.)]?\s+(.+?)(?=\s+\d+[.)]?\s+|$)/g)].map((match) => clean(match[1]).replace(/\s+Remove Ads(?:\s+Remove Ads)*$/i, "")).filter(Boolean))];

test("each proposed source repair has exact captured DOM provenance and reproduces the conversion defect", () => {
  assert.equal(manifest.reviewStatus, "reviewed");
  assert.equal(manifest.restorations.length, 40);
  assert.equal(new Set(manifest.restorations.map((row) => row.exercise_id)).size, 40);
  const documents = new Map();
  for (const row of manifest.restorations) {
    const evidence = row.evidence;
    if (!documents.has(evidence.file)) documents.set(evidence.file, JSON.parse(fs.readFileSync(new URL(`../${evidence.file}`, import.meta.url), "utf8")));
    let captured = documents.get(evidence.file);
    for (const key of evidence.pointer.split("/").slice(1)) captured = captured[key];
    assert.equal(captured.name, row.before.name);
    assert.equal(captured.cardText, evidence.card_text);
    assert.equal(captured.sourceUrl, evidence.source_url);
    assert.equal(createHash("sha256").update(evidence.card_text).digest("hex"), evidence.card_text_sha256);
    assert.equal(Number.parseInt(createHash("sha256").update(evidence.source_url).digest("hex").slice(0, 12), 16) + 1, row.source_id);
    assert.deepEqual(legacySteps(evidence.card_text), row.before.steps, row.exercise_id);
    assert.deepEqual(extractNumberedCardSteps(evidence.card_text), row.after.steps, row.exercise_id);
  }
});

test("source repair restores only numeric text and step boundaries while retaining names and descriptions", () => {
  const words = (steps) => steps.join(" ").replace(/\d+/g, "").replace(/\s+/g, " ").trim();
  for (const row of manifest.restorations) {
    assert.equal(row.before.name, row.after.name);
    assert.equal(row.before.description, row.after.description);
    assert.equal(words(row.before.steps), words(row.after.steps), row.exercise_id);
    assert.equal(getExerciseContentHash(row.before), row.before_hash);
    assert.equal(getExerciseContentHash(row.after), row.after_hash);
    assert.notEqual(row.before_hash, row.after_hash);
    assert.ok(getExerciseSourceIssues(row.before).length);
    assert.deepEqual(getExerciseSourceIssues(row.after), []);
    assert.ok(Number.isFinite(Date.parse(row.expected_updated_at)));
  }
});

test("prepared translations use corrected hashes, preserve every number and keep unresolved variants held", () => {
  const repairs = new Map(manifest.restorations.map((row) => [row.exercise_id, row]));
  const numbers = (steps) => steps.flatMap((step) => step.match(/\d+(?:[.,]\d+)?/g) ?? []);
  assert.equal(prepared.translations.length, 38);
  assert.equal(prepared.sourceExceptions.length, 2);
  for (const row of prepared.translations) {
    const repair = repairs.get(row.exercise_id);
    assert.equal(repair.translation_decision, "ready");
    assert.deepEqual(row.source, repair.after);
    assert.equal(row.source_hash, repair.after_hash);
    assert.deepEqual(validateExerciseTranslation(row, { id: row.exercise_id, ...repair.after }), []);
    assert.equal(getSourceLocale(row), "vi");
    assert.deepEqual(numbers(row.steps), numbers(repair.after.steps));
    for (let index = 0; index < row.steps.length; index++) {
      if (/\bright\b/i.test(repair.after.steps[index])) assert.match(row.steps[index], /phải/i);
      if (/\bleft\b/i.test(repair.after.steps[index])) assert.match(row.steps[index], /trái/i);
    }
  }
  for (const held of prepared.sourceExceptions) {
    assert.equal(repairs.get(held.exercise_id).translation_decision, "held");
    assert.equal(prepared.translations.some((row) => row.exercise_id === held.exercise_id), false);
  }
});

test("the SQL transaction payload exactly matches the reviewed repairs and prepared translations", () => {
  const sql = fs.readFileSync(new URL("../supabase/repairs/20261023_restore_numeric_exercise_steps.sql", import.meta.url), "utf8");
  const payload = (tag) => JSON.parse(sql.split(`$${tag}$`)[1]);
  assert.deepEqual(payload("noi_gym_sources"), manifest.restorations.map((row) => ({
    exercise_id: row.exercise_id, source_id: row.source_id, before_hash: row.before_hash, after_hash: row.after_hash,
    expected_updated_at: row.expected_updated_at, steps: row.after.steps,
  })));
  assert.deepEqual(payload("noi_gym_translations"), prepared.translations.map((row) => Object.fromEntries(Object.entries(row).filter(([key]) => key !== "source"))));
});
