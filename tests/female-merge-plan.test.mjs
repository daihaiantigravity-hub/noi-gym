import assert from "node:assert/strict";
import test from "node:test";
import { buildFemaleMergePlan } from "../scripts/migration/female-merge-plan.mjs";

test("merge plan preserves published status and male media while identifying new records for review", () => {
  const exercise = (id, category = "Dumbbells", muscles = ["Biceps"]) => ({
    id, name: `Exercise ${id}`, source_url: `https://musclewiki.com/exercise/exercise-${id}`,
    category, primary_muscles: muscles, videos: [{ gender: "female", angle: "front", url: "https://musclewiki.com/api-next/videos/female-front.mp4" }],
  });
  const maleVideo = { gender: "male", angle: "front", videoUrl: "male-url" };
  const row = { id: "database-id", source: "musclewiki", source_id: 1, status: "Published", media: [maleVideo] };
  const rowBefore = structuredClone(row);
  const plan = buildFemaleMergePlan([exercise(1), exercise(2, "", [])], [row]);
  assert.equal(plan.summary.matchedExisting, 1);
  assert.equal(plan.summary.existingPublished, 1);
  assert.equal(plan.summary.femaleAnglesToAdd, 1);
  assert.equal(plan.summary.newNeedingReview, 1);
  assert.deepEqual(plan.newExercises[0].issues, ["missing-primary-muscle", "missing-supported-category"]);
  assert.equal(plan.matched[0].statusAfter, "Published");
  assert.equal(plan.matched[0].maleMediaAfter, 1);
  assert.deepEqual(row, rowBefore);
  assert.equal(plan.summary.databaseWrites, 0);
});

test("ambiguous source videos for one angle cannot be merged automatically", () => {
  const exercise = {
    id: 1, name: "Ambiguous", category: "Barbell", primary_muscles: ["Biceps"],
    videos: [
      { gender: "female", angle: "front", url: "front-a" },
      { gender: "female", angle: "front", url: "front-b" },
    ],
  };
  const row = { id: "db", source: "musclewiki", source_id: 1, status: "Published", media: [] };
  const plan = buildFemaleMergePlan([exercise], [row]);
  assert.equal(plan.summary.existingNeedingReview, 1);
  assert.equal(plan.summary.femaleAnglesToAdd, 0);
  assert.equal(plan.matched[0].action, "review-video-variants");
});
