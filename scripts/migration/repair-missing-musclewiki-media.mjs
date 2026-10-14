import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createClient } from "@supabase/supabase-js";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const defaultDatasetPath = path.join(projectRoot, "scripts", "migration", "data", "musclewiki-missing-male-media.json");

function loadLocalEnv() {
  const envPath = path.join(projectRoot, ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
  }
}

function parseArgs(argv) {
  const options = { apply: false, dataset: defaultDatasetPath };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--apply") options.apply = true;
    else if (argument === "--dataset") {
      const value = argv[++index];
      if (!value) throw new Error("--dataset needs a path");
      options.dataset = path.isAbsolute(value) ? value : path.resolve(projectRoot, value);
    } else throw new Error(`Unknown argument: ${argument}`);
  }
  return options;
}

function requiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing ${name} in .env.local`);
  return value;
}

function storagePath(sourceId, gender, angle) {
  const prefix = gender === "female" ? "exercises/musclewiki/female" : "exercises/musclewiki";
  return `${prefix}/${sourceId}-${angle}.mp4`;
}

function encodeStoragePath(value) {
  return value.split("/").map(encodeURIComponent).join("/");
}

function normalizeRepairs(dataset) {
  if (!Array.isArray(dataset?.results) || dataset.results.length === 0) {
    throw new Error("Repair dataset must contain at least one result");
  }

  return dataset.results.map((exercise) => {
    const sourceId = Number(exercise.id);
    if (!Number.isSafeInteger(sourceId) || sourceId <= 0) throw new Error(`Invalid source ID: ${exercise.id}`);
    if (!Array.isArray(exercise.videos) || exercise.videos.length === 0) {
      throw new Error(`Exercise ${sourceId} has no repair videos`);
    }

    const media = exercise.videos.map((video) => {
      if (!video || !["male", "female"].includes(video.gender) || !["front", "side"].includes(video.angle)) {
        throw new Error(`Exercise ${sourceId} has invalid video metadata`);
      }
      const sourceUrl = new URL(video.url);
      if (sourceUrl.protocol !== "https:" || sourceUrl.hostname !== "musclewiki.com" || !sourceUrl.pathname.endsWith(".mp4")) {
        throw new Error(`Exercise ${sourceId} has an invalid MuscleWiki video URL`);
      }
      return {
        gender: video.gender,
        angle: video.angle,
        videoUrl: sourceUrl.href,
        storagePath: storagePath(sourceId, video.gender, video.angle),
      };
    });

    return {
      sourceId,
      name: exercise.name,
      category: exercise.category,
      primaryMuscles: exercise.primary_muscles,
      sourceVideos: exercise.videos,
      media,
    };
  });
}

function mergeByGenderAndAngle(existing, incoming) {
  const merged = Array.isArray(existing) ? [...existing] : [];
  for (const item of incoming) {
    const index = merged.findIndex((candidate) => candidate?.gender === item.gender && candidate?.angle === item.angle);
    if (index < 0) merged.push(item);
    else merged[index] = { ...merged[index], ...item };
  }
  return merged;
}

async function verifyPublicR2Media(repairs, publicBaseUrl) {
  const baseUrl = publicBaseUrl.replace(/\/+$/, "");
  for (const repair of repairs) {
    for (const item of repair.media) {
      const url = `${baseUrl}/${encodeStoragePath(item.storagePath)}`;
      const response = await fetch(url, { headers: { Range: "bytes=0-11" }, signal: AbortSignal.timeout(30_000) });
      if (!response.ok) throw new Error(`R2 verification failed for ${item.storagePath}: HTTP ${response.status}`);
      const bytes = Buffer.from(await response.arrayBuffer());
      if (bytes.length < 8 || bytes.subarray(4, 8).toString("ascii") !== "ftyp") {
        throw new Error(`R2 verification failed for ${item.storagePath}: response is not MP4`);
      }
    }
  }
}

async function main() {
  loadLocalEnv();
  const options = parseArgs(process.argv.slice(2));
  const repairs = normalizeRepairs(JSON.parse(fs.readFileSync(options.dataset, "utf8")));

  if (!options.apply) {
    console.log(JSON.stringify({
      mode: "validate-only",
      dataset: path.relative(projectRoot, options.dataset).replaceAll("\\", "/"),
      exercises: repairs.length,
      media: repairs.reduce((total, repair) => total + repair.media.length, 0),
    }, null, 2));
    return;
  }

  const publicBaseUrl = requiredEnv("R2_PUBLIC_BASE_URL");
  await verifyPublicR2Media(repairs, publicBaseUrl);

  const url = requiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  const key = process.env.SUPABASE_SECRET_KEY?.trim() || requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
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

  for (const repair of repairs) {
    const { data: row, error: readError } = await supabase
      .from("exercises")
      .select("id, name, category, primary_muscles, media, source_snapshot")
      .eq("source", "musclewiki")
      .eq("source_id", repair.sourceId)
      .single();
    if (readError) throw new Error(`Read exercise ${repair.sourceId}: ${readError.message}`);
    if (row.name !== repair.name || row.category !== repair.category || !row.primary_muscles?.includes("Rear Shoulders")) {
      throw new Error(`Exercise ${repair.sourceId} does not match the expected Rear Shoulders Barbell record`);
    }

    const sourceSnapshot = row.source_snapshot && typeof row.source_snapshot === "object" ? row.source_snapshot : {};
    const nextMedia = mergeByGenderAndAngle(row.media, repair.media);
    const nextSnapshot = {
      ...sourceSnapshot,
      videos: mergeByGenderAndAngle(sourceSnapshot.videos, repair.sourceVideos),
    };
    const { error: updateError } = await supabase
      .from("exercises")
      .update({ media: nextMedia, source_snapshot: nextSnapshot })
      .eq("id", row.id);
    if (updateError) throw new Error(`Update exercise ${repair.sourceId}: ${updateError.message}`);

    const { data: verified, error: verifyError } = await supabase
      .from("exercises")
      .select("id, media")
      .eq("id", row.id)
      .filter("media", "cs", JSON.stringify([{ gender: "male" }]))
      .single();
    if (verifyError || !verified?.media?.filter((item) => item?.gender === "male").length) {
      throw new Error(`Verify exercise ${repair.sourceId}: ${verifyError?.message || "male media is missing"}`);
    }
  }

  console.log(JSON.stringify({
    mode: "repaired-and-verified",
    projectRef: new URL(url).hostname.split(".")[0],
    exercises: repairs.length,
    media: repairs.reduce((total, repair) => total + repair.media.length, 0),
  }, null, 2));
}

await main();
