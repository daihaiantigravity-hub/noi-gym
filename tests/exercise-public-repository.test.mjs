import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import vm from "node:vm";
import { AsyncLocalStorage } from "node:async_hooks";
import ts from "typescript";
import * as translationContent from "../lib/exercises/translation-content.mjs";

function loadModule(path, imports) {
  const exports = {};
  const source = fs.readFileSync(new URL(path, import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } });
  vm.runInNewContext(compiled.outputText, { exports, console, process: { env: {} }, require(name) {
    assert.ok(Object.hasOwn(imports, name), `Unexpected import ${name}`);
    return imports[name];
  } });
  return exports;
}

const constants = loadModule("../lib/exercises/constants.ts", {});
const categoryOrder = loadModule("../lib/exercises/category-order.ts", { "./constants": constants });
const ranking = loadModule("../lib/exercises/ranking.ts", { "./category-order": categoryOrder });
const plain = (value) => JSON.parse(JSON.stringify(value));
const exercise = (number, overrides = {}) => ({
  id: `00000000-0000-4000-a000-${String(number).padStart(12, "0")}`,
  source: "manual", source_id: null, name: `Exercise ${number}`, slug: `exercise-${number}`, description: "Description",
  primary_muscles: ["Chest"], category: "Barbell", force: "", grips: "", mechanic: "", difficulty: "Beginner", status: "Published",
  steps: ["Lift."], media: [{ gender: "male", angle: "front", videoUrl: `https://media.test/${number}.mp4`, posterUrl: `https://media.test/${number}.webp` }],
  source_snapshot: null, created_at: "2026-10-01T00:00:00Z", updated_at: "2026-10-01T00:00:00Z", ...overrides,
});

function setup(rows = Array.from({ length: 12 }, (_, index) => exercise(index + 1))) {
  const state = { configured: true, service: true, cacheEnabled: true, language: "en", queries: [], caches: [], invalidations: 0, nestedCacheReads: 0, errors: {}, beforeRead: null, localSupplement: null,
    tables: { exercises: rows, exercise_favorite_stats: [], admin_featured_exercises: [], exercise_targets: [], user_favorite_exercises: [] } };
  const client = { from(table) {
    const query = { table, predicates: [], ordering: [], start: 0, end: 999,
      select(selection) { this.selection = selection; return this; },
      eq(key, value) { this.predicates.push((row) => row[key] === value); return this; },
      in(key, ids) { this.ids = ids; this.predicates.push((row) => ids.includes(row[key])); return this; },
      overlaps(key, values) { this.predicates.push((row) => row[key]?.some((value) => values.includes(value))); return this; },
      filter(key, operation, value) { assert.equal(operation, "cs"); const required = JSON.parse(value); this.predicates.push((row) => required.every((match) => row[key]?.some((item) => Object.entries(match).every(([key, value]) => item[key] === value)))); return this; },
      order(key, { ascending }) { this.ordering.push([key, ascending]); return this; },
      range(start, end) { this.start = start; this.end = end; return this; },
      maybeSingle() { this.single = true; return this; },
      update(value) { this.updateValue = value; return this; },
      delete() { this.deleted = true; return this; },
      async then(resolve, reject) {
        try {
          state.queries.push(this);
          if (state.beforeRead) await state.beforeRead(this);
          if (state.errors[table]) return resolve({ data: null, error: state.errors[table] });
          let data = state.tables[table].filter((row) => this.predicates.every((predicate) => predicate(row)));
          if (this.updateValue) data.forEach((row) => Object.assign(row, this.updateValue));
          if (this.deleted) state.tables[table] = state.tables[table].filter((row) => !data.includes(row));
          data.sort((a, b) => {
            for (const [key, ascending] of this.ordering) {
              const difference = String(a[key]).localeCompare(String(b[key]));
              if (difference) return ascending ? difference : -difference;
            }
            return 0;
          });
          return resolve({ data: plain(this.single ? data[0] ?? null : data.slice(this.start, this.end + 1)), error: null });
        } catch (error) { return reject(error); }
      },
    };
    return query;
  } };
  const evict = (...tags) => state.caches.filter((cache) => cache.tags.some((tag) => tags.includes(tag))).forEach((cache) => cache.values.clear());
  const cache = {
    PUBLIC_EXERCISES_CACHE_TAG: "rank", PUBLIC_EXERCISES_CONTENT_CACHE_TAG: "content", PUBLIC_EXERCISES_PRIORITY_CACHE_TAG: "priority",
    isExerciseDataCacheEnabled: () => state.cacheEnabled,
    invalidateExerciseContent: () => { state.invalidations++; evict("content", "rank", "priority"); },
  };
  state.invalidateRanking = () => evict("rank", "priority");
  const cacheContext = new AsyncLocalStorage();
  state.repository = loadModule("../lib/exercises/repository.ts", {
    "server-only": {},
    "next/cache": { unstable_cache(fn, keys, options) {
      const cache = { keys, ...options, values: new Map() }; state.caches.push(cache);
      return async (...args) => {
        // Match installed Next: nested unstable_cache calls bypass cache reads.
        if (cacheContext.getStore()) { state.nestedCacheReads++; return fn(...args); }
        const key = JSON.stringify(args);
        if (!cache.values.has(key)) {
          const promise = cacheContext.run(true, () => Promise.resolve(fn(...args)).then(plain));
          cache.values.set(key, promise);
          promise.catch(() => cache.values.delete(key));
        }
        // JSON roundtrip models Next's persisted values (Map/Set would be lost).
        return plain(await cache.values.get(key));
      };
    } },
    "@/lib/supabase/server": { createSupabaseAdminClient: () => client, createSupabaseServerClient: async () => client, isDatabaseConfigured: () => state.service, isSupabaseConfigured: () => state.configured },
    "./cache": cache, "./ranking": ranking,
    "./source": { getLocalPublicExerciseBySourceId: () => state.localSupplement, getLocalPublicExerciseBySourceUrl: () => state.localSupplement, getSourceMuscleNames: (muscle) => [muscle] },
    "./pagination": { PUBLIC_EXERCISES_PAGE_SIZE: 5 },
    "./media-server": { getExerciseMediaPublicUrl: () => "", isExerciseMediaUnavailable: () => false },
    "./translations": { localizeExercises: async (items) => items.map((item) => ({ ...item, name: `${state.language}:${item.name}` })) },
    "./translation-content.mjs": translationContent,
    "./performance": { measureExerciseRead: (_phase, read) => read() },
  });
  return state;
}

