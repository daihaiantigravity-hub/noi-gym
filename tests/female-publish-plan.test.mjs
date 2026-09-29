import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { buildFemalePublishPlan } from "../scripts/migration/female-publish-plan.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = path.join(root, "scripts/migration/data/female");
const dataset = JSON.parse(fs.readFileSync(path.join(dataDir, "musclewiki-female-import.json"), "utf8"));
const readiness = JSON.parse(fs.readFileSync(path.join(dataDir, "merge-readiness.json"), "utf8"));

test("all 242 new female exercises have a publishable browse route and source-backed category", () => {
  const sourceById = new Map(dataset.results.map((exercise) => [exercise.id, exercise]));
  const plans = readiness.newExercises.map(({ sourceId }) => buildFemalePublishPlan(sourceById.get(sourceId)));
  assert.equal(plans.length, 242);
  assert.equal(new Set(plans.map((plan) => plan.sourceId)).size, 242);
  assert.equal(plans.filter((plan) => plan.category === "Recovery").length, 116);
  assert.equal(plans.filter((plan) => plan.category === "Vitruvian").length, 22);
  assert.equal(plans.filter((plan) => plan.muscleSource === "joint-only").length, 1);
  assert.ok(plans.every((plan) => plan.primaryMuscles.length > 0 || plan.targets.some((target) => target.mode === "joint")));
  assert.ok(plans.every((plan) => plan.stepsCount > 0 && plan.difficulty));
  assert.equal(plans.flatMap((plan) => plan.targets).length, 48);
});
