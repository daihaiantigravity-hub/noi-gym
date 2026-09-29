import assert from "node:assert/strict";
import { test } from "node:test";
import { chooseDraftSlug, femaleStoragePath, keepFemaleMediaAdminOnly, mergeFemaleMedia, missingFemaleVideos, newFemaleDraft, validateFemaleExercise } from "../scripts/migration/female-media-import.mjs";

const exercise = {
  id: 123456,
  name: "Dumbbell Curl",
  videos: [
    { gender: "female", angle: "front", url: "https://musclewiki.com/api-next/videos/female-curl-front.mp4" },
    { gender: "female", angle: "side", url: "https://musclewiki.com/api-next/videos/female-curl-side.mp4" },
  ],
  steps: ["Lift", "Lower"],
};

test("female videos use a separate validated Storage path", () => {
  validateFemaleExercise(exercise);
  assert.equal(femaleStoragePath(exercise.id, "front"), "exercises/musclewiki/female/123456-front.mp4");
  assert.throws(() => validateFemaleExercise({ ...exercise, videos: [{ ...exercise.videos[0], url: "https://other.example/video.mp4" }, exercise.videos[1]] }));
  assert.throws(() => validateFemaleExercise({ ...exercise, videos: [exercise.videos[0], exercise.videos[0]] }));
});

test("merging female media preserves every male item and does not replace an admin edit", () => {
  const male = { gender: "male", angle: "front", videoUrl: "https://storage.example/male.mp4", storagePath: "exercises/musclewiki/123456-front.mp4" };
  const manualFemale = { gender: "female", angle: "front", videoUrl: "https://storage.example/manual.mp4" };
  const incoming = [
    { gender: "female", angle: "front", videoUrl: "https://storage.example/new-front.mp4", storagePath: femaleStoragePath(exercise.id, "front") },
    { gender: "female", angle: "side", videoUrl: "https://storage.example/new-side.mp4", storagePath: femaleStoragePath(exercise.id, "side") },
  ];
  const before = [male, manualFemale];
  const after = mergeFemaleMedia(before, incoming);
  assert.deepEqual(before, [male, manualFemale]);
  assert.deepEqual(after[0], male);
  assert.deepEqual(after[1], manualFemale);
  assert.deepEqual(after[2], incoming[1]);
  assert.deepEqual(missingFemaleVideos(exercise, after), []);
  const stored = keepFemaleMediaAdminOnly(after);
  assert.equal(stored[0].videoUrl, male.videoUrl);
  assert.equal(stored[2].videoUrl, "");
  assert.deepEqual(missingFemaleVideos(exercise, stored), []);
});

test("new source-only exercises enter admin as Draft with a unique slug", () => {
  const reserved = new Set(["dumbbell-curl"]);
  const slug = chooseDraftSlug(exercise, reserved);
  const draft = newFemaleDraft({ ...exercise, category: "Recovery", primary_muscles: [] }, slug, []);
  assert.equal(slug, "dumbbell-curl-musclewiki-123456");
  assert.equal(draft.status, "Draft");
  assert.equal(draft.category, "");
  assert.deepEqual(draft.primary_muscles, []);
  assert.deepEqual(draft.steps, ["Lift", "Lower"]);
});
