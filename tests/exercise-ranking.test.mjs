import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const source = readFileSync(new URL("../lib/exercises/ranking.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
});
const exports = {};
const categoryOrder = new Map([["Dumbbells", 0], ["Barbell", 1], ["Bodyweight", 2]]);
vm.runInNewContext(outputText, {
  exports,
  require: (name) => {
    assert.equal(name, "./category-order");
    return { getExerciseCategoryOrder: (category) => categoryOrder.get(category) ?? Number.MAX_SAFE_INTEGER };
  },
});

const exercise = (id, name, category = "Dumbbells", updatedAt = "2026-01-01T00:00:00.000Z") => ({
  id,
  name,
  category,
  updated_at: updatedAt,
});

test("admin-featured exercises are grouped first and popularity orders each group", () => {
  const priority = {
    favoriteCounts: new Map([["featured-low", 1], ["featured-high", 8], ["popular", 100], ["quiet", 2]]),
    featuredExerciseIds: new Set(["featured-low", "featured-high"]),
  };
  const items = [
    exercise("quiet", "Quiet"),
    exercise("featured-low", "Featured low"),
    exercise("popular", "Popular"),
    exercise("featured-high", "Featured high"),
  ];

  items.sort((first, second) => exports.comparePublicExercisePriority(first, second, priority));
  assert.deepEqual(items.map((item) => item.id), ["featured-high", "featured-low", "popular", "quiet"]);
});

test("category, update time and name provide deterministic tie breakers", () => {
  const priority = { favoriteCounts: new Map(), featuredExerciseIds: new Set() };
  const items = [
    exercise("barbell", "Zeta", "Barbell", "2026-05-01T00:00:00.000Z"),
    exercise("old", "Beta", "Dumbbells", "2026-01-01T00:00:00.000Z"),
    exercise("alpha", "Alpha", "Dumbbells", "2026-06-01T00:00:00.000Z"),
    exercise("new", "Zeta", "Dumbbells", "2026-06-01T00:00:00.000Z"),
  ];

  items.sort((first, second) => exports.comparePublicExercisePriority(first, second, priority));
  assert.deepEqual(items.map((item) => item.id), ["alpha", "new", "old", "barbell"]);
});
