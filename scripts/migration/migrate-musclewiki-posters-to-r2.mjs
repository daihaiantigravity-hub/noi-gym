import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const outputDir = path.join(projectRoot, "artifacts", "media-migration");
const manifestPath = path.join(outputDir, "musclewiki-r2-poster-manifest.jsonl");
const maxSourceBytes = 5 * 1024 * 1024;
const targetWidth = 320;
const targetHeight = 180;
const verifiedPosterSourceOverrides = new Map([
  ["male:115137138372837", [
    "https://musclewiki.com/api-next/images/og-male-Kettlebells-kettlebell-chest-press-front_S2ic9bl.jpg",
  ]],
]);

function loadLocalEnv() {
  const envPath = path.join(projectRoot, ".env.local");
  if (!fs.existsSync(envPath)) return;

  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
  }
}

function requiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing ${name} in .env.local`);
  return value;
}

function parseArgs(argv) {
  const options = {
    apply: false,
    concurrency: 8,
    gender: "male",
    limit: 0,
    offset: 0,
    sourceId: 0,
    help: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--apply") options.apply = true;
    else if (argument === "--help" || argument === "-h") options.help = true;
    else if (["--concurrency", "--gender", "--limit", "--offset", "--source-id"].includes(argument)) {
      const value = argv[++index];
      if (!value) throw new Error(`${argument} needs a value`);
      if (argument === "--gender") options.gender = value.toLowerCase();
      else if (argument === "--source-id") options.sourceId = Number(value);
      else options[argument.slice(2)] = Number(value);
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }

  if (options.gender !== "male" && options.gender !== "female") {
    throw new Error("--gender must be male or female");
  }
  if (![options.limit, options.offset, options.sourceId, options.concurrency].every(Number.isSafeInteger)
    || options.limit < 0 || options.offset < 0 || options.sourceId < 0
    || options.concurrency < 1 || options.concurrency > 12) {
    throw new Error("Invalid numeric option; concurrency must be from 1 to 12");
  }

  return options;
}

function printHelp() {
  console.log(`Create compact, content-addressed exercise posters in Cloudflare R2.

Usage:
  node scripts/migration/migrate-musclewiki-posters-to-r2.mjs --gender <male|female> [--apply] [options]

Options:
  --apply              Download, resize, upload, verify, and update Supabase.
  --limit N            Process at most N exercises after filtering.
  --offset N           Skip N exercises after filtering.
  --source-id N        Process a single MuscleWiki source ID.
  --concurrency N      Concurrent transfers, from 1 to 12 (default: 8).
  --gender GENDER      Process only male or only female posters (default: male).
  --help               Show this message.

