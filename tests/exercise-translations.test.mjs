import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { applyExerciseTranslation, getExerciseContentHash, getSourceLocale, validateExerciseTranslation } from "../lib/exercises/translation-content.mjs";

const source = {
  id: "d809b6a7-3d91-41fe-802c-d480d52309d7",
  name: "Barbell Bench Press",
  description: "",
  steps: ["Lie on the bench.", "Press the bar upward."],
  category: "Barbell",
  media: [{ gender: "male", videoUrl: "https://example.test/demo.mp4" }],
};
const translation = (extra = {}) => ({
  exercise_id: source.id, locale: "vi", source_locale: "en",
  source_hash: getExerciseContentHash(source),
  name: "Đẩy tạ đòn trên ghế phẳng", description: "",
  steps: ["Nằm trên ghế tập.", "Đẩy thanh tạ lên."],
  translation_status: "reviewed", reviewed_at: "2026-10-22T10:00:00.000Z",
  ...extra,
});

test("content hashing ignores unrelated exercise and media updates", () => {
  assert.equal(getExerciseContentHash(source), getExerciseContentHash({ ...source, category: "Other", updatedAt: "new", media: [] }));
});

test("each text field and instruction order affect the source hash", () => {
  for (const changed of [{ name: "Other" }, { description: "New description" }, { steps: [...source.steps].reverse() }]) {
    assert.notEqual(getExerciseContentHash(source), getExerciseContentHash({ ...source, ...changed }));
  }
});

test("length-prefixed Unicode hashing avoids delimiter and field-boundary collisions", () => {
  const a = { name: "a", description: "bc", steps: ["Đẩy: tạ\n"] };
  const b = { name: "ab", description: "c", steps: ["Đẩy: tạ\n"] };
  assert.notEqual(getExerciseContentHash(a), getExerciseContentHash(b));
  assert.equal(getExerciseContentHash(a).length, 64);
  assert.equal(getExerciseContentHash(a), getExerciseContentHash({ ...a }));
});

test("a current reviewed translation replaces only text, preserving IDs, media and canonical filters", () => {
  const row = translation();
  const result = applyExerciseTranslation(source, row, "vi");
  assert.equal(result.name, row.name);
  assert.deepEqual(result.steps, row.steps);
  assert.equal(result.id, source.id);
  assert.equal(result.media, source.media);
  assert.equal(result.category, "Barbell");
  assert.equal(source.name, "Barbell Bench Press");
  assert.notEqual(result.steps, row.steps);
});

test("draft, stale, wrong-locale and wrong-ID translations fall back as one content block", () => {
  for (const row of [undefined, translation({ translation_status: "draft" }), translation({ translation_status: "stale" }), translation({ locale: "en" }), translation({ exercise_id: "other-id" })]) {
    assert.equal(applyExerciseTranslation(source, row, "vi"), source);
  }
});

test("changed source cannot use a translation with an old hash", () => {
  const changed = { ...source, steps: [...source.steps, "Lower under control."] };
  assert.equal(applyExerciseTranslation(changed, translation(), "vi"), changed);
  assert.match(validateExerciseTranslation(translation(), changed).join(" "), /Source content changed/);
});

test("reviewed content must preserve the number of source steps", () => {
  const row = translation({ steps: ["Nằm trên ghế tập."] });
  assert.match(validateExerciseTranslation(row, source).join(" "), /step count/);
  assert.equal(applyExerciseTranslation(source, row, "vi"), source);
});

test("a missing source instruction cannot be covered up by a reviewed translation", () => {
  const noInstructions = { ...source, steps: [] };
  const row = translation({ source_hash: getExerciseContentHash(noInstructions), steps: [] });
  assert.ok(validateExerciseTranslation(row, noInstructions).length > 0);
});

test("blank, malformed, unsupported and unreviewed inputs fail validation", () => {
  for (const change of [{ name: " " }, { description: 5 }, { steps: [""] }, { steps: [42] }, { locale: "fr" }, { source_locale: "fr" }, { translation_status: "published" }, { reviewed_at: null }, { reviewed_at: "invalid" }]) {
    assert.ok(validateExerciseTranslation(translation(change), source).length > 0, JSON.stringify(change));
  }
});

