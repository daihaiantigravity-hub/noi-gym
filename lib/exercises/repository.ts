import "server-only";

import { revalidateTag, unstable_cache } from "next/cache";
import { createSupabaseAdminClient, createSupabaseServerClient, isDatabaseConfigured, isSupabaseConfigured } from "@/lib/supabase/server";
import { getExerciseCategoryOrder } from "./category-order";
import { getLocalPublicExerciseBySourceId, getLocalPublicExerciseBySourceUrl, getSourceMuscleNames } from "./source";
import { PUBLIC_EXERCISES_PAGE_SIZE } from "./pagination";
import type { ValidatedExerciseInput } from "./validation";
import type { ExerciseFormValues, ExerciseGender, ExerciseListFilters, ExerciseListItem, ExerciseRecord, ExerciseStats, PublicExercise, PublicExercisePage } from "./types";
import type { ExerciseTargetMode } from "./types";

const exerciseSelect = "id, source, source_id, name, slug, description, primary_muscles, category, force, grips, mechanic, difficulty, status, steps, media, source_snapshot, created_at, updated_at";
const publicOrderSelect = "id, name, category, updated_at";
export const PUBLIC_EXERCISES_CACHE_TAG = "public-exercises";
const femaleStoragePathPattern = /^exercises\/musclewiki\/female\/\d+-(front|side)\.mp4$/;

function isStoredFemaleMedia(item: ExerciseFormValues["media"][number]) {
  return item.gender === "female" && Boolean(item.storagePath && femaleStoragePathPattern.test(item.storagePath));
}

function hydrateAdminMedia(media: ExerciseFormValues["media"]) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  return media.map((item) => isStoredFemaleMedia(item) && !item.videoUrl && supabaseUrl
    ? { ...item, videoUrl: `${supabaseUrl}/storage/v1/object/public/exercise-media/${item.storagePath}` }
    : item);
}

