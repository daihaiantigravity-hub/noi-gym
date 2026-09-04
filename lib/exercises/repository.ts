import "server-only";

import { createSupabaseAdminClient, createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { getSourceMuscleName } from "./source";
import type { ValidatedExerciseInput } from "./validation";
import type { ExerciseFormValues, ExerciseListFilters, ExerciseListItem, ExerciseRecord, ExerciseStats, PublicExercise } from "./types";

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

function mapPublicExercise(row: ExerciseRow): PublicExercise {
  const exercise = mapRow(row);
  return {
    id: exercise.id,
    name: exercise.name,
    description: exercise.description,
    primaryMuscles: exercise.primaryMuscles,
    category: exercise.category,
    difficulty: exercise.difficulty,
    steps: exercise.steps,
    media: exercise.media,
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
    description: input.description || null,
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

export async function listPublishedExercises(muscle: string) {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("exercises")
    .select(exerciseSelect)
    .eq("status", "Published")
    .overlaps("primary_muscles", [getSourceMuscleName(muscle)])
    .order("updated_at", { ascending: false });

  if (error) throwDatabaseError(error);
  return ((data ?? []) as ExerciseRow[]).map(mapPublicExercise);
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