Without --apply, the command only builds the local inventory. It never deletes or overwrites
objects with different bytes. Posters are 320x180 WebP files keyed by SHA-256.
`);
}

function collectJsonFiles(root, files = []) {
  if (!fs.existsSync(root)) return files;

  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const entryPath = path.join(root, entry.name);
    if (entry.isDirectory()) collectJsonFiles(entryPath, files);
    else if (entry.isFile() && entry.name.endsWith(".json")) files.push(entryPath);
  }

  return files;
}

function normalizeVideoUrl(value) {
  if (typeof value !== "string") return null;

  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.hostname !== "musclewiki.com") return null;
    if (!url.pathname.startsWith("/api-next/videos/") || !url.pathname.toLowerCase().endsWith(".mp4")) return null;
    url.hash = "";
    return url.href;
  } catch {
    return null;
  }
}

function normalizePosterUrl(value) {
  if (typeof value !== "string") return null;

  try {
    const url = new URL(value, "https://musclewiki.com");
    if (url.protocol !== "https:" || url.hostname !== "musclewiki.com") return null;

    if (url.pathname === "/_next/image") {
      const nested = url.searchParams.get("url");
      if (!nested) return null;
      return normalizePosterUrl(new URL(nested, url.origin).href);
    }

    if (!url.pathname.startsWith("/api-next/images/")) return null;
    if (!/\.(?:avif|jpe?g|png|webp)$/i.test(url.pathname)) return null;
    url.search = "";
    url.hash = "";
    return url.href;
  } catch {
    return null;
  }
}

function posterUrlVariants(value) {
  const normalized = normalizePosterUrl(value);
  if (!normalized) return [];

  const url = new URL(normalized);
  const withoutGeneratedSuffix = url.pathname.replace(/_[a-z0-9]+(?=\.(?:avif|jpe?g|png|webp)$)/i, "");
  if (withoutGeneratedSuffix === url.pathname) return [normalized];
  url.pathname = withoutGeneratedSuffix;
  return [normalized, url.href];
}

function posterUrlsFromVideo(videoUrl) {
  const url = new URL(videoUrl);
  const fileName = decodeURIComponent(url.pathname.split("/").pop() || "");
  if (!fileName.toLowerCase().endsWith(".mp4")) return [];
  url.pathname = `/api-next/images/og-${fileName.slice(0, -4)}.jpg`;
  url.search = "";
  url.hash = "";
  return posterUrlVariants(url.href);
}

function videoGender(video, videoUrl) {
  const declared = String(video?.gender || "").toLowerCase();
  if (declared === "male" || declared === "female") return declared;
  const fileName = decodeURIComponent(new URL(videoUrl).pathname.split("/").pop() || "").toLowerCase();
  if (fileName.startsWith("male-")) return "male";
  if (fileName.startsWith("female-")) return "female";
  return null;
}

function videoAngle(video, videoUrl) {
  const declared = String(video?.angle || "").toLowerCase();
  if (declared === "front" || declared === "side") return declared;
  const fileName = decodeURIComponent(new URL(videoUrl).pathname.split("/").pop() || "");
  return fileName.match(/-(front|side)(?:_[a-z0-9]+)?\.mp4$/i)?.[1]?.toLowerCase() || null;
}

function buildInventory(gender) {
  const roots = [
    path.join(projectRoot, "data"),
    path.join(projectRoot, "scripts", "migration", "data"),
  ];
  const jsonFiles = roots.flatMap((root) => collectJsonFiles(root));
  const candidatesBySourceId = new Map();
  const parseFailures = [];

  function addExercise(exercise, sourceFile) {
    const sourceId = Number(exercise?.id);
    if (!Number.isSafeInteger(sourceId) || sourceId <= 0 || !Array.isArray(exercise?.videos)) return;

    const buckets = candidatesBySourceId.get(sourceId) ?? {
      sourceId,
      frontExplicit: new Set(),
      frontDerived: new Set(),
      sideExplicit: new Set(),
      sideDerived: new Set(),
      sourceFiles: new Set(),
    };

    for (const video of exercise.videos) {
      const videoUrl = normalizeVideoUrl(video?.url);
      if (!videoUrl || videoGender(video, videoUrl) !== gender) continue;
      const angle = videoAngle(video, videoUrl);
      if (angle !== "front" && angle !== "side") continue;

      const explicitUrls = posterUrlVariants(video?.og_image || video?.posterUrl || video?.poster_url);
      const derivedUrls = posterUrlsFromVideo(videoUrl);
      for (const explicitUrl of explicitUrls) buckets[`${angle}Explicit`].add(explicitUrl);
      for (const derivedUrl of derivedUrls) buckets[`${angle}Derived`].add(derivedUrl);
      buckets.sourceFiles.add(path.relative(projectRoot, sourceFile).replaceAll("\\", "/"));
    }

    if (buckets.frontExplicit.size || buckets.frontDerived.size || buckets.sideExplicit.size || buckets.sideDerived.size) {
      candidatesBySourceId.set(sourceId, buckets);
    }
  }

  function walk(value, sourceFile) {
    if (Array.isArray(value)) {
      for (const item of value) walk(item, sourceFile);
      return;
    }
    if (!value || typeof value !== "object") return;
    addExercise(value, sourceFile);
    for (const child of Object.values(value)) walk(child, sourceFile);
  }

  for (const file of jsonFiles) {
    try {
      walk(JSON.parse(fs.readFileSync(file, "utf8")), file);
    } catch (error) {
      parseFailures.push({
        file: path.relative(projectRoot, file).replaceAll("\\", "/"),
        message: String(error?.message || error),
      });
    }
  }

  const candidates = [...candidatesBySourceId.values()].map((candidate) => ({
    sourceId: candidate.sourceId,
    angle: candidate.frontExplicit.size || candidate.frontDerived.size ? "front" : "side",
    sourceUrls: [
      ...(verifiedPosterSourceOverrides.get(`${gender}:${candidate.sourceId}`) ?? []),
      ...candidate.frontExplicit,
      ...candidate.frontDerived,
      ...candidate.sideExplicit,
      ...candidate.sideDerived,
    ],
    sourceFiles: [...candidate.sourceFiles],
  })).sort((first, second) => first.sourceId - second.sourceId);

  return { candidates, jsonFiles: jsonFiles.length, parseFailures };
}

function hashBuffer(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function hashText(value) {
  return createHash("sha256").update(value).digest("hex");
}

function encodeStoragePath(storagePath) {
  return storagePath.split("/").filter(Boolean).map((segment) => encodeURIComponent(segment)).join("/");
}

function publicUrl(baseUrl, storagePath) {
  return `${baseUrl.replace(/\/+$/, "")}/${encodeStoragePath(storagePath)}`;
}

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function downloadPoster(sourceUrls) {
  const failures = [];

  for (const sourceUrl of sourceUrls) {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const response = await fetch(sourceUrl, {
          signal: AbortSignal.timeout(30_000),
          headers: {
            Accept: "image/avif,image/webp,image/jpeg,image/png",
            Referer: "https://musclewiki.com/",
            "User-Agent": "Mozilla/5.0 noi-gym R2 poster migration",
          },
        });
        if (!response.ok) {
          const error = new Error(`Source HTTP ${response.status}`);
          error.permanent = response.status !== 429 && response.status < 500;
          throw error;
        }

        const declaredSize = Number(response.headers.get("content-length") || 0);
        if (declaredSize > maxSourceBytes) {
          throw Object.assign(new Error(`Source exceeds ${maxSourceBytes} bytes`), { permanent: true });
        }
        const buffer = Buffer.from(await response.arrayBuffer());
        if (!buffer.length || buffer.length > maxSourceBytes) {
          throw Object.assign(new Error(`Invalid source size: ${buffer.length}`), { permanent: true });
        }
        return { buffer, sourceUrl };
      } catch (error) {
        if (error?.permanent || attempt === 2) {
          failures.push(`${sourceUrl}: ${String(error?.message || error)}`);
          break;
        }
        await sleep(500 * (2 ** attempt));
      }
    }
  }

  throw new Error(failures.join(" | ") || "Poster download failed");
}

async function optimizePoster(sourceBuffer) {
  return sharp(sourceBuffer, { failOn: "error", limitInputPixels: 40_000_000 })
    .rotate()
    .resize({
      width: targetWidth,
      height: targetHeight,
      fit: "cover",
      position: "centre",
      withoutEnlargement: true,
    })
    .webp({ quality: 72, effort: 4, smartSubsample: true })
    .toBuffer({ resolveWithObject: true });
}

function isMissingObject(error) {
  return error?.$metadata?.httpStatusCode === 404 || error?.name === "NotFound" || error?.name === "NoSuchKey";
}

async function headObject(client, bucket, key) {
  try {
    return await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
  } catch (error) {
    if (isMissingObject(error)) return null;
    throw error;
  }
}

async function bodyToBuffer(body) {
  if (!body) throw new Error("R2 returned an empty object body");
  if (typeof body.transformToByteArray === "function") return Buffer.from(await body.transformToByteArray());
  const chunks = [];
  for await (const chunk of body) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks);
}

async function readObject(client, bucket, key) {
  const response = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  return bodyToBuffer(response.Body);
}

function readManifest(gender) {
  const records = new Map();
  if (!fs.existsSync(manifestPath)) return records;

  for (const line of fs.readFileSync(manifestPath, "utf8").split(/\r?\n/).filter(Boolean)) {
    const record = JSON.parse(line);
    if (record.sourceId && record.gender === gender && record.storagePath) records.set(Number(record.sourceId), record);
  }
  return records;
}

async function runPool(items, concurrency, worker) {
  let nextIndex = 0;
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (nextIndex < items.length) {
      const item = items[nextIndex++];
      await worker(item);
    }
  }));
}

function createSupabase(url, secretKey) {
  return createClient(url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    ...(secretKey.startsWith("sb_secret_") ? {
      global: {
        fetch: async (input, init) => {
          const headers = new Headers(init?.headers);
          headers.delete("Authorization");
          return fetch(input, { ...init, headers });
        },
      },
    } : {}),
  });
}

async function listExerciseRows(supabase) {
  const rows = [];
  const pageSize = 500;

  for (let start = 0; ; start += pageSize) {
    const { data, error } = await supabase
      .from("exercises")
      .select("id, source_id, media")
      .eq("source", "musclewiki")
      .order("id", { ascending: true })
      .range(start, start + pageSize - 1);
    if (error) throw new Error(`List exercises: ${error.message}`);
    rows.push(...(data ?? []));
    if (!data || data.length < pageSize) break;
  }

  return rows;
}

async function updateDatabase(supabase, posterRecords, concurrency, gender) {
  const rows = await listExerciseRows(supabase);
  const rowsBySourceId = new Map(rows.map((row) => [Number(row.source_id), row]));
  const updates = [];
  const failures = [];
  let unchanged = 0;

  for (const record of posterRecords) {
    const row = rowsBySourceId.get(record.sourceId);
    if (!row) {
      failures.push({ sourceId: record.sourceId, message: "Exercise row not found" });
      continue;
    }
    const media = Array.isArray(row.media) ? row.media.map((item) => ({ ...item })) : [];
    let index = media.findIndex((item) => item?.gender === gender && item?.angle === "front");
    if (index < 0) index = media.findIndex((item) => item?.gender === gender);
    if (index < 0) {
      failures.push({ sourceId: record.sourceId, message: `${gender} media entry not found` });
      continue;
    }

    if (media[index].posterUrl === record.posterUrl && media[index].posterStoragePath === record.storagePath) {
      unchanged += 1;
      continue;
    }
    media[index] = {
      ...media[index],
      posterUrl: record.posterUrl,
      posterStoragePath: record.storagePath,
    };
    updates.push({ id: row.id, sourceId: record.sourceId, media });
  }

  let updated = 0;
  await runPool(updates, Math.min(concurrency, 8), async (update) => {
    const { error } = await supabase.from("exercises").update({ media: update.media }).eq("id", update.id);
    if (error) {
      failures.push({ sourceId: update.sourceId, message: error.message });
      return;
    }
    updated += 1;
  });

  return { databaseRows: rows.length, mapped: posterRecords.length, updated, unchanged, failures };
}

async function main() {
  loadLocalEnv();
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }

  fs.mkdirSync(outputDir, { recursive: true });
  const summaryPath = path.join(outputDir, `musclewiki-r2-poster-${options.gender}-summary.json`);
  const inventory = buildInventory(options.gender);
  const filtered = inventory.candidates.filter((candidate) => !options.sourceId || candidate.sourceId === options.sourceId);
  const selected = filtered.slice(options.offset, options.limit ? options.offset + options.limit : undefined);
  const baseSummary = {
    mode: options.apply ? "upload-update-and-verify" : "local-inventory",
    gender: options.gender,
    jsonFiles: inventory.jsonFiles,
    parseFailures: inventory.parseFailures,
    discoveredExercises: inventory.candidates.length,
    filteredExercises: filtered.length,
    selectedExercises: selected.length,
    target: { width: targetWidth, height: targetHeight, format: "webp", quality: 72 },
    offset: options.offset,
    limit: options.limit,
    sourceId: options.sourceId || null,
  };

  if (!options.apply) {
    const summary = { ...baseSummary, generatedAt: new Date().toISOString() };
    fs.writeFileSync(summaryPath, `${JSON.stringify(summary, null, 2)}\n`);
    console.log(JSON.stringify({ ...summary, summaryPath }, null, 2));
    return;
  }

  const accountId = requiredEnv("R2_ACCOUNT_ID");
  const bucket = requiredEnv("R2_BUCKET_NAME");
  const r2PublicBaseUrl = requiredEnv("R2_PUBLIC_BASE_URL");
  const client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: requiredEnv("R2_ACCESS_KEY_ID"),
      secretAccessKey: requiredEnv("R2_SECRET_ACCESS_KEY"),
    },
    maxAttempts: 4,
  });
  const supabaseUrl = requiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  const supabaseSecret = process.env.SUPABASE_SECRET_KEY?.trim() || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!supabaseSecret) throw new Error("Missing SUPABASE_SECRET_KEY in .env.local");
  const supabase = createSupabase(supabaseUrl, supabaseSecret);
  const previous = readManifest(options.gender);
  const posterRecords = [];
  const failures = [];
  let uploadedObjects = 0;
  let reusedObjects = 0;
  let resumedObjects = 0;
  let originalBytes = 0;
  let optimizedBytes = 0;
  let completed = 0;
  let manifestQueue = Promise.resolve();

  await runPool(selected, options.concurrency, async (candidate) => {
    try {
      const previousRecord = previous.get(candidate.sourceId);
      if (previousRecord) {
        const head = await headObject(client, bucket, previousRecord.storagePath);
        if (head && Number(head.ContentLength ?? -1) === previousRecord.optimizedBytes) {
          const record = {
            ...previousRecord,
            posterUrl: publicUrl(r2PublicBaseUrl, previousRecord.storagePath),
          };
          posterRecords.push(record);
          resumedObjects += 1;
          optimizedBytes += previousRecord.optimizedBytes;
          originalBytes += previousRecord.originalBytes || 0;
          return;
        }
      }

      const downloaded = await downloadPoster(candidate.sourceUrls);
      const optimized = await optimizePoster(downloaded.buffer);
      const sha256 = hashBuffer(optimized.data);
      const storagePath = `posters/${options.gender}/${sha256}.webp`;
      const head = await headObject(client, bucket, storagePath);
      let status;

      if (head) {
        if (Number(head.ContentLength ?? -1) !== optimized.data.length) {
          throw new Error(`R2 hash path has a different size (${head.ContentLength} vs ${optimized.data.length})`);
        }
        if (head.Metadata?.sha256 !== sha256) {
          const existing = await readObject(client, bucket, storagePath);
          if (hashBuffer(existing) !== sha256) throw new Error("R2 hash path contains different bytes");
        }
        status = "verified-existing";
        reusedObjects += 1;
      } else {
        await client.send(new PutObjectCommand({
          Bucket: bucket,
          Key: storagePath,
          Body: optimized.data,
          ContentType: "image/webp",
          CacheControl: "public, max-age=31536000, immutable",
          Metadata: {
            sha256,
            gender: options.gender,
            "source-id": String(candidate.sourceId),
            "source-url-sha256": hashText(downloaded.sourceUrl),
          },
        }));
        const uploaded = await readObject(client, bucket, storagePath);
        if (uploaded.length !== optimized.data.length || hashBuffer(uploaded) !== sha256) {
          throw new Error("R2 verification failed after upload");
        }
        status = "verified-uploaded";
        uploadedObjects += 1;
      }

      const record = {
        sourceId: candidate.sourceId,
        gender: options.gender,
        angle: candidate.angle,
        sourceUrl: downloaded.sourceUrl,
        sourceFile: candidate.sourceFiles[0] || null,
        storagePath,
        posterUrl: publicUrl(r2PublicBaseUrl, storagePath),
        sha256,
        originalBytes: downloaded.buffer.length,
        optimizedBytes: optimized.data.length,
        width: optimized.info.width,
        height: optimized.info.height,
        status,
        verifiedAt: new Date().toISOString(),
      };
      posterRecords.push(record);
      originalBytes += downloaded.buffer.length;
      optimizedBytes += optimized.data.length;
      manifestQueue = manifestQueue.then(() => fs.promises.appendFile(manifestPath, `${JSON.stringify(record)}\n`));
      await manifestQueue;
    } catch (error) {
      failures.push({
        sourceId: candidate.sourceId,
        sourceUrls: candidate.sourceUrls,
        message: String(error?.message || error),
      });
    } finally {
      completed += 1;
      if (completed % 25 === 0 || completed === selected.length) {
        console.log(JSON.stringify({
          progress: `${completed}/${selected.length}`,
          verified: posterRecords.length,
          uploaded: uploadedObjects,
          resumed: resumedObjects,
          failures: failures.length,
          optimizedBytes,
        }));
      }
    }
  });

  await manifestQueue;
  posterRecords.sort((first, second) => first.sourceId - second.sourceId);
  const database = await updateDatabase(supabase, posterRecords, options.concurrency, options.gender);
  const summary = {
    ...baseSummary,
    bucket,
    verifiedPosters: posterRecords.length,
    uniqueStoragePaths: new Set(posterRecords.map((record) => record.storagePath)).size,
    uploadedObjects,
    reusedObjects,
    resumedObjects,
    originalBytes,
    optimizedBytes,
    savedBytes: originalBytes - optimizedBytes,
    failures,
    database,
    completedAt: new Date().toISOString(),
  };
  fs.writeFileSync(summaryPath, `${JSON.stringify(summary, null, 2)}\n`);
  console.log(JSON.stringify({ ...summary, manifestPath, summaryPath }, null, 2));

  if (failures.length || database.failures.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : String(error));
  process.exitCode = 1;
});
