import assert from "node:assert/strict";
import test from "node:test";
import { canonicalExerciseUrl, categoryFromFemaleMedia, classifyVideo, equipmentFromScopes, mergeFemaleCaptureRecords, prepareFemaleRecord, resolveFemaleMedia, sourceIdForUrl } from "../scripts/migration/female-dataset.mjs";

test("male and female views keep one canonical source identity", () => {
  const canonical = "https://musclewiki.com/exercise/dumbbell-curl";
  assert.equal(canonicalExerciseUrl(`${canonical}/?model=f`), canonical);
  assert.equal(sourceIdForUrl(`${canonical}?model=f`), sourceIdForUrl(canonical));
  assert.throws(() => canonicalExerciseUrl("https://example.com/exercise/dumbbell-curl"));
});

test("a female page cannot relabel fallback male or unknown media as female", () => {
  const base = "https://musclewiki.com/api-next/videos/";
  assert.equal(classifyVideo(`${base}female-Barbell-curl-front.mp4`).gender, "female");
  assert.equal(classifyVideo(`${base}female-Barbell-front-squat-side.mp4`).angle, "side");
  assert.equal(classifyVideo(`${base}female-Band-side-step-front.mp4`).angle, "front");
  assert.equal(classifyVideo(`${base}female-dumbbell-bench-press-side_5wGWrBA.mp4`).angle, "side");
  assert.equal(classifyVideo(`${base}male-Barbell-curl-side.mp4`).gender, "male");
  assert.equal(classifyVideo(`${base}curl-front.mp4`), null);
  assert.equal(classifyVideo("https://example.com/female-curl-front.mp4"), null);
  const record = prepareFemaleRecord({ name: "Curl", sourceUrl: "https://musclewiki.com/exercise/curl?model=f", instructions: [], media: [
    { type: "video", url: `${base}male-curl-front.mp4` },
    { type: "video", url: `${base}female-curl-side.mp4` },
    { type: "video", url: `${base}female-curl-side.mp4` },
  ] });
  assert.equal(record.videos.length, 1);
  assert.equal(record.videos[0].angle, "side");
  assert.equal(record.videos[0].gender, "female");
});

test("preparing female data preserves existing metadata and does not mutate male records", () => {
  const existing = { id: 123, category: "Dumbbells", primary_muscles: ["Biceps"], videos: [{ gender: "male", angle: "front", url: "unchanged" }], status: "Published" };
  const before = structuredClone(existing);
  const record = prepareFemaleRecord({ name: "Curl", sourceUrl: "https://musclewiki.com/exercise/curl?model=f", instructions: ["Observed step"], listedIn: ["forearms"], media: [] }, existing);
  assert.equal(record.id, 123);
  assert.equal(record.category, "Dumbbells");
  assert.deepEqual(record.primary_muscles, ["Biceps"]);
  assert.deepEqual(record.listed_in, ["forearms"]);
  assert.deepEqual(existing, before);
});

test("equipment is inferred only from consistent, recognized female media filenames", () => {
  const base = "https://musclewiki.com/api-next/videos/";
  assert.equal(categoryFromFemaleMedia([{ url: `${base}female-Medicine-Ball-press-front.mp4` }]), "Medicine Ball");
  assert.equal(categoryFromFemaleMedia([{ url: `${base}female-Recovery-press-front.mp4` }]), "");
  assert.equal(categoryFromFemaleMedia([
    { url: `${base}female-Cables-press-front.mp4` },
    { url: `${base}female-Dumbbells-press-side.mp4` },
  ]), "");
});

test("scoped capture adds female media without losing the original listing or instructions", () => {
  const url = "https://musclewiki.com/exercise/mini-band-leg-raise?model=f";
  const femaleVideo = "https://musclewiki.com/api-next/videos/female-Band-mini-band-leg-raise-front.mp4";
  const base = [{ name: "Mini Band Leg Raise", sourceUrl: url, instructions: ["Original step"], listedIn: ["abdominals"], media: [] }];
  const scoped = [{ name: "Mini Band Leg Raise", sourceUrl: url, instructions: [], listedInScopes: ["equipment:abdominals:band"], media: [{ type: "video", url: femaleVideo }] }];
  const merged = mergeFemaleCaptureRecords(base, scoped);
  assert.equal(merged.length, 1);
  assert.deepEqual(merged[0].instructions, ["Original step"]);
  assert.deepEqual(merged[0].listedIn, ["abdominals"]);
  assert.deepEqual(merged[0].listedInScopes, ["equipment:abdominals:band"]);
  const prepared = prepareFemaleRecord(merged[0]);
  assert.equal(prepared.videos[0].url, femaleVideo);
  assert.equal(prepared.category, "Band");
  assert.equal(prepared.category_source, "source-equipment-listing");
  assert.deepEqual(base[0].media, []);
});

test("joint membership is preserved without inventing a primary muscle or unsupported category", () => {
  const record = prepareFemaleRecord({
    name: "Shoulder Mobility", sourceUrl: "https://musclewiki.com/exercise/shoulder-mobility?model=f",
    instructions: ["Move gently"], listedInScopes: ["joint:shoulders", "equipment:shoulders:recovery"],
    media: [{ type: "video", url: "https://musclewiki.com/api-next/videos/female-Recovery-shoulder-mobility-front.mp4" }],
  });
  assert.deepEqual(record.joint_targets, ["shoulders"]);
  assert.deepEqual(record.primary_muscles, []);
  assert.deepEqual(record.source_equipment, ["recovery"]);
  assert.equal(record.category, "");
  assert.equal(equipmentFromScopes(["equipment:biceps:barbell", "equipment:biceps:cables"]).category, "");
});

test("reviewed media resolution keeps one observed female video per angle with provenance", () => {
  const base = "https://musclewiki.com/api-next/videos/";
  const front = `${base}female-Medicine-Ball-single-leg-deadlift-front.mp4`;
  const side = `${base}female-Medicine-Ball-single-leg-deadlift-side.mp4`;
  const alternate = `${base}female-Vitruvian-single-leg-deadlift-front.mp4`;
  const record = { name: "Single Leg Deadlift", media: [front, side, alternate].map((url) => ({ type: "video", url })) };
  const resolved = resolveFemaleMedia(record, { reason: "Observed filtered pair", selectedUrls: [front, side] });
  assert.deepEqual(resolved.media.map((item) => item.url), [front, side]);
  assert.deepEqual(resolved.videoResolution.excludedUrls, [alternate]);
  assert.equal(record.media.length, 3);
  assert.throws(() => resolveFemaleMedia(record, { reason: "Invalid", selectedUrls: [front, alternate] }));
});