const reads = (state, kind) => state.queries.filter((query) => kind === "content"
  ? query.table === "exercises" && query.selection?.includes("source_id")
  : kind === "candidates" ? query.table === "exercises" && !query.selection?.includes("source_id") : query.table === kind);

test("pages and locales share candidates/priority while page content and requested language stay correct", async () => {
  const state = setup();
  const first = await state.repository.listPublishedExercises("Chest");
  const second = await state.repository.listPublishedExercises("Chest", { page: 2 });
  state.language = "vi";
  const translated = await state.repository.listPublishedExercises("Chest");
  assert.equal(first.total, 12);
  assert.equal(second.page, 2);
  assert.equal(new Set([...first.items, ...second.items].map((item) => item.id)).size, 10);
  assert.equal(reads(state, "candidates").length, 1);
  assert.equal(reads(state, "content").length, 2);
  assert.equal(reads(state, "exercise_favorite_stats").length, 1);
  assert.equal(reads(state, "admin_featured_exercises").length, 1);
  assert.equal(translated.items[0].name, first.items[0].name.replace("en:", "vi:"));
  assert.deepEqual(plain(translated.items[0].media), plain(first.items[0].media));
  await state.repository.listPublishedExercises("Chest", { category: "Barbell" });
  assert.equal(reads(state, "exercise_favorite_stats").length, 1, "other filters reuse public aggregate");
  assert.equal(reads(state, "content").length, 2, "same IDs reuse content across filters");
  assert.equal(state.nestedCacheReads, 0, "cache layers must stay independent to reuse Next entries");
});

test("favorite invalidation reorders with fresh aggregate without throwing away unchanged content", async () => {
  const state = setup(Array.from({ length: 5 }, (_, index) => exercise(index + 1)));
  await state.repository.listPublishedExercises("Chest");
  state.tables.exercise_favorite_stats = [{ exercise_id: exercise(5).id, favorite_count: 99 }];
  state.invalidateRanking();
  const result = await state.repository.listPublishedExercises("Chest");
  assert.equal(result.items[0].id, exercise(5).id);
  assert.equal(reads(state, "content").length, 1);
  assert.equal(reads(state, "candidates").length, 1, "saving favorites must not repeat candidate reads");
  assert.equal(reads(state, "exercise_favorite_stats").length, 2);
});

