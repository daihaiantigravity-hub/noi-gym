import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const crawlPath = path.join(projectRoot, "scripts", "migration", "data", "musclewiki-target-crawl.json");
const fullImportPath = path.join(projectRoot, "scripts", "migration", "data", "musclewiki-target-exercises-import.json");
const uploadImportPath = path.join(projectRoot, "scripts", "migration", "data", "musclewiki-target-new-import.json");

const advancedLabels = {
  neck: "Neck",
  feet: "Feet",
  groin: "Groin",
  "upper-trapezius": "Upper Traps",
  gastrocnemius: "Gastrocnemius",
  tibialis: "Tibialis",
  soleus: "Soleus",
  "outer-quadricep": "Outer Quadriceps",
  "rectus-femoris": "Rectus Femoris",
  "inner-quadricep": "Inner Quadriceps",
  "inner-thigh": "Inner Thigh",
  "wrist-extensors": "Wrist Extensors",
  "wrist-flexors": "Wrist Flexors",
  "long-head-bicep": "Long Head Bicep",
  "short-head-bicep": "Short Head Bicep",
  obliques: "Obliques",
  "lower-abdominals": "Lower Abdominals",
  "upper-abdominals": "Upper Abdominals",
  "mid-lower-pectoralis": "Mid and Lower Chest",
  "upper-pectoralis": "Upper Pectoralis",
  "anterior-deltoid": "Anterior Deltoid",
  "lateral-deltoid": "Lateral Deltoid",
  hands: "Hands",
};

const jointLabels = {
  shoulders: "Shoulders",
  elbow: "Elbow",
  wrist: "Wrist",
  hips: "Hips",
  knees: "Knees",
  ankles: "Ankles",
};

const equipmentPrefixes = [
  ["smith-machine", "Smith Machine"],
  ["medicine-ball", "Medicine Ball"],
  ["bosu-ball", "Bosu Ball"],
  ["bodyweight", "Bodyweight"],
  ["dumbbells", "Dumbbells"],
  ["kettlebells", "Kettlebells"],
  ["barbell", "Barbell"],
  ["stretches", "Stretches"],
  ["cables", "Cables"],
  ["band", "Band"],
  ["plate", "Plate"],
  ["trx", "TRX"],
  ["yoga", "Yoga"],
  ["cardio", "Cardio"],
  ["recovery", "Recovery"],
  ["pilates", "Pilates"],
];

function loadLocalEnv() {
  const envPath = path.join(projectRoot, ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
  }
}

function slugify(value) {
  return String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function stableSourceId(sourceUrl) {
  const digest = crypto.createHash("sha256").update(sourceUrl).digest("hex").slice(0, 12);
  return Number.parseInt(digest, 16) + 1;
}

function clean(value) {
  return String(value ?? "").replace(/\u00a0/g, " ").replace(/[ \t]+/g, " ").trim();
}

function inferCategory(exercise, fallback) {
  for (const [prefix, label] of equipmentPrefixes) {
    if ((exercise.media ?? []).some((item) => String(item.url ?? "").includes(`/male-${prefix}-`))) return label;
  }
  return fallback;
}

function normalizeMediaForImport(exercise) {
  return (exercise.media ?? [])
    .filter((item) => item?.url)
    .map((item) => ({
      gender: "male",
      angle: /-side(?:[_./?]|$)/i.test(item.url) ? "side" : "front",
      url: item.url,
    }));
}

function emptyPayload() {
  return { total: 0, limit: 0, offset: 0, count: 0, results: [] };
}

function parseCrawl() {
  if (!fs.existsSync(crawlPath)) throw new Error(`Không tìm thấy dữ liệu crawl: ${crawlPath}`);
  const crawl = JSON.parse(fs.readFileSync(crawlPath, "utf8"));
  const exercisesByUrl = new Map();
  const targetLinksByUrl = new Map();

  for (const [slug, collection] of Object.entries(crawl.advanced ?? {})) {
    for (const exercise of collection.exercises ?? []) {
      if (!exercise?.sourceUrl || !exercise.name) continue;
      exercisesByUrl.set(exercise.sourceUrl, exercise);
      const links = targetLinksByUrl.get(exercise.sourceUrl) ?? [];
      links.push({ mode: "advanced", slug, label: advancedLabels[slug] ?? slug, sourceUrl: `https://musclewiki.com/exercises/${slug}` });
      targetLinksByUrl.set(exercise.sourceUrl, links);
    }
  }
  for (const [slug, collection] of Object.entries(crawl.joints ?? {})) {
    for (const exercise of collection.exercises ?? []) {
      if (!exercise?.sourceUrl || !exercise.name) continue;
      exercisesByUrl.set(exercise.sourceUrl, exercise);
      const links = targetLinksByUrl.get(exercise.sourceUrl) ?? [];
      links.push({ mode: "joint", slug, label: jointLabels[slug] ?? slug, sourceUrl: `https://musclewiki.com/exercises/${slug}/recovery` });
      targetLinksByUrl.set(exercise.sourceUrl, links);
    }
  }
  return { exercises: [...exercisesByUrl.values()], targetLinksByUrl };
}

function createSupabaseAdminClient(url, key) {
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
    ...(key.startsWith("sb_secret_")
      ? { global: { fetch: async (input, init) => { const headers = new Headers(init?.headers); headers.delete("Authorization"); return fetch(input, { ...init, headers }); } } }
      : {}),
  });
}

function chunk(items, size) {
  const result = [];
  for (let index = 0; index < items.length; index += size) result.push(items.slice(index, index + size));
  return result;
}

loadLocalEnv();
const prepareOnly = process.argv.includes("--prepare-only");
const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const key = process.env.SUPABASE_SECRET_KEY?.trim() || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
if (!url || !key) throw new Error("Cần NEXT_PUBLIC_SUPABASE_URL và SUPABASE_SECRET_KEY trong .env.local");