test("a source description requires a nonempty translated description", () => {
  const withDescription = { ...source, description: "An example description" };
  const row = translation({ source_hash: getExerciseContentHash(withDescription) });
  assert.match(validateExerciseTranslation(row, withDescription).join(" "), /description needs a translation/);
});

test("Vietnamese source exercises can have an English translation without changing the original", () => {
  const vietnamese = { ...source, name: "Đẩy tạ", steps: ["Nằm trên ghế tập."] };
  const row = translation({ locale: "en", source_locale: "vi", source_hash: getExerciseContentHash(vietnamese), name: "Bench press", steps: ["Lie on the bench."] });
  assert.equal(getSourceLocale(vietnamese), "vi");
  assert.equal(applyExerciseTranslation(vietnamese, row, "en").name, "Bench press");
  assert.equal(vietnamese.name, "Đẩy tạ");
});

const messagesSource = readFileSync(new URL("../lib/i18n/messages.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(messagesSource, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } });
const messages = {};
vm.runInNewContext(compiled.outputText, { exports: messages });

test("interface dictionaries have identical keys and interpolation variables", () => {
  const english = messages.getMessages("en");
  const vietnamese = messages.getMessages("vi");
  assert.deepEqual(Object.keys(english).sort(), Object.keys(vietnamese).sort());
  for (const key of Object.keys(english)) {
    assert.deepEqual([...english[key].matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort(), [...vietnamese[key].matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort(), key);
  }
});

test("localized labels preserve variable values and select the expected Intl locale", () => {
  assert.equal(messages.translate("vi", "viewDetails", { name: "A $& B" }), "Xem chi tiết A $& B");
  assert.equal(messages.translate("en", "exerciseCount", { count: 10 }), "10 exercises");
  assert.equal(messages.getIntlLocale("vi"), "vi-VN");
  assert.equal(messages.getIntlLocale("en"), "en-US");
});

test("all 30 pilot translations preserve their captured source and remain drafts", () => {
  const pilot = JSON.parse(readFileSync(new URL("../scripts/localization/data/pilot-translations.json", import.meta.url), "utf8"));
  assert.equal(pilot.translations.length, 30);
  assert.equal(new Set(pilot.translations.map((row) => `${row.exercise_id}:${row.locale}`)).size, 30);
  for (const row of pilot.translations) {
    assert.equal(row.translation_status, "draft");
    assert.equal(row.reviewed_at, null);
    const captured = { ...row.source, id: row.exercise_id };
    assert.deepEqual(validateExerciseTranslation(row, captured), []);
    assert.deepEqual(validateExerciseTranslation({ ...row, translation_status: "reviewed", reviewed_at: "2026-10-22T10:00:00.000Z" }, captured), []);
  }
});

test("dates and numbers use the selected locale", () => {
  assert.equal(messages.formatNumber("en", 1946), "1,946");
  assert.equal(messages.formatNumber("vi", 1946), "1.946");
  assert.equal(messages.formatDate("en", "2026-07-04T12:00:00Z", { timeZone: "UTC" }), "07/04/2026");
  assert.equal(messages.formatDate("vi", "2026-07-04T12:00:00Z", { timeZone: "UTC" }), "04/07/2026");
});

const labelsModule = ts.transpileModule(readFileSync(new URL("../lib/i18n/labels.ts", import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS } });
const labels = {};
vm.runInNewContext(labelsModule.outputText, { exports: labels });

test("labels distinguish muscle, body view and difficulty contexts without changing canonical values", () => {
  assert.equal(labels.getMuscleLabel("vi", "Back"), "Lưng");
  assert.equal(labels.getExerciseLabel("vi", "Back"), "Sau");
  assert.equal(labels.getDifficultyLabel("vi", "Advanced"), "Nâng cao");
  assert.equal(labels.getExerciseLabel("vi", "Advanced"), "Chi tiết");
  assert.equal(labels.getExerciseLabel("en", "Smith Machine"), "Smith Machine");
  assert.equal(labels.getExerciseLabel("vi", "TRX"), "Dây TRX");
  assert.equal(labels.getExerciseLabel("vi", "Unknown custom label"), "Unknown custom label");
});
