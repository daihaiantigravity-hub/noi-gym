import "server-only";

import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

type R2Config = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
};

let cachedClient: S3Client | null = null;
let cachedConfigKey = "";

function getR2Config(): R2Config | null {
  const accountId = process.env.R2_ACCOUNT_ID?.trim() ?? "";
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim() ?? "";
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim() ?? "";
  const bucket = process.env.R2_BUCKET_NAME?.trim() ?? "";

  return accountId && accessKeyId && secretAccessKey && bucket
    ? { accountId, accessKeyId, secretAccessKey, bucket }
    : null;
}

function getR2Client(config: R2Config) {
  const configKey = `${config.accountId}:${config.accessKeyId}`;
  if (cachedClient && cachedConfigKey === configKey) return cachedClient;

  cachedConfigKey = configKey;
  cachedClient = new S3Client({
    region: "auto",
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
  return cachedClient;
}

export function isR2Configured() {
  return Boolean(getR2Config() && process.env.R2_PUBLIC_BASE_URL?.trim());
}

export async function createR2ExerciseMediaUpload({
  storagePath,
  contentType,
}: {
  storagePath: string;
  contentType: string;
}) {
  const config = getR2Config();
  if (!config || !process.env.R2_PUBLIC_BASE_URL?.trim()) {
    throw new Error("Cloudflare R2 is not fully configured");
  }

  const cacheControl = "public, max-age=31536000, immutable";
  const command = new PutObjectCommand({
    Bucket: config.bucket,
    Key: storagePath,
    ContentType: contentType,
    CacheControl: cacheControl,
  });
  const signedUrl = await getSignedUrl(getR2Client(config), command, { expiresIn: 10 * 60 });

  return {
    signedUrl,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": cacheControl,
    },
  };
}
