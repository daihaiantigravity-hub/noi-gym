import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { buildFemaleMergePlan } from "./female-merge-plan.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const femaleDir = path.join(projectRoot, "scripts/migration/data/female");
const read = (name) => JSON.parse(fs.readFileSync(path.join(femaleDir, name), "utf8"));
const live = process.argv.slice(2).includes("--live");
if (process.argv.slice(2).some((arg) => arg !== "--live")) throw new Error("Only --live is supported");

async function readLiveRows() {
  const envPath = path.join(projectRoot, ".env.local");
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
    }
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SECRET_KEY?.trim() || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) throw new Error("Supabase read credentials are unavailable");
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
    const { data, error } = await supabase.from("exercises").select("id,source,source_id,status,media").eq("source", "musclewiki").order("source_id").range(start, start + 499);
    if (error) throw new Error(error.message);
    rows.push(...(data || []));
    if (!data || data.length < 500) break;
  }
  return rows;
}

const databaseRows = live ? await readLiveRows() : read("database-before.json");
const female = read("musclewiki-female-import.json");
const plan = buildFemaleMergePlan(female.results, databaseRows);
const outputPath = path.join(femaleDir, "merge-readiness.json");
fs.writeFileSync(outputPath, `${JSON.stringify({ ...plan, databaseSource: live ? "live-read-only" : "database-before.json", databaseRowsChecked: databaseRows.length, plannedAt: new Date().toISOString() }, null, 2)}\n`);
console.log(JSON.stringify(plan.summary, null, 2));
