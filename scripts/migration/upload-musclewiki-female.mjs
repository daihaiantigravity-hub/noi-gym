import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { chooseDraftSlug, femaleStoragePath, keepFemaleMediaAdminOnly, mergeFemaleMedia, missingFemaleVideos, newFemaleDraft, readMp4Duration, validateFemaleExercise, validateFemaleVideo } from "./female-media-import.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const bucket = "exercise-media";
const maxBytes = 32 * 1024 * 1024;
const args = process.argv.slice(2);
const options = { apply: false, dataset: "scripts/migration/data/female/musclewiki-female-import.json", limit: 0, offset: 0, concurrency: 4 };
for (let i = 0; i < args.length; i += 1) {
  const arg = args[i];
  if (arg === "--apply") options.apply = true;
  else if (["--dataset", "--limit", "--offset", "--concurrency"].includes(arg)) {
    const value = args[++i];
    if (!value) throw new Error(`${arg} needs a value`);
    options[arg.slice(2)] = arg === "--dataset" ? value : Number(value);
  } else throw new Error(`Unknown argument: ${arg}`);
}
if (![options.limit, options.offset, options.concurrency].every(Number.isSafeInteger) || options.limit < 0 || options.offset < 0 || options.concurrency < 1 || options.concurrency > 8) {
  throw new Error("Invalid --limit, --offset or --concurrency");
}

const datasetPath = path.isAbsolute(options.dataset) ? options.dataset : path.resolve(root, options.dataset);
const payload = JSON.parse(fs.readFileSync(datasetPath, "utf8"));
if (payload.gender !== "female" || !Array.isArray(payload.results)) throw new Error("Expected a female exercise dataset");
for (const exercise of payload.results) validateFemaleExercise(exercise);
const exercises = payload.results.slice(options.offset, options.limit ? options.offset + options.limit : undefined);
if (exercises.length === 0) throw new Error("No exercises selected");

const envPath = path.join(root, ".env.local");
if (fs.existsSync(envPath)) for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
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

async function readAllRows() {
  const rows = [];
  for (let start = 0; ; start += 500) {
    const { data, error } = await supabase.from("exercises").select("id,source,source_id,slug,status,media,updated_at").order("id").range(start, start + 499);
    if (error) throw new Error(error.message);
    rows.push(...(data || []));
    if (!data || data.length < 500) break;
  }
  return rows;
}

const allRows = await readAllRows();
const rowBySourceId = new Map(allRows.filter((row) => row.source === "musclewiki" && row.source_id != null).map((row) => [Number(row.source_id), row]));
const reservedSlugs = new Set(allRows.map((row) => row.slug));
const newSlugs = new Map();
for (const exercise of exercises) if (!rowBySourceId.has(exercise.id)) newSlugs.set(exercise.id, chooseDraftSlug(exercise, reservedSlugs));
const plan = {
  mode: options.apply ? "apply" : "dry-run",
  exercises: exercises.length,
  existingRows: exercises.filter((exercise) => rowBySourceId.has(exercise.id)).length,
  newDrafts: newSlugs.size,
  videosToUpload: exercises.reduce((sum, exercise) => sum + missingFemaleVideos(exercise, rowBySourceId.get(exercise.id)?.media).length, 0),
};
console.log(JSON.stringify(plan));
if (!options.apply) process.exit(0);

const storage = supabase.storage.from(bucket);
const logPath = path.join(root, "scripts/migration/data/female/upload-events.jsonl");
const totals = { exercises: 0, videosUploaded: 0, videosReused: 0, rowsUpdated: 0, draftsCreated: 0, failedVideos: 0, failedRows: 0 };
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function downloadVideo(sourceUrl) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(sourceUrl, { signal: AbortSignal.timeout(45000), headers: { Accept: "video/mp4", Referer: "https://musclewiki.com/", "User-Agent": "Mozilla/5.0" } });
      if (!response.ok) {
        if (response.status === 429 || response.status >= 500) throw new Error(`Source HTTP ${response.status}`);
        throw Object.assign(new Error(`Source HTTP ${response.status}`), { permanent: true });
      }
      const contentType = (response.headers.get("content-type") || "").split(";", 1)[0].toLowerCase();
      if (!["video/mp4", "application/octet-stream"].includes(contentType)) throw Object.assign(new Error(`Unexpected content type: ${contentType}`), { permanent: true });
      const declaredSize = Number(response.headers.get("content-length"));
      if (declaredSize > maxBytes) throw Object.assign(new Error(`Video exceeds 32MB: ${declaredSize}`), { permanent: true });
      const bytes = Buffer.from(await response.arrayBuffer());
      if (!bytes.length || bytes.length > maxBytes) throw Object.assign(new Error(`Invalid video size: ${bytes.length}`), { permanent: true });
      return { bytes, duration: readMp4Duration(bytes) };
    } catch (error) {
      if (error.permanent || attempt === 2) throw error;
      await sleep(500 * 2 ** attempt);
    }
  }
}

