import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isDeepStrictEqual } from "node:util";
import { createClient } from "@supabase/supabase-js";
import { femaleStoragePath } from "./female-media-import.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const femaleDir = path.join(root, "scripts/migration/data/female");
const read = (name) => JSON.parse(fs.readFileSync(path.join(femaleDir, name), "utf8"));
for (const line of fs.readFileSync(path.join(root, ".env.local"), "utf8").split(/\r?\n/)) {
  const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
  if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
}
const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const key = process.env.SUPABASE_SECRET_KEY?.trim() || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
if (!url || !key) throw new Error("Supabase admin credentials are unavailable");
const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
  ...(key.startsWith("sb_secret_") ? { global: { fetch: async (input, init) => {
    const headers = new Headers(init?.headers);
    headers.delete("Authorization");
    return fetch(input, { ...init, headers });
  } } } : {}),
});

const rows = [];
for (let start = 0; ; start += 500) {
  const { data, error } = await supabase.from("exercises").select("id,source,source_id,name,slug,description,primary_muscles,category,force,grips,mechanic,difficulty,status,steps,media,source_snapshot").eq("source", "musclewiki").order("source_id").range(start, start + 499);
  if (error) throw new Error(error.message);
  rows.push(...(data || []));
  if (!data || data.length < 500) break;
}
const bySourceId = new Map(rows.map((row) => [Number(row.source_id), row]));
const baseline = read("database-before.json").filter((row) => row.source === "musclewiki");
const baselineIds = new Set(baseline.map((row) => Number(row.source_id)));
const comparisonFields = ["id", "source", "source_id", "name", "slug", "primary_muscles", "category", "status", "steps"];
const changedExisting = baseline.flatMap((before) => {
  const after = bySourceId.get(Number(before.source_id));
  if (!after) return [{ sourceId: before.source_id, issue: "missing-existing-row" }];
  const changedFields = comparisonFields.filter((key) => !isDeepStrictEqual(before[key], after[key]));
  if (!isDeepStrictEqual((before.media || []).filter((item) => item.gender !== "female"), (after.media || []).filter((item) => item.gender !== "female"))) changedFields.push("non-female-media");
  return changedFields.length ? [{ sourceId: before.source_id, issue: changedFields.join(",") }] : [];
});

const exercises = read("musclewiki-female-import.json").results;
const latestUploadErrors = new Map();
const eventsPath = path.join(femaleDir, "upload-events.jsonl");
if (fs.existsSync(eventsPath)) for (const line of fs.readFileSync(eventsPath, "utf8").split(/\r?\n/).filter(Boolean)) {
  const event = JSON.parse(line);
  for (const error of event.errors || []) if (error.angle) latestUploadErrors.set(`${event.sourceId}:${error.angle}`, error.message);
}
const missingRows = [];
const missingVideos = [];
const linkedPaths = new Set();
let femaleMediaCount = 0;
let femaleUrlsUnmasked = 0;
let newDrafts = 0;
let newPublished = 0;
for (const exercise of exercises) {
  const row = bySourceId.get(exercise.id);
  if (!row) { missingRows.push(exercise.id); continue; }
  if (!baselineIds.has(exercise.id) && row.status === "Draft") newDrafts += 1;
  if (!baselineIds.has(exercise.id) && row.status === "Published") newPublished += 1;
  const female = (row.media || []).filter((item) => item.gender === "female");
  femaleMediaCount += female.length;
  for (const video of exercise.videos) {
    const expectedPath = femaleStoragePath(exercise.id, video.angle);
    const item = female.find((media) => media.angle === video.angle && media.storagePath === expectedPath);
    if (!item) missingVideos.push({ sourceId: exercise.id, name: exercise.name, angle: video.angle, sourceUrl: video.url, lastUploadError: latestUploadErrors.get(`${exercise.id}:${video.angle}`) || null });
    else {
      linkedPaths.add(expectedPath);
      if (item.videoUrl) femaleUrlsUnmasked += 1;
    }
  }
}

const storedPaths = new Set();
for (let offset = 0; ; offset += 1000) {
  const { data, error } = await supabase.storage.from("exercise-media").list("exercises/musclewiki/female", { limit: 1000, offset, sortBy: { column: "name", order: "asc" } });
  if (error) throw new Error(error.message);
  for (const item of data || []) if (item.id) storedPaths.add(`exercises/musclewiki/female/${item.name}`);
  if (!data || data.length < 1000) break;
}
const report = {
  auditedAt: new Date().toISOString(),
  sourceExercises: exercises.length,
  sourceVideos: exercises.reduce((sum, exercise) => sum + exercise.videos.length, 0),
  databaseMusclewikiRows: rows.length,
  newDrafts,
  newPublished,
  femaleMediaCount,
  femaleUrlsUnmasked,
  femaleStorageObjects: storedPaths.size,
  linkedObjectsMissingFromStorage: [...linkedPaths].filter((item) => !storedPaths.has(item)),
  unlinkedFemaleStorageObjects: [...storedPaths].filter((item) => !linkedPaths.has(item)),
  missingRows,
  missingVideos,
  changedExisting,
};
fs.writeFileSync(path.join(femaleDir, "upload-audit.json"), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ ...report, missingVideos: report.missingVideos.length, changedExisting: report.changedExisting.length, missingRows: report.missingRows.length, linkedObjectsMissingFromStorage: report.linkedObjectsMissingFromStorage.length, unlinkedFemaleStorageObjects: report.unlinkedFemaleStorageObjects.length }, null, 2));
if (changedExisting.length || missingRows.length || report.linkedObjectsMissingFromStorage.length || report.unlinkedFemaleStorageObjects.length || femaleUrlsUnmasked) process.exitCode = 1;
