import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const defaultBackupDir = path.join(projectRoot, "artifacts", "media-migration", "supabase-backup-2026-10-14");
const mediaSupplementPath = path.join(projectRoot, "scripts", "migration", "data", "musclewiki-missing-male-media.json");
const sourceProjectRef = "xeayzrtoryzvgqjdufbk";
const apply = process.argv.includes("--apply");
const repairExisting = process.argv.includes("--repair-existing");

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
  }
}

function chunks(items, size) {
  const result = [];
  for (let index = 0; index < items.length; index += size) result.push(items.slice(index, index + size));
  return result;
}

function readBackup(fileName) {
  const backupDir = process.env.RESTORE_BACKUP_DIR?.trim() || defaultBackupDir;
  return JSON.parse(fs.readFileSync(path.join(backupDir, fileName), "utf8"));
}

function normalizeArrayField(value, field, rowId) {
  if (Array.isArray(value)
    && value.length === 1
    && value[0]
    && typeof value[0] === "object"
    && Array.isArray(value[0].value)) {
    return value[0].value;
  }
  if (Array.isArray(value)) return value;
  throw new Error(`Exercise ${rowId} has an invalid ${field} backup value`);
}

function normalizeExercise(row) {
  const normalized = {
    ...row,
    primary_muscles: normalizeArrayField(row.primary_muscles, "primary_muscles", row.id),
    steps: normalizeArrayField(row.steps, "steps", row.id),
    media: normalizeArrayField(row.media, "media", row.id),
  };
  if (!normalized.primary_muscles.every((value) => typeof value === "string")) {
    throw new Error(`Exercise ${row.id} has non-string primary muscles`);
  }
  if (!normalized.steps.every((value) => typeof value === "string")) {
    throw new Error(`Exercise ${row.id} has non-string steps`);
  }
  if (!normalized.media.every((value) => value && typeof value === "object" && typeof value.gender === "string")) {
    throw new Error(`Exercise ${row.id} has invalid media entries`);
  }
  return normalized;
}

function getMediaSupplements() {
  const payload = JSON.parse(fs.readFileSync(mediaSupplementPath, "utf8"));
  return new Map((payload.results ?? []).map((exercise) => [Number(exercise.id), exercise]));
}

function applyMediaSupplement(row, supplements) {
  const supplement = supplements.get(Number(row.source_id));
  if (!supplement) return row;

  const media = [...row.media];
  for (const video of supplement.videos ?? []) {
    const storagePrefix = video.gender === "female" ? "exercises/musclewiki/female" : "exercises/musclewiki";
    const item = {
      gender: video.gender,
      angle: video.angle,
      videoUrl: video.url,
      storagePath: `${storagePrefix}/${row.source_id}-${video.angle}.mp4`,
    };
    const index = media.findIndex((candidate) => candidate?.gender === item.gender && candidate?.angle === item.angle);
    if (index < 0) media.push(item);
    else media[index] = { ...media[index], ...item };
  }

  const snapshot = row.source_snapshot && typeof row.source_snapshot === "object" ? row.source_snapshot : {};
  const snapshotVideos = Array.isArray(snapshot.videos) ? [...snapshot.videos] : [];
  for (const video of supplement.videos ?? []) {
    const index = snapshotVideos.findIndex((candidate) => candidate?.gender === video.gender && candidate?.angle === video.angle);
    if (index < 0) snapshotVideos.push(video);
    else snapshotVideos[index] = { ...snapshotVideos[index], ...video };
  }

  return { ...row, media, source_snapshot: { ...snapshot, videos: snapshotVideos } };
}

