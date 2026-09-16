import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
for (const line of fs.readFileSync(path.join(projectRoot, ".env.local"), "utf8").split(/\r?\n/)) {
  const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
  if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
}

const datasetPath = path.resolve(projectRoot, process.argv[2]);
const dataset = JSON.parse(fs.readFileSync(datasetPath, "utf8"));
const category = process.argv[3] || "";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const key = process.env.SUPABASE_SECRET_KEY?.trim() || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
if (!url || !key) throw new Error("Cần NEXT_PUBLIC_SUPABASE_URL và SUPABASE_SECRET_KEY trong .env.local");

const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
let query = supabase.from("exercises").select("source_id,name,category,source_snapshot").eq("source", "musclewiki");
if (category) query = query.eq("category", category);
const { data, error } = await query;
if (error) throw new Error(error.message);
const rowsById = new Map((data || []).map((row) => [String(row.source_id), row]));
const gaps = (dataset.results || [])
  .filter((record) => !rowsById.has(String(record.id)))
  .map((record) => ({ id: record.id, name: record.name, source_url: record.source_url }));
console.log(JSON.stringify({
  category: category || null,
  datasetRecords: (dataset.results || []).length,
  databaseRows: rowsById.size,
  databaseSamples: (data || []).slice(0, 5).map((row) => ({ source_id: row.source_id, source_id_string: String(row.source_id), name: row.name, category: row.category })),
  datasetSamples: (dataset.results || []).slice(0, 5).map((record) => ({ id: record.id, id_string: String(record.id), name: record.name })),
  gaps,
}, null, 2));
