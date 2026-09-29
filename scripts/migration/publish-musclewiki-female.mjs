import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { buildFemalePublishPlan } from "./female-publish-plan.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const dataDir = path.join(projectRoot, "scripts/migration/data/female");
const apply = process.argv.includes("--apply");

function loadLocalEnv() {
  const envPath = path.join(projectRoot, ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
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

function requireSuccess(result, context) {
  if (result.error) throw new Error(`${context}: ${result.error.message}`);
  return result.data ?? [];
}

loadLocalEnv();
const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const key = process.env.SUPABASE_SECRET_KEY?.trim() || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
if (!url || !key) throw new Error("Missing Supabase URL or admin key in .env.local");
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

const dataset = JSON.parse(fs.readFileSync(path.join(dataDir, "musclewiki-female-import.json"), "utf8"));
const readiness = JSON.parse(fs.readFileSync(path.join(dataDir, "merge-readiness.json"), "utf8"));
const draftSourceIds = readiness.newExercises.map((entry) => entry.sourceId);
if (draftSourceIds.length !== 242 || new Set(draftSourceIds).size !== 242) throw new Error("Unexpected original Draft count");
const sourceById = new Map(dataset.results.map((entry) => [entry.id, entry]));
const rows = [];
for (const sourceIdChunk of chunks(draftSourceIds, 40)) {
  rows.push(...requireSuccess(await supabase.from("exercises")
    .select("id,source,source_id,name,primary_muscles,category,difficulty,status,steps,media,source_snapshot,updated_at")
    .eq("source", "musclewiki")
    .in("source_id", sourceIdChunk), "Read exercises"));
}
if (rows.length !== 242) throw new Error(`Expected 242 rows, found ${rows.length}`);
const rowsBySourceId = new Map(rows.map((row) => [Number(row.source_id), row]));
if (rowsBySourceId.size !== 242) throw new Error("Duplicate source IDs in database");

const plan = draftSourceIds.map((sourceId) => {
  const source = sourceById.get(sourceId);
  const row = rowsBySourceId.get(sourceId);
  if (!source || !row || row.source !== "musclewiki" || row.source_snapshot?.id !== sourceId) {
    throw new Error(`Source/database mismatch for ${sourceId}`);
  }
  const planned = buildFemalePublishPlan(source);
  const femaleMedia = (row.media ?? []).filter((item) => item.gender === "female");
  for (const angle of ["front", "side"]) {
    if (!femaleMedia.some((item) => item.angle === angle
      && item.storagePath === `exercises/musclewiki/female/${sourceId}-${angle}.mp4`)) {
      throw new Error(`Missing uploaded female ${angle} video for ${sourceId}`);
    }
  }
  if (!Array.isArray(row.steps) || row.steps.length === 0 || !row.difficulty) {
    throw new Error(`Database steps/difficulty incomplete for ${sourceId}`);
  }
  if (row.status !== "Draft" && row.status !== "Published") throw new Error(`Unexpected status for ${sourceId}: ${row.status}`);
  if (row.status === "Published" && (row.category !== planned.category
    || JSON.stringify(row.primary_muscles ?? []) !== JSON.stringify(planned.primaryMuscles))) {
    throw new Error(`Already Published metadata differs for ${sourceId}`);
  }
  return { ...planned, databaseId: row.id, statusBefore: row.status, updatedAt: row.updated_at };
});

const summary = {
  sourceRows: plan.length,
  draftsToPublish: plan.filter((item) => item.statusBefore === "Draft").length,
  alreadyPublished: plan.filter((item) => item.statusBefore === "Published").length,
  categories: Object.fromEntries([...new Set(plan.map((item) => item.category))].map((category) => [category, plan.filter((item) => item.category === category).length])),
  muscleSources: Object.fromEntries([...new Set(plan.map((item) => item.muscleSource))].map((source) => [source, plan.filter((item) => item.muscleSource === source).length])),
  targetLinks: plan.reduce((count, item) => count + item.targets.length, 0),
};
const reportPath = path.join(dataDir, "publish-plan.json");
fs.writeFileSync(reportPath, `${JSON.stringify({ generatedAt: new Date().toISOString(), summary, plan }, null, 2)}\n`);
console.log(JSON.stringify({ mode: apply ? "apply" : "dry-run", reportPath, summary }, null, 2));
if (!apply) process.exit(0);

const targetRows = plan.flatMap((item) => item.targets.map((target) => ({
  exercise_id: item.databaseId, mode: target.mode, slug: target.slug,
  label: target.label, source: "musclewiki", source_url: target.source_url,
})));
for (const targetChunk of chunks(targetRows, 100)) {
  requireSuccess(await supabase.from("exercise_targets").upsert(targetChunk, { onConflict: "exercise_id,mode,slug" }), "Upsert target links");
}

let published = 0;
for (const batch of chunks(plan.filter((item) => item.statusBefore === "Draft"), 8)) {
  await Promise.all(batch.map(async (item) => {
    const changed = requireSuccess(await supabase.from("exercises")
      .update({ primary_muscles: item.primaryMuscles, category: item.category, status: "Published" })
      .eq("id", item.databaseId)
      .eq("status", "Draft")
      .eq("updated_at", item.updatedAt)
      .select("id"), `Publish ${item.sourceId}`);
    if (changed.length !== 1) throw new Error(`Concurrent change prevented publication for ${item.sourceId}`);
    published += 1;
  }));
  console.log(`Published ${published}/${summary.draftsToPublish}`);
}

const publishedRows = [];
for (const sourceIdChunk of chunks(draftSourceIds, 40)) {
  publishedRows.push(...requireSuccess(await supabase.from("exercises")
    .select("source_id,status,category,primary_muscles,media")
    .eq("source", "musclewiki")
    .in("source_id", sourceIdChunk), "Verify published exercises"));
}
if (publishedRows.length !== 242 || publishedRows.some((row) => row.status !== "Published")) {
  throw new Error("Post-publication status verification failed");
}
const targetExerciseIds = new Set(targetRows.map((item) => item.exercise_id));
if (targetExerciseIds.size > 0) {
  let observedTargetLinks = 0;
  for (const idChunk of chunks([...targetExerciseIds], 40)) {
    const targetLinks = requireSuccess(await supabase.from("exercise_targets")
      .select("exercise_id,mode,slug").in("exercise_id", idChunk), "Verify target links");
    const expected = new Set(targetRows.filter((item) => idChunk.includes(item.exercise_id))
      .map((item) => `${item.exercise_id}/${item.mode}/${item.slug}`));
    for (const link of targetLinks) expected.delete(`${link.exercise_id}/${link.mode}/${link.slug}`);
    if (expected.size) throw new Error(`Missing target links: ${[...expected].join(", ")}`);
    observedTargetLinks += targetLinks.length;
  }
  console.log(`Verified target links: ${observedTargetLinks}`);
}
console.log(JSON.stringify({ published, verifiedPublished: publishedRows.length, targetLinksExpected: targetRows.length }, null, 2));
