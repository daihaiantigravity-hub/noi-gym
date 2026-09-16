import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const maxVideoSize = 25 * 1024 * 1024;
const maxVideoDuration = 15;
const maxImportedVideoDuration = 30;
const bucket = "exercise-media";

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
  const options = { limit: 0, dryRun: false, dataset: "", skipUnavailable: false };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--dry-run") {
      options.dryRun = true;
      continue;
    }
    if (argument === "--limit") {
      const value = Number(argv[++index]);
      if (!Number.isInteger(value) || value <= 0) throw new Error("--limit phải là số nguyên dương");
      options.limit = value;
      continue;
    }
    if (argument === "--dataset") {
      options.dataset = argv[++index] || "";
      if (!options.dataset) throw new Error("--dataset cần một đường dẫn");
      continue;
    }
    if (argument === "--skip-unavailable") {
      options.skipUnavailable = true;
      continue;
    }
    throw new Error(`Unknown argument: ${argument}`);
  }
  return options;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readUint32(view, offset) {
  return view.getUint32(offset, false);
}

function readUint64(view, offset) {
  const value = view.getBigUint64(offset, false);
  return Number(value);
}

function atomType(view, offset) {
  return String.fromCharCode(view.getUint8(offset), view.getUint8(offset + 1), view.getUint8(offset + 2), view.getUint8(offset + 3));
}

function findMovieHeader(view, start, end) {
  let offset = start;
  while (offset + 8 <= end) {
    let size = readUint32(view, offset);
    let headerSize = 8;
    if (size === 1) {
      if (offset + 16 > end) return null;
      size = readUint64(view, offset + 8);
      headerSize = 16;
    } else if (size === 0) {
      size = end - offset;
    }
    if (size < headerSize || offset + size > end) return null;

    const type = atomType(view, offset + 4);
    if (type === "mvhd") return { offset: offset + headerSize, size: size - headerSize };
    if (type === "moov") {
      const header = findMovieHeader(view, offset + headerSize, offset + size);
      if (header) return header;
    }
    offset += size;
  }
  return null;
}

function readMp4Duration(buffer) {
  const view = new DataView(buffer);
  const header = findMovieHeader(view, 0, view.byteLength);
  if (!header || header.size < 20) throw new Error("Không đọc được duration MP4");
  const version = view.getUint8(header.offset);
  if (version === 0) {
    const timescale = readUint32(view, header.offset + 12);
    const duration = readUint32(view, header.offset + 16);
    if (!timescale) throw new Error("MP4 có timescale không hợp lệ");
    return duration / timescale;
  }
  if (version === 1 && header.size >= 32) {
    const timescale = readUint32(view, header.offset + 20);
    const duration = readUint64(view, header.offset + 24);
    if (!timescale) throw new Error("MP4 có timescale không hợp lệ");
    return duration / timescale;
  }
  throw new Error(`MP4 mvhd version không hỗ trợ: ${version}`);
}

async function fetchVideo(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "video/mp4",
      Referer: "https://musclewiki.com/",
      "User-Agent": "Mozilla/5.0 MuscleWiki media migration",
    },
  });
  if (!response.ok) throw new Error(`MuscleWiki trả HTTP ${response.status} cho ${url}`);
  const contentType = (response.headers.get("content-type") || "").split(";", 1)[0].toLowerCase();
  if (contentType && contentType !== "video/mp4" && contentType !== "application/octet-stream") {
    throw new Error(`Nội dung không phải MP4 (${contentType}) cho ${url}`);
  }
  const buffer = await response.arrayBuffer();
  if (buffer.byteLength <= 0 || buffer.byteLength > maxVideoSize) throw new Error(`Video vượt giới hạn 25MB hoặc rỗng: ${url}`);
  const duration = readMp4Duration(buffer);
  if (!Number.isFinite(duration) || duration <= 0 || duration > maxImportedVideoDuration) {
    throw new Error(`Video phải dài hơn 0 và tối đa 30 giây khi import (${duration}s): ${url}`);
  }
  return { buffer, duration };
}

