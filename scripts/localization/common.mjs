import nextEnv from "@next/env";
import { createClient } from "@supabase/supabase-js";

export function createLocalizationClient() {
  nextEnv.loadEnvConfig(process.cwd(), false, { info() {}, error() {} });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SECRET_KEY?.trim() || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) throw new Error("Server-side Supabase configuration is required");
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { fetch: (input, init) => {
      const headers = new Headers(init?.headers);
      if (key.startsWith("sb_secret_")) headers.delete("Authorization");
      return fetch(input, { ...init, headers, signal: AbortSignal.timeout(30000) });
    } },
  });
}

export async function readExerciseSources(client) {
  const rows = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await client.from("exercises")
      .select("id,source,source_id,name,description,steps,category,primary_muscles,status,media,updated_at")
      .order("id").range(offset, offset + 499);
    if (error) throw new Error(`Unable to read exercise inventory (${error.code ?? "unknown"})`);
    rows.push(...data);
    if (data.length < 500) break;
  }
  return rows;
}

export function readOption(args, key, fallback) {
  const index = args.indexOf(key);
  if (index === -1) return fallback;
  if (!args[index + 1] || args[index + 1].startsWith("--")) throw new Error(`${key} requires a value`);
  return args[index + 1];
}
