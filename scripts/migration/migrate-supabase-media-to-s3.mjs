import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { createClient } from "@supabase/supabase-js";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const sourceBucket = "exercise-media";

function loadLocalEnv() {
  const envPath = path.join(projectRoot, ".env.local");
  if (!fs.existsSync(envPath)) return;

  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
  }
}

function printHelp() {
  console.log(`Copy every object from Supabase Storage to Cloudflare R2 and an optional S3 backup.

Usage:
  npm run migrate:media:r2 -- [--apply] [--limit N] [--prefix PATH] [--concurrency N]

The default mode is read-only and only inventories source and targets. --apply downloads each
source object, computes SHA-256, uploads missing target objects, downloads them again, and records
the verified hashes. Existing target objects with different bytes stop the migration and are never
overwritten. This script never deletes source or target objects.
`);
}

function parseArgs(argv) {
  const options = { apply: false, limit: 0, prefix: "", concurrency: 4 };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--apply") options.apply = true;
    else if (argument === "--help" || argument === "-h") options.help = true;
    else if (["--limit", "--prefix", "--concurrency"].includes(argument)) {
      const value = argv[++index];
      if (!value) throw new Error(`${argument} needs a value`);
      if (argument === "--prefix") options.prefix = value.replace(/^\/+|\/+$/g, "");
      else options[argument.slice(2)] = Number(value);
    } else throw new Error(`Unknown argument: ${argument}`);
  }

  if (![options.limit, options.concurrency].every(Number.isSafeInteger) || options.limit < 0 || options.concurrency < 1 || options.concurrency > 12) {
    throw new Error("--limit must be zero or positive; --concurrency must be between 1 and 12");
  }
  return options;
}

function requiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing ${name} in .env.local`);
  return value;
}

function optionalTargetConfig(prefix, name, endpointFactory) {
  const names = ["ENDPOINT", "REGION", "BUCKET_NAME", "ACCESS_KEY_ID", "SECRET_ACCESS_KEY"];
  const values = Object.fromEntries(names.map((part) => [part, process.env[`${prefix}_${part}`]?.trim() ?? ""]));
  const configuredValues = Object.values(values).filter(Boolean).length;
  if (configuredValues === 0) return null;
  if (configuredValues !== names.length) throw new Error(`${name} backup configuration is incomplete`);

  return {
    name,
    endpoint: endpointFactory(values),
    region: values.REGION,
    bucket: values.BUCKET_NAME,
    accessKeyId: values.ACCESS_KEY_ID,
    secretAccessKey: values.SECRET_ACCESS_KEY,
  };
}

function getTargets() {
  const accountId = requiredEnv("R2_ACCOUNT_ID");
  const primary = {
    name: "r2",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    region: "auto",
    bucket: requiredEnv("R2_BUCKET_NAME"),
    accessKeyId: requiredEnv("R2_ACCESS_KEY_ID"),
    secretAccessKey: requiredEnv("R2_SECRET_ACCESS_KEY"),
  };
  const backup = optionalTargetConfig("MEDIA_BACKUP_S3", "backup", (values) => values.ENDPOINT);
  return [primary, ...(backup ? [backup] : [])].map((target) => ({
    ...target,
    client: new S3Client({
      region: target.region,
      endpoint: target.endpoint,
      credentials: { accessKeyId: target.accessKeyId, secretAccessKey: target.secretAccessKey },
      maxAttempts: 4,
    }),
  }));
}

function createSupabaseStorage() {
  const url = requiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  const key = process.env.SUPABASE_SECRET_KEY?.trim() || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!key) throw new Error("Missing SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY in .env.local");

  const client = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
    ...(key.startsWith("sb_secret_") ? { global: { fetch: async (input, init) => {
      const headers = new Headers(init?.headers);
      headers.delete("Authorization");
      return fetch(input, { ...init, headers });
    } } } : {}),
  });
  return client.storage.from(sourceBucket);
}

function objectPath(prefix, name) {
  return prefix ? `${prefix}/${name}` : name;
}

async function listAllSourceObjects(storage, rootPrefix) {
  const objects = [];
  const pendingFolders = [rootPrefix];

  while (pendingFolders.length) {
    const prefix = pendingFolders.shift();
    for (let offset = 0; ; offset += 1000) {
      const { data, error } = await storage.list(prefix, {
        limit: 1000,
        offset,
        sortBy: { column: "name", order: "asc" },
      });
      if (error) {
        const quota = error.statusCode === "402" || error.message?.includes("exceed_storage_size_quota");
        throw new Error(quota
          ? "Supabase Storage is restricted by exceed_storage_size_quota; unlock the project before copying objects"
          : `Could not list Supabase Storage ${prefix || "/"}: ${error.message}`);
      }

      for (const item of data ?? []) {
        const itemPath = objectPath(prefix, item.name);
        if (item.id) objects.push({
          path: itemPath,
          sourceSize: Number(item.metadata?.size ?? 0),
          sourceUpdatedAt: item.updated_at ?? item.metadata?.lastModified ?? "",
          sourceEtag: item.metadata?.eTag ?? item.metadata?.etag ?? "",
        });
        else pendingFolders.push(itemPath);
      }
      if (!data || data.length < 1000) break;
    }
  }

  return objects.sort((first, second) => first.path.localeCompare(second.path));
}

function hashBuffer(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

async function bodyToBuffer(body) {
  if (!body) throw new Error("S3 returned an empty object body");
  if (typeof body.transformToByteArray === "function") return Buffer.from(await body.transformToByteArray());
  const chunks = [];
  for await (const chunk of body) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks);
}

async function headTarget(target, key) {
  try {
    return await target.client.send(new HeadObjectCommand({ Bucket: target.bucket, Key: key }));
  } catch (error) {
    if (error?.$metadata?.httpStatusCode === 404 || error?.name === "NotFound" || error?.name === "NoSuchKey") return null;
    throw error;
  }
}

async function readTargetHash(target, key) {
  const response = await target.client.send(new GetObjectCommand({ Bucket: target.bucket, Key: key }));
  const buffer = await bodyToBuffer(response.Body);
  return { size: buffer.length, sha256: hashBuffer(buffer) };
}

async function verifyOrCopyTarget(target, object, sourceBuffer, sha256, contentType, apply) {
  const head = await headTarget(target, object.path);
  if (!apply) return { status: head ? "existing-unverified" : "missing", size: Number(head?.ContentLength ?? 0) };

  if (head) {
    if (Number(head.ContentLength ?? -1) !== sourceBuffer.length) {
      throw new Error(`${target.name} already has a different-size object: ${object.path}`);
    }
    if (head.Metadata?.sha256 === sha256) return { status: "verified-existing", size: sourceBuffer.length, sha256 };

    const targetObject = await readTargetHash(target, object.path);
    if (targetObject.size !== sourceBuffer.length || targetObject.sha256 !== sha256) {
      throw new Error(`${target.name} already has different bytes: ${object.path}`);
    }
    return { status: "verified-existing", size: targetObject.size, sha256: targetObject.sha256 };
  }

  await target.client.send(new PutObjectCommand({
    Bucket: target.bucket,
    Key: object.path,
    Body: sourceBuffer,
    ContentType: contentType,
    CacheControl: "public, max-age=31536000, immutable",
    Metadata: { sha256, source: "supabase-exercise-media" },
  }));
  const targetObject = await readTargetHash(target, object.path);
  if (targetObject.size !== sourceBuffer.length || targetObject.sha256 !== sha256) {
    throw new Error(`${target.name} verification failed after upload: ${object.path}`);
  }
  return { status: "verified-uploaded", size: targetObject.size, sha256: targetObject.sha256 };
}

function readManifest(manifestPath) {
  const records = new Map();
  if (!fs.existsSync(manifestPath)) return records;
  for (const line of fs.readFileSync(manifestPath, "utf8").split(/\r?\n/).filter(Boolean)) {
    const record = JSON.parse(line);
    if (record.path) records.set(record.path, record);
  }
  return records;
}

function contentTypeFor(blob, storagePath) {
  if (blob.type) return blob.type;
  if (storagePath.endsWith(".webm")) return "video/webm";
  if (storagePath.endsWith(".mov")) return "video/quicktime";
  return "video/mp4";
}

async function runPool(items, concurrency, worker) {
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (next < items.length) {
      const item = items[next++];
      await worker(item);
    }
  }));
}

loadLocalEnv();
const options = parseArgs(process.argv.slice(2));
if (options.help) {
  printHelp();
  process.exit(0);
}

const outputDir = path.join(projectRoot, "artifacts", "media-migration");
fs.mkdirSync(outputDir, { recursive: true });
const manifestPath = path.join(outputDir, "manifest.jsonl");
const summaryPath = path.join(outputDir, "summary.json");
const previousManifest = readManifest(manifestPath);
const storage = createSupabaseStorage();
const targets = getTargets();
const inventory = await listAllSourceObjects(storage, options.prefix);
const objects = options.limit ? inventory.slice(0, options.limit) : inventory;
const summary = {
  mode: options.apply ? "copy-and-verify" : "inventory",
  sourceBucket,
  prefix: options.prefix,
  discoveredObjects: inventory.length,
  selectedObjects: objects.length,
  targets: targets.map((target) => target.name),
  verifiedObjects: 0,
  uploadedObjects: 0,
  resumedObjects: 0,
  missingObjects: 0,
  failedObjects: [],
  verifiedBytes: 0,
  startedAt: new Date().toISOString(),
};
let completed = 0;
let appendQueue = Promise.resolve();

await runPool(objects, options.concurrency, async (object) => {
  try {
    const previous = previousManifest.get(object.path);
    const sourceUnchanged = previous
      && previous.sourceSize === object.sourceSize
      && previous.sourceUpdatedAt === object.sourceUpdatedAt
      && targets.every((target) => previous.targets?.[target.name]?.sha256 === previous.sha256);
    if (options.apply && sourceUnchanged) {
      const heads = await Promise.all(targets.map((target) => headTarget(target, object.path)));
      const targetsStillMatch = heads.every((head, index) => head
        && Number(head.ContentLength ?? -1) === previous.size
        && (!head.Metadata?.sha256 || head.Metadata.sha256 === previous.sha256)
        && previous.targets?.[targets[index].name]?.sha256 === previous.sha256);
      if (targetsStillMatch) {
        summary.verifiedObjects += 1;
        summary.resumedObjects += 1;
        summary.verifiedBytes += previous.size;
        return;
      }
    }

    if (!options.apply) {
      const results = await Promise.all(targets.map((target) => verifyOrCopyTarget(target, object, Buffer.alloc(0), "", "", false)));
      summary.missingObjects += results.filter((result) => result.status === "missing").length;
      return;
    }

    const { data: blob, error } = await storage.download(object.path);
    if (error || !blob) throw new Error(error?.message || `Could not download ${object.path}`);
    const sourceBuffer = Buffer.from(await blob.arrayBuffer());
    if (!sourceBuffer.length) throw new Error(`Source object is empty: ${object.path}`);
    if (object.sourceSize && object.sourceSize !== sourceBuffer.length) {
      throw new Error(`Source size changed while copying ${object.path}: ${object.sourceSize} -> ${sourceBuffer.length}`);
    }

    const sha256 = hashBuffer(sourceBuffer);
    const contentType = contentTypeFor(blob, object.path);
    const targetEntries = await Promise.all(targets.map(async (target) => [
      target.name,
      await verifyOrCopyTarget(target, object, sourceBuffer, sha256, contentType, true),
    ]));
    const record = {
      path: object.path,
      size: sourceBuffer.length,
      sha256,
      contentType,
      sourceSize: object.sourceSize || sourceBuffer.length,
      sourceUpdatedAt: object.sourceUpdatedAt,
      sourceEtag: object.sourceEtag,
      targets: Object.fromEntries(targetEntries),
      verifiedAt: new Date().toISOString(),
    };
    appendQueue = appendQueue.then(() => fs.promises.appendFile(manifestPath, `${JSON.stringify(record)}\n`));
    await appendQueue;

    summary.verifiedObjects += 1;
    summary.verifiedBytes += sourceBuffer.length;
    summary.uploadedObjects += targetEntries.filter(([, result]) => result.status === "verified-uploaded").length;
  } catch (error) {
    summary.failedObjects.push({ path: object.path, message: String(error?.message || error) });
  } finally {
    completed += 1;
    if (completed % 25 === 0 || completed === objects.length) {
      console.log(JSON.stringify({ progress: `${completed}/${objects.length}`, verified: summary.verifiedObjects, failures: summary.failedObjects.length }));
    }
  }
});

summary.completedAt = new Date().toISOString();
fs.writeFileSync(summaryPath, `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify({ ...summary, manifestPath, summaryPath }, null, 2));
if (summary.failedObjects.length) process.exitCode = 1;