async function uploadVideo(exercise, video) {
  const sourceUrl = validateFemaleVideo(video);
  const storagePath = femaleStoragePath(exercise.id, video.angle);
  const { bytes, duration } = await downloadVideo(sourceUrl);
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const { error } = await storage.upload(storagePath, bytes, { cacheControl: "31536000", contentType: "video/mp4", upsert: false });
    if (!error) {
      totals.videosUploaded += 1;
      break;
    }
    if (String(error.statusCode) === "409") {
      const { data: info, error: infoError } = await storage.info(storagePath);
      if (infoError || !info || Number(info.size ?? 0) <= 0 || info.contentType !== "video/mp4") throw new Error(`Existing Storage object could not be verified: ${storagePath}`);
      totals.videosReused += 1;
      break;
    }
    if (attempt === 2 || !["429", "500", "502", "503", "504"].includes(String(error.statusCode))) throw new Error(`Storage upload failed for ${storagePath}: ${error.message}`);
    await sleep(500 * 2 ** attempt);
  }
  const { data } = storage.getPublicUrl(storagePath);
  return { gender: "female", angle: video.angle, videoUrl: data.publicUrl, storagePath, ...(duration <= 15 ? { duration } : {}) };
}

async function readLiveRow(sourceId) {
  const { data, error } = await supabase.from("exercises").select("id,source_id,status,media,updated_at").eq("source", "musclewiki").eq("source_id", sourceId).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

async function updateMediaWithoutChangingOtherFields(sourceId, incoming) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const row = await readLiveRow(sourceId);
    if (!row) return false;
    const media = keepFemaleMediaAdminOnly(mergeFemaleMedia(row.media, incoming));
    if (JSON.stringify(media) === JSON.stringify(row.media)) return true;
    const { data, error } = await supabase.from("exercises").update({ media }).eq("id", row.id).eq("updated_at", row.updated_at).select("id,status,media").maybeSingle();
    if (error) throw new Error(`Media update failed for ${sourceId}: ${error.message}`);
    if (!data) continue;
    if (data.status !== row.status || JSON.stringify(data.media.filter((item) => item.gender !== "female")) !== JSON.stringify((row.media || []).filter((item) => item.gender !== "female"))) {
      throw new Error(`Existing status or non-female media changed for ${sourceId}`);
    }
    totals.rowsUpdated += 1;
    return true;
  }
  throw new Error(`Concurrent edits prevented update for ${sourceId}`);
}

async function processExercise(exercise) {
  const initial = rowBySourceId.get(exercise.id);
  const missing = missingFemaleVideos(exercise, initial?.media);
  const uploaded = [];
  const errors = [];
  for (const video of missing) {
    try { uploaded.push(await uploadVideo(exercise, video)); }
    catch (error) { errors.push({ angle: video.angle, message: String(error.message || error) }); totals.failedVideos += 1; }
  }
  try {
    if (initial) {
      if (uploaded.length) await updateMediaWithoutChangingOtherFields(exercise.id, uploaded);
    } else {
      const row = newFemaleDraft(exercise, newSlugs.get(exercise.id), keepFemaleMediaAdminOnly(uploaded));
      const { error } = await supabase.from("exercises").insert(row);
      if (error) {
        if (String(error.code) === "23505" && await readLiveRow(exercise.id)) await updateMediaWithoutChangingOtherFields(exercise.id, uploaded);
        else throw new Error(`Draft insert failed for ${exercise.id}: ${error.message}`);
      } else totals.draftsCreated += 1;
    }
  } catch (error) {
    errors.push({ row: true, message: String(error.message || error) });
    totals.failedRows += 1;
  }
  totals.exercises += 1;
  fs.appendFileSync(logPath, `${JSON.stringify({ time: new Date().toISOString(), sourceId: exercise.id, uploaded: uploaded.length, errors })}\n`);
  if (totals.exercises % 25 === 0 || totals.exercises === exercises.length) console.log(JSON.stringify({ progress: `${totals.exercises}/${exercises.length}`, ...totals }));
}

let next = 0;
await Promise.all(Array.from({ length: Math.min(options.concurrency, exercises.length) }, async () => {
  while (next < exercises.length) {
    const exercise = exercises[next++];
    await processExercise(exercise);
  }
}));
console.log(JSON.stringify({ complete: true, ...totals, logPath }));
if (totals.failedVideos || totals.failedRows) process.exitCode = 1;