const { exercises, targetLinksByUrl } = parseCrawl();
const supabase = createSupabaseAdminClient(url, key);
const sourceIds = exercises.map((exercise) => stableSourceId(exercise.sourceUrl));
const { data: existingRows, error: existingError } = await supabase
  .from("exercises")
  .select("id, source, source_id, slug, name, category, difficulty, steps, media, primary_muscles, status, source_snapshot")
  .in("source_id", sourceIds);
if (existingError) throw new Error(existingError.message);
if (!prepareOnly) {
  const { error: targetTableError } = await supabase.from("exercise_targets").select("id").limit(1);
  if (targetTableError) throw new Error(`Chưa có bảng exercise_targets. Hãy chạy supabase/migrations/20260916_create_exercise_targets.sql trước: ${targetTableError.message}`);
}

const existingBySourceId = new Map((existingRows ?? []).map((row) => [String(row.source_id), row]));
const reservedSlugs = new Set();
const { data: allSlugRows, error: slugError } = await supabase.from("exercises").select("slug");
if (slugError) throw new Error(slugError.message);
for (const row of allSlugRows ?? []) if (row.slug) reservedSlugs.add(row.slug);

const rows = [];
const fullImport = emptyPayload();
const newImport = emptyPayload();
const newSourceIds = new Set();
const targetRowsBySourceId = new Map();

for (const exercise of exercises) {
  const sourceId = stableSourceId(exercise.sourceUrl);
  const existing = existingBySourceId.get(String(sourceId));
  const category = existing?.category || inferCategory(exercise, "");
  const difficulty = existing?.difficulty || clean(exercise.difficulty);
  const steps = Array.isArray(existing?.steps) && existing.steps.length > 0 ? existing.steps : (exercise.steps ?? []).map(clean).filter(Boolean);
  const sourceSnapshot = { ...exercise, source_url: exercise.sourceUrl };

  if (existing && existing.source !== "musclewiki") throw new Error(`source_id collision với record không phải MuscleWiki: ${sourceId}`);
  let rowSlug = existing?.slug || slugify(exercise.name);
  if (!existing) {
    const baseSlug = rowSlug;
    let suffix = 1;
    while (reservedSlugs.has(rowSlug)) rowSlug = `${baseSlug}-musclewiki-${++suffix}`;
    reservedSlugs.add(rowSlug);
    newSourceIds.add(String(sourceId));
  }

  const row = {
    source: "musclewiki",
    source_id: sourceId,
    name: existing?.name || exercise.name,
    slug: rowSlug,
    description: "",
    primary_muscles: existing?.primary_muscles ?? [],
    category,
    force: null,
    grips: null,
    mechanic: null,
    difficulty,
    status: existing?.status || "Draft",
    steps,
    media: existing?.media ?? [],
    source_snapshot: existing?.source_snapshot ?? sourceSnapshot,
  };
  rows.push(row);
  const importRecord = {
    id: sourceId,
    name: exercise.name,
    primary_muscles: row.primary_muscles,
    category,
    force: "",
    grips: "",
    mechanic: "",
    difficulty,
    steps,
    videos: normalizeMediaForImport(exercise),
    source_url: exercise.sourceUrl,
  };
  fullImport.results.push(importRecord);
  if (newSourceIds.has(String(sourceId))) newImport.results.push(importRecord);
  targetRowsBySourceId.set(String(sourceId), (targetLinksByUrl.get(exercise.sourceUrl) ?? []).map((target) => ({ ...target, sourceId })));
}

for (const payload of [fullImport, newImport]) {
  payload.total = payload.results.length;
  payload.limit = payload.results.length;
  payload.count = payload.results.length;
}
fs.writeFileSync(fullImportPath, `${JSON.stringify(fullImport, null, 2)}\n`, "utf8");
fs.writeFileSync(uploadImportPath, `${JSON.stringify(newImport, null, 2)}\n`, "utf8");

if (prepareOnly) {
  console.log(JSON.stringify({ fullImportPath, uploadImportPath, exercises: fullImport.results.length, newExercises: newImport.results.length }, null, 2));
  process.exit(0);
}

for (const rowsChunk of chunk(rows, 50)) {
  const { error } = await supabase.from("exercises").upsert(rowsChunk, { onConflict: "source,source_id" });
  if (error) throw new Error(error.message);
}

const { data: importedRows, error: importedError } = await supabase
  .from("exercises")
  .select("id, source_id")
  .eq("source", "musclewiki")
  .in("source_id", sourceIds);
if (importedError) throw new Error(importedError.message);
const idsBySourceId = new Map((importedRows ?? []).map((row) => [String(row.source_id), row.id]));
const targetRows = [];
for (const links of targetRowsBySourceId.values()) {
  for (const target of links) {
    const exerciseId = idsBySourceId.get(String(target.sourceId));
    if (!exerciseId) throw new Error(`Không tìm thấy exercise_id cho source_id=${target.sourceId}`);
    targetRows.push({ exercise_id: exerciseId, mode: target.mode, slug: target.slug, label: target.label, source: "musclewiki", source_url: target.sourceUrl });
  }
}
for (const targetChunk of chunk(targetRows, 100)) {
  const { error } = await supabase.from("exercise_targets").upsert(targetChunk, { onConflict: "exercise_id,mode,slug" });
  if (error) throw new Error(error.message);
}

console.log(JSON.stringify({
  crawlExercises: exercises.length,
  newExercises: newImport.results.length,
  existingExercisesUpdated: fullImport.results.length - newImport.results.length,
  targetLinks: targetRows.length,
  fullImportPath,
  uploadImportPath,
}, null, 2));
