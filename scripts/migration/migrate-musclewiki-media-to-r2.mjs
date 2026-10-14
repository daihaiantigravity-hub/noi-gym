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

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const outputDir = path.join(projectRoot, "artifacts", "media-migration");
const manifestPath = path.join(outputDir, "musclewiki-r2-manifest.jsonl");
const maxVideoBytes = 32 * 1024 * 1024;
const verifiedEquivalentSourcePairs = new Set([
  [
    "https://musclewiki.com/api-next/videos/male-Kettlebells-kettlebell-upright-row-front.mp4",
    "https://musclewiki.com/api-next/videos/male-Kettlebells-upright-row-front.mp4",
  ].sort().join("\n"),
  [
    "https://musclewiki.com/api-next/videos/male-Kettlebells-kettlebell-upright-row-side.mp4",
    "https://musclewiki.com/api-next/videos/male-Kettlebells-upright-row-side.mp4",
  ].sort().join("\n"),
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

function printHelp() {
  console.log(`Rebuild the exercise video bucket from the original MuscleWiki URLs preserved in local JSON datasets.

Usage:
  node scripts/migration/migrate-musclewiki-media-to-r2.mjs [--apply] [options]

Options:
  --apply              Download, upload, and verify exact bytes. Without this flag, only build the local inventory.
  --limit N            Process at most N objects after filters.
  --offset N           Skip N objects after filters.
  --concurrency N      Concurrent transfers, from 1 to 12 (default: 4).
  --gender VALUE       male, female, or all (default: male).
  --prefix PATH        Only process target object paths beginning with PATH.
  --help               Show this message.

Existing R2 objects are never overwritten when their bytes differ. The script keeps a resumable
SHA-256 manifest and never deletes source or target objects.
`);
}

function parseArgs(argv) {
  const options = {
    apply: false,
    limit: 0,
    offset: 0,
    concurrency: 4,
    gender: "male",
    prefix: "",
    help: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--apply") options.apply = true;
    else if (argument === "--help" || argument === "-h") options.help = true;
    else if (["--limit", "--offset", "--concurrency", "--gender", "--prefix"].includes(argument)) {
      const value = argv[++index];
      if (!value) throw new Error(`${argument} needs a value`);
      if (["--limit", "--offset", "--concurrency"].includes(argument)) options[argument.slice(2)] = Number(value);
      else options[argument.slice(2)] = value;
    } else throw new Error(`Unknown argument: ${argument}`);
  }
  if (![options.limit, options.offset, options.concurrency].every(Number.isSafeInteger)
    || options.limit < 0 || options.offset < 0 || options.concurrency < 1 || options.concurrency > 12) {
    throw new Error("--limit and --offset must be non-negative integers; --concurrency must be from 1 to 12");
  }
  if (!["all", "male", "female"].includes(options.gender)) throw new Error("--gender must be all, male, or female");
  options.prefix = options.prefix.replace(/^\/+/, "");
  return options;
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

function normalizeSourceUrl(value) {
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

function videoGender(video, sourceUrl) {
  const declared = String(video?.gender || "").toLowerCase();
  if (declared === "male" || declared === "female") return declared;
  const fileName = decodeURIComponent(new URL(sourceUrl).pathname.split("/").pop() || "").toLowerCase();
  if (fileName.startsWith("female-")) return "female";
  if (fileName.startsWith("male-")) return "male";
  return null;
}

function videoAngle(video, sourceUrl) {
  const declared = String(video?.angle || "").toLowerCase();
  if (declared === "front" || declared === "side") return declared;
  const fileName = decodeURIComponent(new URL(sourceUrl).pathname.split("/").pop() || "").toLowerCase();
  const match = fileName.match(/-(front|side)(?:_[a-z0-9]+)?\.mp4$/i);
  return match?.[1]?.toLowerCase() || null;
}

function storagePath(sourceId, gender, angle) {
  const prefix = gender === "female" ? "exercises/musclewiki/female" : "exercises/musclewiki";
  return `${prefix}/${sourceId}-${angle}.mp4`;
}

function buildInventory() {
  const roots = [
    path.join(projectRoot, "data"),
    path.join(projectRoot, "scripts", "migration", "data"),
  ];
  const jsonFiles = roots.flatMap((root) => collectJsonFiles(root));
  const objectsByPath = new Map();
  const conflicts = [];
  const equivalentAliases = [];
  const parseFailures = [];

  function addExercise(exercise, sourceFile) {
    const sourceId = Number(exercise?.id);
    if (!Number.isSafeInteger(sourceId) || sourceId <= 0 || !Array.isArray(exercise?.videos)) return;
    for (const video of exercise.videos) {
      const sourceUrl = normalizeSourceUrl(video?.url);
      if (!sourceUrl) continue;
      const gender = videoGender(video, sourceUrl);
      const angle = videoAngle(video, sourceUrl);
      if (!gender || !angle) continue;
      const object = {
        path: storagePath(sourceId, gender, angle),
        sourceId,
        gender,
        angle,
        sourceUrl,
        sourceFile: path.relative(projectRoot, sourceFile).replaceAll("\\", "/"),
      };
      const existing = objectsByPath.get(object.path);
      if (!existing) objectsByPath.set(object.path, object);
      else if (existing.sourceUrl !== object.sourceUrl) {
        const pairKey = [existing.sourceUrl, object.sourceUrl].sort().join("\n");
        const detail = {
          path: object.path,
          firstUrl: existing.sourceUrl,
          secondUrl: object.sourceUrl,
          firstFile: existing.sourceFile,
          secondFile: object.sourceFile,
        };
        if (verifiedEquivalentSourcePairs.has(pairKey)) equivalentAliases.push(detail);
        else conflicts.push(detail);
      }
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
      parseFailures.push({ file: path.relative(projectRoot, file), message: String(error?.message || error) });
    }
  }

  const objects = [...objectsByPath.values()].sort((first, second) => first.path.localeCompare(second.path));
  return { jsonFiles: jsonFiles.length, objects, conflicts, equivalentAliases, parseFailures };
}

function hashBuffer(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function hashText(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function bodyToBuffer(body) {
  if (!body) throw new Error("R2 returned an empty object body");
  if (typeof body.transformToByteArray === "function") return Buffer.from(await body.transformToByteArray());
  const chunks = [];
  for await (const chunk of body) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks);
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

async function readObject(client, bucket, key) {
  const response = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  return bodyToBuffer(response.Body);
}

function looksLikeMp4(buffer) {
  return buffer.length >= 12 && buffer.subarray(4, 8).toString("ascii") === "ftyp";
}

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function downloadSource(sourceUrl) {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      const response = await fetch(sourceUrl, {
        signal: AbortSignal.timeout(60_000),
        headers: {
          Accept: "video/mp4",
          Referer: "https://musclewiki.com/",
          "User-Agent": "Mozilla/5.0 noi-gym R2 media migration",
        },
      });
      if (!response.ok) {
        const error = new Error(`Source HTTP ${response.status}`);
        error.permanent = response.status !== 429 && response.status < 500;
        throw error;
      }
      const declaredSize = Number(response.headers.get("content-length") || 0);
      if (declaredSize > maxVideoBytes) throw Object.assign(new Error(`Source exceeds ${maxVideoBytes} bytes`), { permanent: true });
      const buffer = Buffer.from(await response.arrayBuffer());
      if (!buffer.length || buffer.length > maxVideoBytes) throw Object.assign(new Error(`Invalid source size: ${buffer.length}`), { permanent: true });
      if (!looksLikeMp4(buffer)) throw Object.assign(new Error("Source is not an MP4 file"), { permanent: true });
      return buffer;
    } catch (error) {
      if (error?.permanent || attempt === 3) throw error;
      await sleep(750 * (2 ** attempt));
    }
  }
  throw new Error("Source download failed");
}

function readManifest() {
  const records = new Map();
  if (!fs.existsSync(manifestPath)) return records;
  for (const line of fs.readFileSync(manifestPath, "utf8").split(/\r?\n/).filter(Boolean)) {
    const record = JSON.parse(line);
    if (record.path) records.set(record.path, record);
  }
  return records;
}

async function appendManifest(record) {
  await fs.promises.appendFile(manifestPath, `${JSON.stringify(record)}\n`);
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

async function main() {
  loadLocalEnv();
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }

  fs.mkdirSync(outputDir, { recursive: true });
  const summaryPath = path.join(outputDir, `musclewiki-r2-${options.gender}-summary.json`);
  const inventory = buildInventory();
  if (inventory.conflicts.length) {
    fs.writeFileSync(path.join(outputDir, "musclewiki-r2-conflicts.json"), `${JSON.stringify(inventory.conflicts, null, 2)}\n`);
    throw new Error(`Found ${inventory.conflicts.length} conflicting source URL mappings; review musclewiki-r2-conflicts.json`);
  }

  const byGender = {
    male: inventory.objects.filter((object) => object.gender === "male").length,
    female: inventory.objects.filter((object) => object.gender === "female").length,
  };
  const filtered = inventory.objects.filter((object) => {
    if (options.gender !== "all" && object.gender !== options.gender) return false;
    if (options.prefix && !object.path.startsWith(options.prefix)) return false;
    return true;
  });
  const selected = filtered.slice(options.offset, options.limit ? options.offset + options.limit : undefined);
  const baseSummary = {
    mode: options.apply ? "copy-and-verify" : "local-inventory",
    jsonFiles: inventory.jsonFiles,
    parseFailures: inventory.parseFailures,
    verifiedEquivalentAliases: inventory.equivalentAliases.length,
    discoveredObjects: inventory.objects.length,
    byGender,
    filteredObjects: filtered.length,
    selectedObjects: selected.length,
    offset: options.offset,
    limit: options.limit,
    prefix: options.prefix,
    gender: options.gender,
  };

  if (!options.apply) {
    const summary = { ...baseSummary, generatedAt: new Date().toISOString() };
    fs.writeFileSync(summaryPath, `${JSON.stringify(summary, null, 2)}\n`);
    console.log(JSON.stringify({ ...summary, summaryPath }, null, 2));
    return;
  }

  const accountId = requiredEnv("R2_ACCOUNT_ID");
  const bucket = requiredEnv("R2_BUCKET_NAME");
  const client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: requiredEnv("R2_ACCESS_KEY_ID"),
      secretAccessKey: requiredEnv("R2_SECRET_ACCESS_KEY"),
    },
    maxAttempts: 4,
  });
  const previous = readManifest();
  const summary = {
    ...baseSummary,
    bucket,
    verifiedObjects: 0,
    verifiedBytes: 0,
    uploadedObjects: 0,
    reusedObjects: 0,
    resumedObjects: 0,
    failures: [],
    startedAt: new Date().toISOString(),
  };
  let completed = 0;
  let manifestQueue = Promise.resolve();

  await runPool(selected, options.concurrency, async (object) => {
    try {
      const previousRecord = previous.get(object.path);
      if (previousRecord?.sourceUrl === object.sourceUrl && previousRecord?.sha256) {
        const head = await headObject(client, bucket, object.path);
        if (head
          && Number(head.ContentLength ?? -1) === previousRecord.size
          && head.Metadata?.sha256 === previousRecord.sha256) {
          summary.verifiedObjects += 1;
          summary.resumedObjects += 1;
          summary.verifiedBytes += previousRecord.size;
          return;
        }
      }

      const sourceBuffer = await downloadSource(object.sourceUrl);
      const sha256 = hashBuffer(sourceBuffer);
      const head = await headObject(client, bucket, object.path);
      let status;
      if (head) {
        if (Number(head.ContentLength ?? -1) !== sourceBuffer.length) {
          throw new Error(`R2 already has a different-size object (${head.ContentLength} vs ${sourceBuffer.length})`);
        }
        const existingBuffer = await readObject(client, bucket, object.path);
        if (hashBuffer(existingBuffer) !== sha256) throw new Error("R2 already has different bytes; refusing to overwrite");
        status = "verified-existing";
        summary.reusedObjects += 1;
      } else {
        await client.send(new PutObjectCommand({
          Bucket: bucket,
          Key: object.path,
          Body: sourceBuffer,
          ContentType: "video/mp4",
          CacheControl: "public, max-age=31536000, immutable",
          Metadata: {
            sha256,
            source: "musclewiki-original",
            "source-url-sha256": hashText(object.sourceUrl),
          },
        }));
        const uploadedBuffer = await readObject(client, bucket, object.path);
        if (uploadedBuffer.length !== sourceBuffer.length || hashBuffer(uploadedBuffer) !== sha256) {
          throw new Error("R2 verification failed after upload");
        }
        status = "verified-uploaded";
        summary.uploadedObjects += 1;
      }

      const record = {
        ...object,
        size: sourceBuffer.length,
        sha256,
        status,
        verifiedAt: new Date().toISOString(),
      };
      manifestQueue = manifestQueue.then(() => appendManifest(record));
      await manifestQueue;
      summary.verifiedObjects += 1;
      summary.verifiedBytes += sourceBuffer.length;
    } catch (error) {
      summary.failures.push({ path: object.path, sourceUrl: object.sourceUrl, message: String(error?.message || error) });
    } finally {
      completed += 1;
      if (completed % 25 === 0 || completed === selected.length) {
        console.log(JSON.stringify({
          progress: `${completed}/${selected.length}`,
          verified: summary.verifiedObjects,
          uploaded: summary.uploadedObjects,
          resumed: summary.resumedObjects,
          failures: summary.failures.length,
        }));
      }
    }
  });

  await manifestQueue;
  summary.completedAt = new Date().toISOString();
  fs.writeFileSync(summaryPath, `${JSON.stringify(summary, null, 2)}\n`);
  console.log(JSON.stringify({ ...summary, manifestPath, summaryPath }, null, 2));
  if (summary.failures.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : String(error));
  process.exitCode = 1;
});