function createSupabaseAdminClient(url, key) {
  return createClient(url, key, {
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
}

function mergeMedia(existing, incoming) {
  const media = Array.isArray(existing) ? [...existing] : [];
  for (const item of incoming) {
    const index = media.findIndex((candidate) => candidate.gender === item.gender && candidate.angle === item.angle);
    if (index >= 0) media[index] = item;
    else media.push(item);
  }
  return media;
}

loadLocalEnv();
const options = parseArgs(process.argv.slice(2));
const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const key = process.env.SUPABASE_SECRET_KEY?.trim() || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
if (!url || !key) throw new Error("Cần NEXT_PUBLIC_SUPABASE_URL và SUPABASE_SECRET_KEY trong .env.local");

const datasetCandidates = options.dataset
  ? [path.isAbsolute(options.dataset) ? options.dataset : path.resolve(projectRoot, options.dataset)]
  : [
      path.join(projectRoot, "scripts", "migration", "data", "musclewiki-exercises-collected.json"),
      path.join(projectRoot, "data", "musclewiki-exercises-collected.json"),
    ];
const datasetPath = datasetCandidates.find((candidate) => fs.existsSync(candidate));
if (!datasetPath) throw new Error("Không tìm thấy dataset MuscleWiki. Hãy chạy npm run prepare:musclewiki-import trước.");
const dataset = readJson(datasetPath);
const exercises = Array.isArray(dataset.results) ? dataset.results : [];
const selectedExercises = options.limit ? exercises.slice(0, options.limit) : exercises;
const supabase = createSupabaseAdminClient(url, key);

const rows = [];
for (let index = 0; index < selectedExercises.length; index += 100) {
  const sourceIds = selectedExercises.slice(index, index + 100).map((exercise) => String(exercise.id));
  const { data: chunkRows, error: rowsError } = await supabase
    .from("exercises")
    .select("id, source_id, media")
    .eq("source", "musclewiki")
    .in("source_id", sourceIds);
  if (rowsError) throw new Error(rowsError.message);
  rows.push(...(chunkRows || []));
}
const rowsBySourceId = new Map((rows ?? []).map((row) => [String(row.source_id), row]));

let processedVideos = 0;
let skippedVideos = 0;
for (const exercise of selectedExercises) {
  const row = rowsBySourceId.get(String(exercise.id));
  if (!row) throw new Error(`Không tìm thấy exercise source_id=${exercise.id} trong database`);
  const videos = Array.isArray(exercise.videos) ? exercise.videos : [];
  const uploaded = [];

  for (const video of videos) {
    if (!video?.url || !["front", "side"].includes(video.angle)) continue;
    try {
      const { buffer, duration } = await fetchVideo(video.url);
      const storagePath = `exercises/musclewiki/${exercise.id}-${video.angle}.mp4`;
      if (!options.dryRun) {
        const { error } = await supabase.storage.from(bucket).upload(storagePath, Buffer.from(buffer), {
          cacheControl: "31536000",
          contentType: "video/mp4",
          upsert: true,
        });
        if (error) throw new Error(`Upload thất bại ${storagePath}: ${error.message}`);
        const { data: publicUrl } = supabase.storage.from(bucket).getPublicUrl(storagePath);
        uploaded.push({
          gender: video.gender || "male",
          angle: video.angle,
          videoUrl: publicUrl.publicUrl,
          storagePath,
          ...(duration <= maxVideoDuration ? { duration } : {}),
        });
      } else {
        uploaded.push({ gender: video.gender || "male", angle: video.angle, videoUrl: "dry-run", storagePath, duration });
      }
      processedVideos += 1;
    } catch (error) {
      if (!options.skipUnavailable) throw error;
      skippedVideos += 1;
      console.warn(`Bỏ qua video không khả dụng của ${exercise.name}: ${error.message}`);
    }
  }

  if (!options.dryRun) {
    const media = mergeMedia(row.media, uploaded);
    const { error } = await supabase.from("exercises").update({ media }).eq("id", row.id);
    if (error) throw new Error(`Cập nhật media thất bại cho source_id=${exercise.id}: ${error.message}`);
  }
  console.log(`${options.dryRun ? "Checked" : "Uploaded"} ${exercise.name} (${uploaded.length} video)`);
}

console.log(JSON.stringify({ mode: options.dryRun ? "dry-run" : "upload", exercises: selectedExercises.length, videos: processedVideos, skippedVideos }, null, 2));
