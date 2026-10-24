import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import * as content from "../lib/exercises/translation-content.mjs";

let enabled = true;
let configured = true;
let language = "vi";
let databaseRows = [];
let databaseError = null;
const queries = [];
const client = { from(table) {
  const query = { table, filters: [],
    select(value) { this.selection = value; return this; },
    eq(key, value) { this.filters.push([key, value]); return this; },
    in(key, value) { this.ids = [key, value]; return this; },
    then(resolve) { queries.push(this); return Promise.resolve({ data: databaseRows, error: databaseError }).then(resolve); },
  };
  return query;
} };
const imports = {
  "server-only": {},
  "@/lib/admin-auth": { requireAdmin: async () => { throw new Error("Unauthorized"); } },
  "@/lib/i18n/server": { getAppLanguage: async () => language, isLocalizationEnabled: () => enabled },
  "@/lib/supabase/server": { createSupabaseServerClient: async () => client, isSupabaseConfigured: () => configured },
  "./translation-content.mjs": content,
};
const exports = {};
const compiled = ts.transpileModule(fs.readFileSync(new URL("../lib/exercises/translations.ts", import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } });
vm.runInNewContext(compiled.outputText, { exports, console: { warn() {} }, require: (name) => { assert.ok(Object.hasOwn(imports, name), name); return imports[name]; } });

const source = (suffix) => ({ id: `00000000-0000-4000-a000-${String(suffix).padStart(12, "0")}`, name: `Source ${suffix}`, description: "", steps: ["Lift the weight."], source: "musclewiki", source_id: suffix, status: "Published" });
const translated = (exercise, overrides = {}) => ({ exercise_id: exercise.id, locale: "vi", source_locale: "en", source_hash: content.getExerciseContentHash(exercise), name: "Bài tập", description: "", steps: ["Nâng tạ lên."], translation_status: "reviewed", reviewed_at: "2026-10-22T10:00:00Z", exercises: exercise, ...overrides });

test("current-page translation reads are batched and retain exercise order, IDs and media", async () => {
  const items = [source(3), source(1), source(2)].map((item) => ({ ...item, media: [{ gender: "male" }] }));
  databaseRows = [translated(items[1]), translated(items[0])];
  queries.length = 0;
  const result = await exports.localizeExercises(items);
  assert.equal(queries.length, 1);
  assert.deepEqual(result.map((item) => item.id), items.map((item) => item.id));
  assert.deepEqual(result.map((item) => item.name), ["Bài tập", "Bài tập", "Source 2"]);
  assert.equal(result[0].media, items[0].media);
  assert.equal(result[2].isTranslationFallback, true);
  assert.ok(queries[0].filters.some(([key, value]) => key === "locale" && value === "vi"));
  assert.ok(queries[0].filters.some(([key, value]) => key === "translation_status" && value === "reviewed"));
});

test("source-ID fallback uses the database translation without replacing its public identity", async () => {
  const original = source(123);
  databaseRows = [translated(original)]; queries.length = 0;
  const result = await exports.localizeExercises([{ ...original, id: "source-123" }]);
  assert.equal(result[0].id, "source-123");
  assert.equal(result[0].name, "Bài tập");
  assert.equal(queries[0].ids[0], "exercises.source_id");
  assert.deepEqual(Array.from(queries[0].ids[1]), [123]);
});

test("translation outages preserve the page and expose a source-content indication", async () => {
  databaseError = { code: "503" };
  try {
    const result = await exports.localizeExercises([source(1)]);
    assert.equal(result.length, 1); assert.equal(result[0].name, "Source 1");
    assert.equal(result[0].isTranslationFallback, true);
  } finally { databaseError = null; }
});

test("draft or outdated translations cannot replace source content even with an overprivileged client", async () => {
  const item = source(1);
  for (const row of [translated(item, { translation_status: "draft" }), translated(item, { source_hash: "0".repeat(64) })]) {
    databaseRows = [row];
    assert.equal((await exports.localizeExercises([item]))[0].name, item.name);
  }
});

test("the requested locale controls each query and cannot reuse another user's localized result", async () => {
  const item = source(1); databaseRows = [translated(item)]; queries.length = 0;
  const vietnamese = await exports.localizeExercises([item], "vi");
  const english = await exports.localizeExercises([item], "en");
  assert.equal(vietnamese[0].name, "Bài tập"); assert.equal(english[0].name, item.name);
  assert.equal(english[0].isTranslationFallback, false);
  assert.equal(queries.length, 2);
  assert.ok(queries[1].filters.some(([key, value]) => key === "locale" && value === "en"));
});

test("the disabled rollout and unconfigured local fallback do not add database requests", async () => {
  const items = [source(1)]; queries.length = 0;
  try {
    enabled = false;
    assert.equal(await exports.localizeExercises(items), items);
    enabled = true; configured = false;
    assert.equal((await exports.localizeExercises(items))[0].isTranslationFallback, true);
    assert.equal(queries.length, 0);
  } finally { enabled = true; configured = true; }
});

test("saving a translation requires server-side administrator authorization", async () => {
  await assert.rejects(() => exports.saveExerciseTranslation(translated(source(1)), null), (error) => error.code === "translationAccessDenied");
});
