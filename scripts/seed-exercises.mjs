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
  return { gender: video.gender, angle: video.angle, videoUrl: video.url ?? "", posterUrl: video.og_image ?? "" };
}

loadLocalEnv();
const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
if (!url || !key) throw new Error("Cần NEXT_PUBLIC_SUPABASE_URL và SUPABASE_SERVICE_ROLE_KEY trong .env.local");

const sourcePath = path.join(projectRoot, "data", "musclewiki-exercises-collected.json");
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

const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
for (let index = 0; index < rows.length; index += 50) {
  const chunk = rows.slice(index, index + 50);
  const { error } = await supabase.from("exercises").upsert(chunk, { onConflict: "source,source_id" });
  if (error) throw new Error(error.message);
  console.log(`Seeded ${Math.min(index + chunk.length, rows.length)}/${rows.length}`);
}

console.log(`Done. Imported ${rows.length} exercises as Draft.`);