test("source revision hashes raw database text before applying local content fallbacks", async () => {
  const row = exercise(1, { source: "musclewiki", source_id: 1, description: "", steps: [] });
  const state = setup([row]);
  state.localSupplement = { description: "Local description", steps: ["Local step."], media: [] };
  const page = await state.repository.listPublishedExercises("Chest");
  assert.equal(page.items[0].description, "Local description");
  assert.deepEqual(plain(page.items[0].steps), ["Local step."]);
  assert.equal(page.items[0].sourceContentHash, translationContent.getExerciseContentHash(row));
  assert.notEqual(page.items[0].sourceContentHash, translationContent.getExerciseContentHash(page.items[0]));
});

test("source deletion invalidates public content and rankings immediately", async () => {
  const state = setup();
  const before = await state.repository.listPublishedExercises("Chest");
  await state.repository.deleteExercise(before.items[0].id);
  const after = await state.repository.listPublishedExercises("Chest");
  assert.equal(state.invalidations, 1);
  assert.equal(after.total, 11);
  assert.ok(!after.items.some((item) => item.id === before.items[0].id));
  assert.equal(reads(state, "content").length, 2);
});

test("large candidate and priority sets preserve comparator ordering across every page", async () => {
  const rows = Array.from({ length: 1105 }, (_, index) => exercise(index + 1, { category: index % 2 ? "Barbell" : "Dumbbells" }));
  const state = setup([...rows, exercise(1200, { status: "Draft" }), exercise(1201, { primary_muscles: ["Back"] })]);
  state.tables.exercise_favorite_stats = rows.map((row, index) => ({ exercise_id: row.id, favorite_count: index % 5 }));
  state.tables.admin_featured_exercises = rows.filter((_, index) => index < 1000 || index === 1104).map((row) => ({ exercise_id: row.id }));
  const priority = { favoriteCounts: new Map(state.tables.exercise_favorite_stats.map((row) => [row.exercise_id, row.favorite_count])), featuredExerciseIds: new Set(state.tables.admin_featured_exercises.map((row) => row.exercise_id)) };
  const expected = [...rows].sort((a, b) => ranking.comparePublicExercisePriority(a, b, priority)).map((row) => row.id);
  const found = [];
  for (let page = 1; page <= 12; page++) {
    const result = await state.repository.listPublishedExercises("Chest", { page, pageSize: 100 });
    assert.equal(result.total, 1105);
    found.push(...result.items.map((item) => item.id));
  }
  assert.deepEqual(found, expected);
  assert.equal(new Set(found).size, 1105);
  assert.equal(reads(state, "candidates").length, 2);
  assert.equal(reads(state, "exercise_favorite_stats").length, 2);
  assert.equal(reads(state, "admin_featured_exercises").length, 2);
  const empty = await state.repository.listPublishedExercises("Chest", { page: 999, pageSize: 100 });
  assert.equal(empty.total, 1105); assert.equal(empty.items.length, 0);
});

test("advanced targets paginate beyond 1000, bound URL ID batches and preserve category/gender filters", async () => {
  const rows = Array.from({ length: 1105 }, (_, index) => exercise(index + 1));
  const female = exercise(1200, { media: [{ gender: "female", angle: "front", videoUrl: "https://media.test/female.mp4" }] });
  const state = setup([...rows, female, exercise(1300, { category: "Dumbbells" })]);
  state.tables.exercise_targets = [...state.tables.exercises.map((row) => ({ exercise_id: row.id, mode: "joint", slug: "elbow" })), { exercise_id: exercise(9999).id, mode: "joint", slug: "knee" }];
  const result = await state.repository.listPublishedExercisesByTarget("joint", "elbow", { page: 12, pageSize: 100, category: "Barbell" });
  assert.equal(result.total, 1105); assert.equal(result.items.length, 5);
  assert.equal(reads(state, "exercise_targets").length, 2);
  assert.ok(state.queries.every((query) => !query.ids || query.ids.length <= 100));
  const femaleResult = await state.repository.listPublishedExercisesByTarget("joint", "elbow", { gender: "female", category: "Barbell" });
  assert.equal(femaleResult.total, 1); assert.equal(femaleResult.items[0].id, female.id);
  assert.ok(femaleResult.items[0].media.every((media) => media.gender === "female"));
  const empty = await state.repository.listPublishedExercisesByTarget("joint", "missing");
  assert.equal(empty.total, 0); assert.equal(empty.items.length, 0);
});

