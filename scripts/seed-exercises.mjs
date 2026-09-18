import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

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
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function normalizeVideo(video) {
  if (!video || !["male", "female"].includes(video.gender) || !["front", "side"].includes(video.angle)) return null;
  if (!video.url && !video.og_image) return null;
  return {
    gender: video.gender,
    angle: video.angle,
    videoUrl: video.url ?? "",
    ...(video.og_image ? { posterUrl: video.og_image } : {}),
  };
}

function mergeMedia(existing, incoming) {
  const media = Array.isArray(existing) ? [...existing] : [];
  for (const item of incoming) {
    const index = media.findIndex((candidate) => candidate.gender === item.gender && candidate.angle === item.angle);
    if (index < 0) {
      media.push(item);
      continue;
    }
    if (!media[index].videoUrl) media[index] = { ...media[index], ...item };
  }
  return media;
}

function parseArgs(argv) {
  const options = { dataset: "" };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--dataset") {
      options.dataset = argv[++index] || "";
      if (!options.dataset) throw new Error("--dataset cần một đường dẫn");
      continue;
    }
    throw new Error(`Unknown argument: ${argument}`);
  }
  return options;
}

loadLocalEnv();
const options = parseArgs(process.argv.slice(2));
const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const key = process.env.SUPABASE_SECRET_KEY?.trim() || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
if (!url || !key) throw new Error("Cần NEXT_PUBLIC_SUPABASE_URL và SUPABASE_SECRET_KEY trong .env.local");

const sourceCandidates = options.dataset
  ? [path.isAbsolute(options.dataset) ? options.dataset : path.resolve(projectRoot, options.dataset)]
  : [
      path.join(projectRoot, "scripts", "migration", "data", "musclewiki-exercises-collected.json"),
      path.join(projectRoot, "data", "musclewiki-exercises-collected.json"),
    ];
const sourcePath = sourceCandidates.find((candidate) => fs.existsSync(candidate));
if (!sourcePath) {
  throw new Error("Không tìm thấy dataset MuscleWiki. Hãy chạy npm run prepare:musclewiki-import trước.");
}
const payload = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
const exercises = Array.isArray(payload.results) ? payload.results : [];
const rows = exercises.map((exercise) => ({
  source: "musclewiki",
  source_id: exercise.id,
  name: exercise.name,
  slug: slugify(exercise.name),
  description: "",
  primary_muscles: exercise.primary_muscles ?? [],
  category: exercise.category ?? "",
  force: ["Push", "Pull", "Hold"].includes(exercise.force) ? exercise.force : null,
  grips: ["Mixed", "Neutral", "None", "Overhand", "Underhand"].includes(exercise.grips) ? exercise.grips : null,
  mechanic: ["Compound", "Isolation"].includes(exercise.mechanic) ? exercise.mechanic : null,
  difficulty: ["Beginner", "Novice", "Intermediate", "Advanced"].includes(exercise.difficulty) ? exercise.difficulty : "",
  status: "Draft",
  steps: Array.isArray(exercise.steps) ? exercise.steps.filter(Boolean) : [],
  media: Array.isArray(exercise.videos) ? exercise.videos.map(normalizeVideo).filter(Boolean) : [],
  source_snapshot: exercise,
}));

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
  ...(key.startsWith("sb_secret_")
    ? {
        global: {
          fetch: async (input, init) => {
            const headers = new Headers(init?.headers);
            headers.delete("Authorization");
            return fetch(input, { ...init, headers });
          },
        },
      }
    : {}),
});

const { data: existingRows, error: existingRowsError } = await supabase
  .from("exercises")
  .select("source, source_id, slug, primary_muscles, media");
if (existingRowsError) throw new Error(existingRowsError.message);

const existingBySourceKey = new Map(
  (existingRows ?? []).map((row) => [`${row.source}:${row.source_id}`, row]),
);
const reservedSlugs = new Set((existingRows ?? []).map((row) => row.slug).filter(Boolean));
for (const row of rows) {
  const existing = existingBySourceKey.get(`${row.source}:${row.source_id}`);
  if (Array.isArray(existing?.primary_muscles) && existing.primary_muscles.length > 0) {
    row.primary_muscles = [...new Set([...existing.primary_muscles, ...row.primary_muscles])];
  }
  row.media = mergeMedia(existing?.media, row.media);
  if (existing?.slug) {
    row.slug = existing.slug;
    continue;
  }

  const baseSlug = row.slug;
  let candidateSlug = baseSlug;
  let suffix = 1;
  while (reservedSlugs.has(candidateSlug)) {
    suffix += 1;
    candidateSlug = `${baseSlug}-musclewiki${suffix > 2 ? `-${suffix - 1}` : ""}`;
  }
  row.slug = candidateSlug;
  reservedSlugs.add(candidateSlug);
}

for (let index = 0; index < rows.length; index += 50) {
  const chunk = rows.slice(index, index + 50);
  const { error } = await supabase.from("exercises").upsert(chunk, { onConflict: "source,source_id" });
  if (error) throw new Error(error.message);
  console.log(`Seeded ${Math.min(index + chunk.length, rows.length)}/${rows.length}`);
}

console.log(`Done. Imported ${rows.length} exercises as Draft.`);
