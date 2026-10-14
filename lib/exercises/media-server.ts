import "server-only";

import { EXERCISE_MEDIA_BUCKET } from "./media";

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function encodeStoragePath(storagePath: string) {
  return storagePath
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

export function getExerciseMediaPublicBaseUrl() {
  const externalBaseUrl = process.env.R2_PUBLIC_BASE_URL?.trim();
  if (externalBaseUrl) return trimTrailingSlash(externalBaseUrl);

  return getSupabaseExerciseMediaPublicBaseUrl();
}

function getSupabaseExerciseMediaPublicBaseUrl() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  return supabaseUrl
    ? `${trimTrailingSlash(supabaseUrl)}/storage/v1/object/public/${EXERCISE_MEDIA_BUCKET}`
    : "";
}

function getUnavailableMediaPaths() {
  return new Set(
    process.env.EXERCISE_MEDIA_UNAVAILABLE_PATHS
      ?.split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  );
}

export function isExerciseMediaUnavailable(storagePath?: string | null) {
  return Boolean(storagePath && getUnavailableMediaPaths().has(storagePath));
}

function shouldUseR2(gender?: "male" | "female") {
  if (!process.env.R2_PUBLIC_BASE_URL?.trim()) return false;

  const migratedGenders = process.env.R2_MIGRATED_EXERCISE_GENDERS
    ?.split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  if (!gender || !migratedGenders?.length) return true;
  return migratedGenders.includes(gender);
}

export function getExerciseMediaPublicUrl(storagePath: string, gender?: "male" | "female") {
  if (isExerciseMediaUnavailable(storagePath)) return "";

  const baseUrl = shouldUseR2(gender)
    ? trimTrailingSlash(process.env.R2_PUBLIC_BASE_URL ?? "")
    : getSupabaseExerciseMediaPublicBaseUrl();
  const encodedPath = encodeStoragePath(storagePath);
  return baseUrl && encodedPath ? `${baseUrl}/${encodedPath}` : "";
}
