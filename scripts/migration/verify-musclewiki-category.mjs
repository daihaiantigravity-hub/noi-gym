import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
for (const line of fs.readFileSync(path.join(projectRoot, ".env.local"), "utf8").split(/\r?\n/)) {
  const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
  if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const key = process.env.SUPABASE_SECRET_KEY?.trim() || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const category = process.argv[2] || "Barbell";
if (!url || !key) throw new Error("Cần NEXT_PUBLIC_SUPABASE_URL và SUPABASE_SECRET_KEY trong .env.local");

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

const { data, error } = await supabase
  .from("exercises")
  .select("source_id,name,primary_muscles,category,status,steps,media")
  .eq("source", "musclewiki")
  .eq("category", category);
if (error) throw new Error(error.message);

const rows = data || [];
const statuses = {};
const muscleCounts = {};
for (const row of rows) {
  statuses[row.status] = (statuses[row.status] || 0) + 1;
  for (const muscle of row.primary_muscles || []) muscleCounts[muscle] = (muscleCounts[muscle] || 0) + 1;
}
console.log(JSON.stringify({
  category,
  rows: rows.length,
  uniqueSourceIds: new Set(rows.map((row) => String(row.source_id))).size,
  statuses,
  videos: rows.reduce((sum, row) => sum + (row.media || []).filter((item) => item.videoUrl).length, 0),
  completeMedia: rows.filter((row) => (row.media || []).filter((item) => item.videoUrl).length >= 2).length,
  withSteps: rows.filter((row) => (row.steps || []).length > 0).length,
  muscleCounts,
}, null, 2));