test("candidate and priority requests start independently before any network read finishes", async () => {
  const state = setup();
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  state.beforeRead = () => gate;
  const result = state.repository.listPublishedExercises("Chest");
  await new Promise((resolve) => setImmediate(resolve));
  const tables = new Set(state.queries.map((query) => query.table));
  release();
  await result;
  assert.deepEqual([...tables].sort(), ["admin_featured_exercises", "exercise_favorite_stats", "exercises"]);
});

test("service-key fallback and cache rollback never share session-specific results", async () => {
  for (const service of [true, false]) {
    const state = setup(); state.service = service; state.cacheEnabled = false;
    await state.repository.listPublishedExercises("Chest");
    await state.repository.listPublishedExercises("Chest");
    assert.equal(reads(state, "content").length, 2);
    assert.equal(reads(state, "exercise_favorite_stats").length, 2);
    assert.ok(state.caches.every((cache) => cache.values.size === 0));
  }
  const session = setup(); session.service = false;
  session.errors.exercise_favorite_stats = { code: "42P01", message: "Missing aggregate" };
  session.tables.user_favorite_exercises = [{ user_id: "private", exercise_id: exercise(12).id }];
  await session.repository.listPublishedExercises("Chest");
  assert.equal(reads(session, "user_favorite_exercises").length, 0, "private subset must not become global aggregate");
});

test("legacy aggregate fallback counts beyond 1000 only with a service client", async () => {
  const state = setup();
  state.errors.exercise_favorite_stats = { code: "42P01", message: "Missing aggregate" };
  state.tables.user_favorite_exercises = Array.from({ length: 1001 }, (_, index) => ({ user_id: `user-${index}`, exercise_id: exercise(12).id }));
  const result = await state.repository.listPublishedExercises("Chest");
  assert.equal(result.items[0].id, exercise(12).id);
  assert.equal(reads(state, "user_favorite_exercises").length, 2);
});

test("transient stats and featured failures never cache empty priorities and recover on the next read", async () => {
  for (const table of ["exercise_favorite_stats", "admin_featured_exercises"]) {
    const state = setup();
    state.tables.exercise_favorite_stats = [{ exercise_id: exercise(12).id, favorite_count: 9 }];
    state.tables.admin_featured_exercises = [{ exercise_id: exercise(11).id }];
    state.errors[table] = { code: "57014", message: "Temporary priority timeout" };
    await assert.rejects(state.repository.listPublishedExercises("Chest"), /Temporary priority timeout/);
    assert.equal(state.caches.find((cache) => cache.tags.includes("priority")).values.size, 0);
    assert.equal(reads(state, "user_favorite_exercises").length, 0, "an outage is not a missing-schema fallback");
    delete state.errors[table];
    const recovered = await state.repository.listPublishedExercises("Chest");
    assert.equal(recovered.items[0].id, exercise(11).id);
    assert.equal(recovered.items[1].id, exercise(12).id);
    assert.equal(reads(state, table).length, 2);
  }
});

test("legacy aggregate failures are not cached as zero favorite counts", async () => {
  const state = setup();
  state.errors.exercise_favorite_stats = { code: "PGRST205", message: "Missing aggregate" };
  state.errors.user_favorite_exercises = { code: "57014", message: "Temporary legacy timeout" };
  state.tables.user_favorite_exercises = [{ user_id: "user-1", exercise_id: exercise(12).id }];
  await assert.rejects(state.repository.listPublishedExercises("Chest"), /Temporary legacy timeout/);
  assert.equal(state.caches.find((cache) => cache.tags.includes("priority")).values.size, 0);
  delete state.errors.user_favorite_exercises;
  const recovered = await state.repository.listPublishedExercises("Chest");
  assert.equal(recovered.items[0].id, exercise(12).id);
});

test("recognized missing featured table remains a graceful older-schema fallback", async () => {
  for (const code of ["42P01", "PGRST205"]) {
    const state = setup();
    state.errors.admin_featured_exercises = { code, message: "Missing featured table" };
    state.tables.exercise_favorite_stats = [{ exercise_id: exercise(12).id, favorite_count: 3 }];
    const result = await state.repository.listPublishedExercises("Chest");
    assert.equal(result.items[0].id, exercise(12).id);
  }
});
