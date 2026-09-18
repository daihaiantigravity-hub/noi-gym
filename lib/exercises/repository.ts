import "server-only";

import { createSupabaseAdminClient, createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { getExerciseCategoryOrder } from "./category-order";
import { getLocalPublicExerciseBySourceId, getLocalPublicExerciseBySourceUrl, getSourceMuscleName } from "./source";
import { PUBLIC_EXERCISES_PAGE_SIZE } from "./pagination";
import type { ValidatedExerciseInput } from "./validation";
import type { ExerciseFormValues, ExerciseListFilters, ExerciseListItem, ExerciseRecord, ExerciseStats, PublicExercise, PublicExercisePage } from "./types";
import type { ExerciseTargetMode } from "./types";

const exerciseSelect = "id, source, source_id, name, slug, description, primary_muscles, category, force, grips, mechanic, difficulty, status, steps, media, source_snapshot, created_at, updated_at";

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
    media: row.media ?? [],
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

function mapPublicExercise(row: ExerciseRow): PublicExercise {
  const exercise = mapRow(row);
  const fallback = getLocalSupplement(exercise);
  const snapshotMedia = getSnapshotPosterMedia(exercise.sourceSnapshot);
  return {
    id: exercise.id,
    name: exercise.name,
    description: exercise.description || fallback?.description || "",
    primaryMuscles: exercise.primaryMuscles.length > 0 ? exercise.primaryMuscles : fallback?.primaryMuscles ?? [],
    category: exercise.category || fallback?.category || "",
    difficulty: exercise.difficulty || fallback?.difficulty || "",
    steps: exercise.steps.length > 0 ? exercise.steps : fallback?.steps ?? [],
    media: mergePublicMedia(exercise.media, mergePublicMedia(fallback?.media ?? [], snapshotMedia)),
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
    mediaCount: row.media?.filter((item) => Boolean(item.videoUrl)).length ?? 0,
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
    media: input.media,
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

function getPublicPageOptions(options: { page?: number; pageSize?: number }) {
  const page = Math.max(options.page ?? 1, 1);
  const pageSize = Math.min(Math.max(options.pageSize ?? PUBLIC_EXERCISES_PAGE_SIZE, 1), 100);

  return { page, pageSize, start: (page - 1) * pageSize };
}

function comparePublicRowsByCategoryOrder(first: ExerciseRow, second: ExerciseRow) {
  const categoryDifference = getExerciseCategoryOrder(first.category) - getExerciseCategoryOrder(second.category);
  if (categoryDifference !== 0) return categoryDifference;

  const updatedAtDifference = new Date(second.updated_at).getTime() - new Date(first.updated_at).getTime();
  if (updatedAtDifference !== 0) return updatedAtDifference;

  return first.name.localeCompare(second.name);
}

export async function listPublishedExercises(muscle: string, options: { category?: string; page?: number; pageSize?: number } = {}): Promise<PublicExercisePage> {
  const { page, pageSize, start } = getPublicPageOptions(options);
  if (!isSupabaseConfigured()) return { items: [], total: 0, page, pageSize };

  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("exercises")
    .select(exerciseSelect, { count: "exact" })
    .eq("status", "Published")
    .overlaps("primary_muscles", [getSourceMuscleName(muscle)])
    .order("updated_at", { ascending: false });

  if (options.category) query = query.eq("category", options.category);
  if (options.category) query = query.range(start, start + pageSize - 1);

  const { data, error, count } = await query;
  if (error) throwDatabaseError(error);

  const rows = (data ?? []) as ExerciseRow[];
  const orderedRows = options.category
    ? rows
    : [...rows].sort(comparePublicRowsByCategoryOrder).slice(start, start + pageSize);

  return { items: orderedRows.map(mapPublicExercise), total: count ?? rows.length, page, pageSize };
}

export async function listPublishedExercisesByTarget(mode: ExerciseTargetMode, slug: string, options: { category?: string; page?: number; pageSize?: number } = {}): Promise<PublicExercisePage> {
  const { page, pageSize, start } = getPublicPageOptions(options);
  if (!isSupabaseConfigured()) return { items: [], total: 0, page, pageSize };

  const supabase = await createSupabaseServerClient();
  const { data: targets, error: targetError } = await supabase
    .from("exercise_targets")
    .select("exercise_id")
    .eq("mode", mode)
    .eq("slug", slug);
  if (targetError) throwDatabaseError(targetError);

  const exerciseIds = (targets ?? []).map((target) => String(target.exercise_id));
  if (exerciseIds.length === 0) return { items: [], total: 0, page, pageSize };

  let query = supabase
    .from("exercises")
    .select(exerciseSelect, { count: "exact" })
    .eq("status", "Published")
    .in("id", exerciseIds)
    .order("updated_at", { ascending: false });
  if (options.category) query = query.eq("category", options.category);
  if (options.category) query = query.range(start, start + pageSize - 1);

  const { data, error, count } = await query;
  if (error) throwDatabaseError(error);

  const rows = (data ?? []) as ExerciseRow[];
  const orderedRows = options.category
    ? rows
    : [...rows].sort(comparePublicRowsByCategoryOrder).slice(start, start + pageSize);

  return { items: orderedRows.map(mapPublicExercise), total: count ?? rows.length, page, pageSize };
}

export async function getPublishedExerciseByKey(key: string) {
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

  const { data, error } = await query.maybeSingle();
  if (error) throwDatabaseError(error);
  return data ? mapPublicExercise(data as ExerciseRow) : null;
}

export async function createExercise(input: ValidatedExerciseInput) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("exercises").insert(toDatabaseRow(input)).select("id").single();
  if (error) throwDatabaseError(error);
  return getExercise((data as { id: string }).id);
}

export async function updateExercise(id: string, input: ValidatedExerciseInput) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("exercises").update(toDatabaseRow(input)).eq("id", id);
  if (error) throwDatabaseError(error);
  return getExercise(id);
}

export async function deleteExercise(id: string) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("exercises").delete().eq("id", id);
  if (error) throwDatabaseError(error);
}

export async function upsertExercises(inputs: ValidatedExerciseInput[]) {
  if (inputs.length === 0) return 0;

  const supabase = createSupabaseAdminClient();
  const rows = inputs.map(toDatabaseRow);
  const { error } = await supabase.from("exercises").upsert(rows, { onConflict: "source,source_id" });
  if (error) throwDatabaseError(error);
  return inputs.length;
}