type ExerciseRow = {
  id: string;
  source: ExerciseFormValues["source"];
  source_id: number | null;
  name: string;
  slug: string;
  description: string | null;
  primary_muscles: string[] | null;
  category: string;
  force: ExerciseFormValues["force"];
  grips: ExerciseFormValues["grips"];
  mechanic: ExerciseFormValues["mechanic"];
  difficulty: ExerciseFormValues["difficulty"];
  status: ExerciseFormValues["status"];
  steps: string[] | null;
  media: ExerciseFormValues["media"] | null;
  source_snapshot: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

type PublicOrderRow = Pick<ExerciseRow, "id" | "name" | "category" | "updated_at">;
type PublicQueryClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

function mapRow(row: ExerciseRow): ExerciseRecord {
  return {
    id: row.id,
    source: row.source,
    sourceId: row.source_id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? "",
    primaryMuscles: row.primary_muscles ?? [],
    category: row.category,
    force: row.force ?? "",
    grips: row.grips ?? "",
    mechanic: row.mechanic ?? "",
    difficulty: row.difficulty ?? "",
    status: row.status,
    steps: row.steps ?? [],
    media: hydrateAdminMedia(row.media ?? []),
    sourceSnapshot: row.source_snapshot,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mergePublicMedia(existing: PublicExercise["media"], fallback: PublicExercise["media"]) {
  const media = [...existing];

  for (const item of fallback) {
    const index = media.findIndex((candidate) => candidate.gender === item.gender && candidate.angle === item.angle);
    if (index < 0) {
      media.push(item);
      continue;
    }

    media[index] = {
      ...media[index],
      ...(!media[index].videoUrl && item.videoUrl ? { videoUrl: item.videoUrl } : {}),
      ...(!media[index].posterUrl && item.posterUrl ? { posterUrl: item.posterUrl } : {}),
    };
  }

  return media;
}

function getLocalSupplement(exercise: ExerciseRecord): PublicExercise | null {
  if (exercise.source !== "musclewiki") return null;
  if (exercise.sourceId) return getLocalPublicExerciseBySourceId(exercise.sourceId);

  const snapshot = exercise.sourceSnapshot;
  const sourceUrl = snapshot && typeof snapshot.sourceUrl === "string"
    ? snapshot.sourceUrl
    : snapshot && typeof snapshot.source_url === "string"
      ? snapshot.source_url
      : "";
  return sourceUrl ? getLocalPublicExerciseBySourceUrl(sourceUrl) : null;
}

function getSnapshotPosterMedia(snapshot: Record<string, unknown> | null | undefined): PublicExercise["media"] {
  if (!snapshot) return [];

  const rawMedia = Array.isArray(snapshot.videos)
    ? snapshot.videos
    : Array.isArray(snapshot.media)
      ? snapshot.media
      : [];

  return rawMedia.flatMap((value) => {
    if (!value || typeof value !== "object") return [];

    const item = value as Record<string, unknown>;
    const videoUrl = typeof item.videoUrl === "string" ? item.videoUrl : typeof item.url === "string" && item.type === "video" ? item.url : "";
    const posterUrl = typeof item.og_image === "string"
      ? item.og_image
      : item.type === "image" && typeof item.url === "string"
        ? item.url
        : "";
    if (!posterUrl) return [];

    const source = `${videoUrl} ${posterUrl}`;
    return [{
      gender: item.gender === "female" ? "female" : "male",
      angle: item.angle === "side" || /-side(?:[_./?]|$)/i.test(source) ? "side" : "front",
      videoUrl,
      posterUrl,
    }];
  });
}

function mapPublicExercise(row: ExerciseRow, gender?: ExerciseGender): PublicExercise {
  const exercise = mapRow(row);
  const fallback = getLocalSupplement(exercise);
  const snapshotMedia = getSnapshotPosterMedia(exercise.sourceSnapshot);
  const mergedMedia = mergePublicMedia(exercise.media, mergePublicMedia(fallback?.media ?? [], snapshotMedia));
  const playableMaleMedia = mergedMedia.filter((item) => item.gender === "male" && item.videoUrl);
  return {
    id: exercise.id,
    name: exercise.name,
    description: exercise.description || fallback?.description || "",
    primaryMuscles: exercise.primaryMuscles.length > 0 ? exercise.primaryMuscles : fallback?.primaryMuscles ?? [],
    category: exercise.category || fallback?.category || "",
    difficulty: exercise.difficulty || fallback?.difficulty || "",
    steps: exercise.steps.length > 0 ? exercise.steps : fallback?.steps ?? [],
    media: gender
      ? mergedMedia.filter((item) => item.gender === gender)
      : playableMaleMedia.length > 0 ? mergedMedia.filter((item) => item.gender === "male") : mergedMedia.filter((item) => item.gender === "female"),
  };
}

function mapListItem(row: ExerciseRow): ExerciseListItem {
  return {
    id: row.id,
    source: row.source,
    sourceId: row.source_id,
    name: row.name,
    slug: row.slug,
    category: row.category,
    difficulty: row.difficulty,
    status: row.status,
    primaryMuscles: row.primary_muscles ?? [],
    stepsCount: row.steps?.filter(Boolean).length ?? 0,
    mediaCount: row.media?.filter((item) => Boolean(item.videoUrl) || isStoredFemaleMedia(item)).length ?? 0,
    femaleMediaCount: row.media?.filter((item) => item.gender === "female" && (Boolean(item.videoUrl) || isStoredFemaleMedia(item))).length ?? 0,
    updatedAt: row.updated_at,
  };
}

function toDatabaseRow(input: ValidatedExerciseInput) {
  return {
    source: input.source,
    source_id: input.sourceId,
    name: input.name,
    slug: input.slug,
    description: input.description,
    primary_muscles: input.primaryMuscles,
    category: input.category,
    force: input.force || null,
    grips: input.grips || null,
    mechanic: input.mechanic || null,
    difficulty: input.difficulty,
    status: input.status,
    steps: input.steps.filter(Boolean),
    media: input.media.map((item) => isStoredFemaleMedia(item) ? { ...item, videoUrl: "" } : item),
    source_snapshot: input.sourceSnapshot ?? null,
  };
}

function throwDatabaseError(error: { message?: string; code?: string }) {
  if (error.code === "23505") {
    throw new Error("Tên slug hoặc source ID đã tồn tại");
  }

  throw new Error(error.message || "Không thể lưu bài tập");
}

export async function listExercises(filters: ExerciseListFilters = {}) {
  const supabase = createSupabaseAdminClient();
  const page = Math.max(filters.page ?? 1, 1);
  const pageSize = Math.min(Math.max(filters.pageSize ?? 20, 1), 100);
  const start = (page - 1) * pageSize;

  let targetExerciseIds: string[] | null = null;
  if (filters.targetMode && filters.targetSlug) {
    const { data, error } = await supabase
      .from("exercise_targets")
      .select("exercise_id")
      .eq("mode", filters.targetMode)
      .eq("slug", filters.targetSlug);
    if (error) throwDatabaseError(error);
    targetExerciseIds = (data ?? []).map((row) => String(row.exercise_id));
    if (targetExerciseIds.length === 0) return { items: [], total: 0, page, pageSize };
  }

  let query = supabase
    .from("exercises")
    .select(exerciseSelect, { count: "exact" })
    .order("updated_at", { ascending: false })
    .range(start, start + pageSize - 1);

  if (filters.query?.trim()) query = query.ilike("name", `%${filters.query.trim()}%`);
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.category) query = query.eq("category", filters.category);
  if (filters.source) query = query.eq("source", filters.source);
  if (filters.gender) query = query.filter("media", "cs", JSON.stringify([{ gender: filters.gender }]));
  if (filters.muscle) query = query.overlaps("primary_muscles", [filters.muscle]);
  if (targetExerciseIds) query = query.in("id", targetExerciseIds);

  const { data, error, count } = await query;
  if (error) throwDatabaseError(error);

  return {
    items: ((data ?? []) as ExerciseRow[]).map(mapListItem),
    total: count ?? 0,
    page,
    pageSize,
  };
}

export async function getExerciseStats(): Promise<ExerciseStats> {
  const supabase = createSupabaseAdminClient();
  const statuses = ["Draft", "Published", "Archived"] as const;
  const results = await Promise.all(
    statuses.map(async (status) => {
      const result = await supabase.from("exercises").select("id", { count: "exact", head: true }).eq("status", status);
      if (result.error) throwDatabaseError(result.error);
      return [status, result.count ?? 0] as const;
    }),
  );

  const byStatus = Object.fromEntries(results) as Record<(typeof statuses)[number], number>;
  return {
    total: results.reduce((sum, [, count]) => sum + count, 0),
    draft: byStatus.Draft,
    published: byStatus.Published,
    archived: byStatus.Archived,
  };
}

export async function getExercise(id: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("exercises").select(exerciseSelect).eq("id", id).maybeSingle();
  if (error) throwDatabaseError(error);
  return data ? mapRow(data as ExerciseRow) : null;
}

type PublicExerciseOptions = { category?: string; gender?: ExerciseGender; page?: number; pageSize?: number };

function getPublicPageOptions(options: PublicExerciseOptions) {
  const page = Math.max(options.page ?? 1, 1);
  const pageSize = Math.min(Math.max(options.pageSize ?? PUBLIC_EXERCISES_PAGE_SIZE, 1), 100);

  return { page, pageSize, start: (page - 1) * pageSize };
}

function comparePublicRowsByCategoryOrder(first: PublicOrderRow, second: PublicOrderRow) {
  const categoryDifference = getExerciseCategoryOrder(first.category) - getExerciseCategoryOrder(second.category);
  if (categoryDifference !== 0) return categoryDifference;

  const updatedAtDifference = new Date(second.updated_at).getTime() - new Date(first.updated_at).getTime();
  if (updatedAtDifference !== 0) return updatedAtDifference;

  return first.name.localeCompare(second.name);
}

async function getPublishedExercisesByIds(supabase: PublicQueryClient, ids: string[], gender?: ExerciseGender) {
  if (ids.length === 0) return [];

  const { data, error } = await supabase
    .from("exercises")
    .select(exerciseSelect)
    .eq("status", "Published")
    .in("id", ids);
  if (error) throwDatabaseError(error);

  const rowsById = new Map((data ?? []).map((row) => [String(row.id), mapPublicExercise(row as ExerciseRow, gender)]));
  return ids.flatMap((id) => {
    const exercise = rowsById.get(id);
    return exercise ? [exercise] : [];
  });
}

async function listPublishedExercisesWithClient(supabase: PublicQueryClient, muscleNames: string[], options: PublicExerciseOptions = {}): Promise<PublicExercisePage> {
  const { page, pageSize, start } = getPublicPageOptions(options);
  if (options.category) {
    let query = supabase
      .from("exercises")
      .select(exerciseSelect, { count: "exact" })
      .eq("status", "Published")
      .overlaps("primary_muscles", muscleNames)
      .eq("category", options.category)
      .order("updated_at", { ascending: false })
      .range(start, start + pageSize - 1);
    if (options.gender) query = query.filter("media", "cs", JSON.stringify([{ gender: options.gender }]));
    const { data, error, count } = await query;
    if (error) throwDatabaseError(error);

    const rows = (data ?? []) as ExerciseRow[];
    return { items: rows.map((row) => mapPublicExercise(row, options.gender)), total: count ?? rows.length, page, pageSize };
  }

  let orderQuery = supabase
    .from("exercises")
    .select(publicOrderSelect, { count: "exact" })
    .eq("status", "Published")
    .overlaps("primary_muscles", muscleNames);
  if (options.gender) orderQuery = orderQuery.filter("media", "cs", JSON.stringify([{ gender: options.gender }]));
  const { data: orderData, error: orderError, count } = await orderQuery;
  if (orderError) throwDatabaseError(orderError);

  const orderedRows = [...((orderData ?? []) as PublicOrderRow[])]
    .sort(comparePublicRowsByCategoryOrder)
    .slice(start, start + pageSize);
  const items = await getPublishedExercisesByIds(supabase, orderedRows.map((row) => row.id), options.gender);

  return { items, total: count ?? orderData?.length ?? 0, page, pageSize };
}

async function listPublishedExercisesByTargetWithClient(supabase: PublicQueryClient, mode: ExerciseTargetMode, slug: string, options: PublicExerciseOptions = {}): Promise<PublicExercisePage> {
  const { page, pageSize, start } = getPublicPageOptions(options);
  const { data: targets, error: targetError } = await supabase
    .from("exercise_targets")
    .select("exercise_id")
    .eq("mode", mode)
    .eq("slug", slug);
  if (targetError) throwDatabaseError(targetError);

  const exerciseIds = (targets ?? []).map((target) => String(target.exercise_id));
  if (exerciseIds.length === 0) return { items: [], total: 0, page, pageSize };

  if (options.category) {
    let query = supabase
      .from("exercises")
      .select(exerciseSelect, { count: "exact" })
      .eq("status", "Published")
      .in("id", exerciseIds)
      .eq("category", options.category)
      .order("updated_at", { ascending: false })
      .range(start, start + pageSize - 1);
    if (options.gender) query = query.filter("media", "cs", JSON.stringify([{ gender: options.gender }]));
    const { data, error, count } = await query;
    if (error) throwDatabaseError(error);

    const rows = (data ?? []) as ExerciseRow[];
    return { items: rows.map((row) => mapPublicExercise(row, options.gender)), total: count ?? rows.length, page, pageSize };
  }

  let orderQuery = supabase
    .from("exercises")
    .select(publicOrderSelect)
    .eq("status", "Published")
    .in("id", exerciseIds);
  if (options.gender) orderQuery = orderQuery.filter("media", "cs", JSON.stringify([{ gender: options.gender }]));
  const { data: orderData, error: orderError } = await orderQuery;
  if (orderError) throwDatabaseError(orderError);

  const orderedRows = [...((orderData ?? []) as PublicOrderRow[])]
    .sort(comparePublicRowsByCategoryOrder)
    .slice(start, start + pageSize);
  const items = await getPublishedExercisesByIds(supabase, orderedRows.map((row) => row.id), options.gender);

  return { items, total: orderData?.length ?? 0, page, pageSize };
}

const getCachedPublishedExercises = unstable_cache(
  async (muscleNames: string[], category: string, gender: ExerciseGender | "", page: number, pageSize: number) => listPublishedExercisesWithClient(
    createSupabaseAdminClient(),
    muscleNames,
    { category: category || undefined, gender: gender || undefined, page, pageSize },
  ),
  ["public-exercises"],
  { revalidate: 60, tags: [PUBLIC_EXERCISES_CACHE_TAG] },
);

const getCachedPublishedExercisesByTarget = unstable_cache(
  async (mode: ExerciseTargetMode, slug: string, category: string, gender: ExerciseGender | "", page: number, pageSize: number) => listPublishedExercisesByTargetWithClient(
    createSupabaseAdminClient(),
    mode,
    slug,
    { category: category || undefined, gender: gender || undefined, page, pageSize },
  ),
  ["public-exercises-by-target"],
  { revalidate: 60, tags: [PUBLIC_EXERCISES_CACHE_TAG] },
);

export async function listPublishedExercises(muscle: string, options: PublicExerciseOptions = {}): Promise<PublicExercisePage> {
  const { page, pageSize } = getPublicPageOptions(options);
  if (!isSupabaseConfigured()) return { items: [], total: 0, page, pageSize };

  // Routes without a gender come from the default male body map.
  const gender = options.gender ?? "male";
  // Include the resolved names in the cache key, not just their potentially outdated slug.
  const muscleNames = getSourceMuscleNames(muscle);
  if (isDatabaseConfigured()) {
    return getCachedPublishedExercises(muscleNames, options.category ?? "", gender, page, pageSize);
  }

  return listPublishedExercisesWithClient(await createSupabaseServerClient(), muscleNames, { ...options, gender, page, pageSize });
}

export async function listPublishedExercisesByTarget(mode: ExerciseTargetMode, slug: string, options: PublicExerciseOptions = {}): Promise<PublicExercisePage> {
  const { page, pageSize } = getPublicPageOptions(options);
  if (!isSupabaseConfigured()) return { items: [], total: 0, page, pageSize };

  const gender = options.gender ?? "male";
  if (isDatabaseConfigured()) {
    return getCachedPublishedExercisesByTarget(mode, slug, options.category ?? "", gender, page, pageSize);
  }

  return listPublishedExercisesByTargetWithClient(await createSupabaseServerClient(), mode, slug, { ...options, gender, page, pageSize });
}

export async function getPublishedExerciseByKey(key: string, gender?: ExerciseGender) {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createSupabaseServerClient();
  let query = supabase.from("exercises").select(exerciseSelect).eq("status", "Published");
  if (/^[0-9a-f-]{36}$/i.test(key)) {
    query = query.eq("id", key);
  } else {
    const sourceId = key.startsWith("source-") ? Number(key.slice("source-".length)) : Number(key);
    if (!Number.isInteger(sourceId) || sourceId <= 0) return null;
    query = query.eq("source", "musclewiki").eq("source_id", sourceId);
  }
  if (gender) query = query.filter("media", "cs", JSON.stringify([{ gender }]));

  const { data, error } = await query.maybeSingle();
  if (error) throwDatabaseError(error);
  return data ? mapPublicExercise(data as ExerciseRow, gender) : null;
}

export async function createExercise(input: ValidatedExerciseInput) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("exercises").insert(toDatabaseRow(input)).select("id").single();
  if (error) throwDatabaseError(error);
  revalidateTag(PUBLIC_EXERCISES_CACHE_TAG, "max");
  return getExercise((data as { id: string }).id);
}

export async function updateExercise(id: string, input: ValidatedExerciseInput) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("exercises").update(toDatabaseRow(input)).eq("id", id);
  if (error) throwDatabaseError(error);
  revalidateTag(PUBLIC_EXERCISES_CACHE_TAG, "max");
  return getExercise(id);
}

export async function deleteExercise(id: string) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("exercises").delete().eq("id", id);
  if (error) throwDatabaseError(error);
  revalidateTag(PUBLIC_EXERCISES_CACHE_TAG, "max");
}

export async function upsertExercises(inputs: ValidatedExerciseInput[]) {
  if (inputs.length === 0) return 0;

  const supabase = createSupabaseAdminClient();
  const rows = inputs.map(toDatabaseRow);
  const { error } = await supabase.from("exercises").upsert(rows, { onConflict: "source,source_id" });
  if (error) throwDatabaseError(error);
  revalidateTag(PUBLIC_EXERCISES_CACHE_TAG, "max");
  return inputs.length;
}