function requireValue(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing ${name} in .env.restore.local`);
  return value;
}

async function requireSuccess(promise, context) {
  const result = await promise;
  if (result.error) throw new Error(`${context}: ${result.error.message}`);
  return result;
}

const mediaSupplements = getMediaSupplements();
const exercises = readBackup("exercises.json").map(normalizeExercise).map((row) => applyMediaSupplement(row, mediaSupplements));
const exerciseTargets = readBackup("exercise_targets.json");
if (exercises.length !== 1946 || new Set(exercises.map((row) => row.id)).size !== 1946) {
  throw new Error("Exercise backup must contain 1,946 unique rows");
}
if (exerciseTargets.length !== 628 || new Set(exerciseTargets.map((row) => row.id)).size !== 628) {
  throw new Error("Exercise target backup must contain 628 unique rows");
}
const supplementedMaleMedia = exercises
  .find((row) => row.source === "musclewiki" && row.source_id === 256607817486275)
  ?.media.filter((item) => item?.gender === "male").length ?? 0;
if (supplementedMaleMedia !== 2) {
  throw new Error(`Landmine Rear Delt Row must contain 2 supplemented male videos; found ${supplementedMaleMedia}`);
}

if (!apply) {
  console.log(JSON.stringify({
    mode: "validate-only",
    repairExisting,
    exercises: exercises.length,
    exerciseTargets: exerciseTargets.length,
    supplementedMaleMedia,
  }, null, 2));
  process.exit(0);
}

loadEnvFile(path.join(projectRoot, ".env.restore.local"));
const url = requireValue("RESTORE_SUPABASE_URL");
const key = requireValue("RESTORE_SUPABASE_SECRET_KEY");
const targetProjectRef = new URL(url).hostname.split(".")[0];
if (!targetProjectRef || targetProjectRef === sourceProjectRef) {
  throw new Error("Restore target must be a new Supabase project, never the restricted source project");
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
  ...(key.startsWith("sb_secret_") ? {
    global: { fetch: async (input, init) => {
      const headers = new Headers(init?.headers);
      headers.delete("Authorization");
      return fetch(input, { ...init, headers });
    } },
  } : {}),
});

const existingExercises = await requireSuccess(
  supabase.from("exercises").select("id", { count: "exact", head: true }),
  "Check exercises table (run the schema bundle first)",
);
const existingTargets = await requireSuccess(
  supabase.from("exercise_targets").select("id", { count: "exact", head: true }),
  "Check exercise_targets table (run the schema bundle first)",
);
if (repairExisting) {
  if (existingExercises.count !== exercises.length || existingTargets.count !== exerciseTargets.length) {
    throw new Error(`Repair target count mismatch: exercises=${existingExercises.count}, targets=${existingTargets.count}`);
  }
} else if ((existingExercises.count ?? 0) !== 0 || (existingTargets.count ?? 0) !== 0) {
  throw new Error("Restore target is not empty; refusing to overwrite existing rows");
}

let restoredExercises = 0;
for (const batch of chunks(exercises, 100)) {
  const mutation = repairExisting
    ? supabase.from("exercises").upsert(batch, { onConflict: "id" })
    : supabase.from("exercises").insert(batch);
  await requireSuccess(mutation, repairExisting ? "Repair exercises" : "Insert exercises");
  restoredExercises += batch.length;
  console.log(JSON.stringify({
    [repairExisting ? "repairedExercises" : "restoredExercises"]: restoredExercises,
    totalExercises: exercises.length,
  }));
}

let restoredTargets = 0;
if (repairExisting) {
  restoredTargets = existingTargets.count ?? 0;
} else {
  for (const batch of chunks(exerciseTargets, 100)) {
    await requireSuccess(supabase.from("exercise_targets").insert(batch), "Insert exercise targets");
    restoredTargets += batch.length;
    console.log(JSON.stringify({ restoredTargets, totalTargets: exerciseTargets.length }));
  }
}

const verifiedExercises = await requireSuccess(
  supabase.from("exercises").select("id", { count: "exact", head: true }),
  "Verify exercises",
);
const verifiedTargets = await requireSuccess(
  supabase.from("exercise_targets").select("id", { count: "exact", head: true }),
  "Verify exercise targets",
);
if (verifiedExercises.count !== exercises.length || verifiedTargets.count !== exerciseTargets.length) {
  throw new Error(`Restore count mismatch: exercises=${verifiedExercises.count}, targets=${verifiedTargets.count}`);
}

const rearShoulderBarbell = await requireSuccess(
  supabase
    .from("exercises")
    .select("id, media", { count: "exact" })
    .eq("status", "Published")
    .overlaps("primary_muscles", ["Rear Shoulders"])
    .eq("category", "Barbell"),
  "Verify restored array fields",
);
const rearShoulderBarbellHasMaleMedia = rearShoulderBarbell.data?.some((row) => (
  Array.isArray(row.media) && row.media.some((item) => item?.gender === "male")
));
if (rearShoulderBarbell.count !== 1 || !rearShoulderBarbellHasMaleMedia) {
  throw new Error(`Restored array verification failed: rearShoulderBarbell=${rearShoulderBarbell.count}`);
}

console.log(JSON.stringify({
  mode: repairExisting ? "repaired-and-verified" : "restored-and-verified",
  targetProjectRef,
  exercises: verifiedExercises.count,
  exerciseTargets: verifiedTargets.count,
  rearShoulderBarbell: rearShoulderBarbell.count,
}, null, 2));
