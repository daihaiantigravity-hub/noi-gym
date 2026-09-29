import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { canonicalExerciseUrl, mergeFemaleCaptureRecords, prepareFemaleRecord, resolveFemaleMedia } from "./female-dataset.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const dataDir = path.join(root, "scripts/migration/data");
const femaleDir = path.join(dataDir, "female");
const read = (name) => JSON.parse(fs.readFileSync(path.join(femaleDir, name), "utf8"));
const write = (name, payload) => fs.writeFileSync(path.join(femaleDir, name), `${JSON.stringify(payload, null, 2)}\n`);
const baseline = read("male-files-sha256.json");
const changedMaleFiles = Object.entries(baseline).filter(([name, hash]) =>
  crypto.createHash("sha256").update(fs.readFileSync(path.join(dataDir, name))).digest("hex") !== hash,
).map(([name]) => name);
if (changedMaleFiles.length) throw new Error(`Existing dataset changed: ${changedMaleFiles.join(", ")}`);
const existing = new Map();
for (const name of Object.keys(baseline)) {
  const payload = JSON.parse(fs.readFileSync(path.join(dataDir, name), "utf8"));
  for (const item of payload.results || []) {
    if (!item.source_url) continue;
    const url = canonicalExerciseUrl(item.source_url);
    const prior = existing.get(url);
    existing.set(url, prior ? { ...prior, primary_muscles: [...new Set([...(prior.primary_muscles || []), ...(item.primary_muscles || [])])] } : item);
  }
}
const capture = read("browser-capture.json");
const scopedCapture = fs.existsSync(path.join(femaleDir, "scope-capture.json")) ? read("scope-capture.json") : { roots: [], pages: [], records: [] };
const details = fs.existsSync(path.join(femaleDir, "detail-capture.json")) ? read("detail-capture.json") : [];
const videoResolutions = fs.existsSync(path.join(femaleDir, "video-resolutions.json")) ? read("video-resolutions.json") : {};
const detailByUrl = new Map(details.map((item) => [canonicalExerciseUrl(item.sourceUrl), item]));
const mergedRecords = mergeFemaleCaptureRecords(capture.records, scopedCapture.records);
const results = mergedRecords.map((record) => {
  const url = canonicalExerciseUrl(record.sourceUrl);
  return prepareFemaleRecord(resolveFemaleMedia(record, videoResolutions[url]), existing.get(url), detailByUrl.get(url));
});
for (const url of Object.keys(videoResolutions)) {
  if (!mergedRecords.some((record) => canonicalExerciseUrl(record.sourceUrl) === url)) throw new Error(`Video resolution has no matching captured exercise: ${url}`);
}
const byUrl = new Map();
for (const record of results) {
  if (byUrl.has(record.source_url)) throw new Error(`Duplicate canonical URL: ${record.source_url}`);
  byUrl.set(record.source_url, record);
}
const female = results.filter((record) => record.videos.length);
const noFemaleVideo = results.filter((record) => !record.videos.length);
const unresolved = female.filter((record) => !record.category || !record.primary_muscles.length);
const pilotNames = ["Dumbbell Curl", "Dumbbell Bench Press", "Bodyweight Squat", "Barbell Squat", "Kettlebell Swing"];
const pilot = pilotNames.map((name) => {
  const record = female.find((item) => item.name === name && item.category && item.primary_muscles.length);
  if (!record) throw new Error(`Female pilot exercise is missing metadata: ${name}`);
  return record;
});
const categories = {};
const difficulties = {};
for (const record of female) {
  const category = categories[record.category || "Unresolved"] ||= { exercises: 0, videos: 0 };
  category.exercises++;
  category.videos += record.videos.length;
  difficulties[record.difficulty || "Unresolved"] = (difficulties[record.difficulty || "Unresolved"] || 0) + 1;
}
const coverage = capture.roots.map((entry) => {
  const pages = capture.pages.filter((page) => new URL(page.sourcePage).pathname.split("/")[2] === new URL(entry.url).pathname.split("/")[2]);
  const cards = pages.reduce((total, page) => total + page.recordUrls.length, 0);
  const unique = new Set(pages.flatMap((page) => page.recordUrls)).size;
  const byPage = new Map(pages.map((page) => [page.sourcePage, page]));
  const visited = new Set();
  let cursor = `${entry.url}?model=f`;
  while (cursor && byPage.has(cursor) && !visited.has(cursor)) {
    visited.add(cursor);
    cursor = byPage.get(cursor).nextPageUrl;
  }
  const pageChainComplete = entry.status === "complete" && cursor === null && visited.size === pages.length;
  const sourceCountDifference = unique - entry.expected;
  const complete = pageChainComplete && sourceCountDifference === 0;
  return { ...entry, capturedPages: pages.length, cards, unique, duplicateSourceCards: cards - unique, sourceCountDifference, pageChainComplete, verifiedComplete: complete };
});
const scopedCoverage = scopedCapture.roots.map((entry) => {
  const pages = scopedCapture.pages.filter((page) => page.rootId === entry.id);
  const cards = pages.reduce((total, page) => total + page.recordUrls.length, 0);
  const unique = new Set(pages.flatMap((page) => page.recordUrls.map(canonicalExerciseUrl))).size;
  const byPage = new Map(pages.map((page) => [page.sourcePage, page]));
  const visited = new Set();
  let cursor = entry.url;
  while (cursor && byPage.has(cursor) && !visited.has(cursor)) {
    visited.add(cursor);
    cursor = byPage.get(cursor).nextPageUrl;
  }
  const pageChainComplete = entry.status === "complete" && cursor === null && visited.size === pages.length;
  const sourceCountDifference = entry.status === "complete" ? unique - entry.expected : null;
  return {
    ...entry,
    capturedPages: pages.length,
    cards,
    unique,
    duplicateSourceCards: cards - unique,
    sourceCountDifference,
    pageChainComplete,
    verifiedComplete: pageChainComplete && sourceCountDifference === 0,
  };
});
const scopedSummary = {
  roots: scopedCoverage.length,
  joints: scopedCoverage.filter((entry) => entry.kind === "joint").length,
  jointsVerified: scopedCoverage.filter((entry) => entry.kind === "joint" && entry.verifiedComplete).length,
  equipmentRoots: scopedCoverage.filter((entry) => entry.kind === "equipment").length,
  equipmentVerified: scopedCoverage.filter((entry) => entry.kind === "equipment" && entry.verifiedComplete).length,
  equipmentWithSourceCountDifference: scopedCoverage.filter((entry) => entry.kind === "equipment" && entry.status === "complete" && entry.sourceCountDifference !== 0).length,
  equipmentUnavailable: scopedCoverage.filter((entry) => entry.kind === "equipment" && entry.status === "unavailable").length,
  equipmentAliasInferred: scopedCoverage.filter((entry) => entry.kind === "equipment" && entry.status === "alias-inferred").length,
  capturedPages: scopedCapture.pages.length,
  uniqueExerciseUrls: scopedCapture.records.length,
  newlyFoundExerciseUrls: mergedRecords.length - capture.records.length,
};
const captureScope = {
  muscleCategoryRoots: capture.roots.length,
  equipmentFilteredListingPages: scopedCapture.pages.filter((page) => page.rootId.startsWith("equipment:")).length,
  jointRecoveryListingPages: scopedCapture.pages.filter((page) => page.rootId.startsWith("joint:")).length,
};
const report = {
  capturedAt: { muscle: capture.capturedAt, scoped: scopedCapture.capturedAt || null },
  preparedAt: new Date().toISOString(),
  femaleExercises: female.length,
  femaleVideos: female.reduce((total, record) => total + record.videos.length, 0),
  withoutFemaleVideo: noFemaleVideo.length,
  withoutSteps: female.filter((record) => !record.steps.length).length,
  unresolvedMetadata: unresolved.length,
  missingCategory: female.filter((record) => !record.category).length,
  missingPrimaryMuscles: female.filter((record) => !record.primary_muscles.length).length,
  matchedExisting: female.filter((record) => existing.has(record.source_url)).length,
  newlyDiscovered: female.filter((record) => !existing.has(record.source_url)).length,
  pilotExercises: pilot.length,
  resolvedVideoVariants: female.filter((record) => record.video_resolution).length,
  categories,
  difficulties,
  jointExercises: female.filter((record) => record.joint_targets.length).length,
  captureScope,
  coverage,
  scopedCoverage,
  scopedSummary,
  coverageSummary: { verifiedCategories: coverage.filter((entry) => entry.verifiedComplete).length, totalCategories: coverage.length, categoriesWithSourceCountDifference: coverage.filter((entry) => entry.sourceCountDifference !== 0).map(({ name, sourceCountDifference }) => ({ name, sourceCountDifference })) },
  complete: coverage.every((entry) => entry.verifiedComplete) && scopedCoverage.every((entry) => entry.verifiedComplete),
  maleDataIntegrity: { filesChecked: Object.keys(baseline).length, changedFiles: changedMaleFiles },
  databaseWrites: 0,
  storageUploads: 0,
  notes: ["Staged local dataset only; not registered in public UI.", "Female videos are accepted only from observed female media URLs.", "listed_in and joint_targets describe source listing membership, not anatomical primary muscles.", "A complete page chain with fewer unique URLs than the source count means repeated source cards, and is not marked verified.", "Unavailable equipment routes returned 404; alias-inferred Cardio routes were not each independently traversed.", "Existing seeder resets status to Draft and must not be used to merge this dataset.", "Existing uploader paths omit gender; do not use it for female videos."],
};
write("musclewiki-female-import.json", { total: female.length, count: female.length, gender: "female", staged: true, results: female });
write("musclewiki-female-pilot.json", { total: pilot.length, count: pilot.length, gender: "female", staged: true, results: pilot });
write("coverage-report.json", report);
write("unresolved-metadata.json", unresolved.map(({ id, name, female_source_url, listed_in, listed_in_scopes, joint_targets, source_equipment }) => ({ id, name, sourceUrl: female_source_url, listedIn: listed_in, listedInScopes: listed_in_scopes, jointTargets: joint_targets, sourceEquipment: source_equipment })));
write("without-female-video.json", noFemaleVideo.map(({ name, female_source_url }) => ({ name, sourceUrl: female_source_url })));
console.log(JSON.stringify({ femaleExercises: report.femaleExercises, femaleVideos: report.femaleVideos, withoutFemaleVideo: report.withoutFemaleVideo, unresolvedMetadata: report.unresolvedMetadata, coverageSummary: report.coverageSummary, scopedSummary, maleDataIntegrity: report.maleDataIntegrity, complete: report.complete }, null, 2));
