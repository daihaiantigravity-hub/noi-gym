import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import nextEnv from "@next/env";
import { createClient } from "@supabase/supabase-js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const directory = path.join(root, "scripts/migration/data");
const output = path.join(directory, "female");
fs.mkdirSync(output, { recursive: true });
const sha = (value) => crypto.createHash("sha256").update(value).digest("hex");
const files = fs.readdirSync(directory).filter((name) => name.endsWith(".json")).sort();
const baseline = Object.fromEntries(files.map((name) => [name, sha(fs.readFileSync(path.join(directory, name)))]));
const records = new Map();
const checkpoints = [];
const errors = [];
for (const name of files) {
  let payload;
  try { payload = JSON.parse(fs.readFileSync(path.join(directory, name), "utf8")); }
  catch (error) { errors.push({ file: name, error: error.message }); continue; }
  if (name.endsWith(".checkpoint.json")) {
    checkpoints.push({ file: name, source: payload.source, status: payload.status, listingDone: payload.listingDone, nextPageUrl: payload.nextPageUrl, pages: payload.pages?.length ?? 0, candidates: payload.candidates?.length ?? 0 });
  }
  if (!Array.isArray(payload.results)) continue;
  for (const item of payload.results) {
    const key = item.source_url || String(item.id);
    if (!records.has(key)) records.set(key, { sourceId: item.id, sourceUrl: item.source_url, name: item.name, category: item.category, primaryMuscles: [], steps: [], videos: [], files: [] });
    const record = records.get(key);
    record.primaryMuscles = [...new Set([...record.primaryMuscles, ...(item.primary_muscles || [])])];
    if ((item.steps?.length || 0) > record.steps.length) record.steps = item.steps;
    for (const video of item.videos || []) {
      if (video.url && !record.videos.some((existing) => existing.url === video.url)) record.videos.push(video);
    }
    record.files.push(name);
  }
}
function summarize(items) {
  const categories = {};
  const genders = {};
  const statuses = {};
  for (const item of items) {
    const category = categories[item.category || "Unknown"] ||= { exercises: 0, withSteps: 0, maleVideos: 0, femaleVideos: 0, otherVideos: 0 };
    category.exercises++;
    if (item.steps?.length) category.withSteps++;
    if (item.status) statuses[item.status] = (statuses[item.status] || 0) + 1;
    for (const video of item.videos || item.media || []) {
      if (!video.url && !video.videoUrl) continue;
      genders[video.gender || "unknown"] = (genders[video.gender || "unknown"] || 0) + 1;
      category[video.gender === "male" ? "maleVideos" : video.gender === "female" ? "femaleVideos" : "otherVideos"]++;
    }
  }
  return { exercises: items.length, categories, videosByGender: genders, statuses, withoutSteps: items.filter((item) => !item.steps?.length).length };
}
const localRecords = [...records.values()];
const report = { capturedAt: new Date().toISOString(), localFiles: files.length, local: summarize(localRecords), checkpointCount: checkpoints.length, incompleteCheckpoints: checkpoints.filter((item) => item.status !== "complete" || !item.listingDone || item.nextPageUrl), parseErrors: errors };
const databaseRows = [];
try {
  nextEnv.loadEnvConfig(root, false, { info() {}, error() {} });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SECRET_KEY?.trim() || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) throw new Error("Supabase server credentials are not configured.");
  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { fetch: (input, init) => {
      const headers = new Headers(init?.headers);
      if (key.startsWith("sb_secret_")) headers.delete("Authorization");
      return fetch(input, { ...init, headers, signal: AbortSignal.timeout(30000) });
    } },
  });
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await supabase.from("exercises").select("id,source,source_id,name,slug,primary_muscles,category,status,steps,media,updated_at").order("id").range(offset, offset + 499);
    if (error) throw new Error(error.message);
    databaseRows.push(...data);
    if (data.length < 500) break;
  }
  report.database = summarize(databaseRows);
  const sourceIds = new Set(databaseRows.filter((row) => row.source === "musclewiki").map((row) => String(row.source_id)));
  report.localMissingInDatabase = localRecords.filter((record) => !sourceIds.has(String(record.sourceId))).map(({ sourceId, name, category }) => ({ sourceId, name, category }));
} catch (error) {
  report.databaseError = error.message;
}
for (const [name, payload] of Object.entries({ "audit-before.json": report, "local-inventory.json": localRecords, "database-before.json": databaseRows, "male-files-sha256.json": baseline })) {
  const filename = path.join(output, name);
  if (fs.existsSync(filename)) throw new Error(`Preserving existing baseline: ${filename}`);
  fs.writeFileSync(filename, `${JSON.stringify(payload, null, 2)}\n`);
}
console.log(JSON.stringify(report, null, 2));
