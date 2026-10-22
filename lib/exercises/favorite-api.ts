import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const sourceKeyPattern = /^source-(\d+)$/;

export type FavoriteExerciseKeyRow = {
  id: string;
  source: string;
  source_id: number | null;
  status: string;
};

export type FavoriteRelationRow = {
  exercise_id: string;
  exercises: FavoriteExerciseKeyRow | FavoriteExerciseKeyRow[] | null;
};

export function exerciseKeys(exercise: Pick<FavoriteExerciseKeyRow, "id" | "source" | "source_id">) {
  const keys = [exercise.id];
  if (exercise.source === "musclewiki" && exercise.source_id) keys.push(`source-${exercise.source_id}`);
  return keys;
}

export function favoriteKeys(row: FavoriteRelationRow) {
  const relation = Array.isArray(row.exercises) ? row.exercises[0] : row.exercises;
  return relation ? exerciseKeys(relation) : [row.exercise_id];
}

export async function resolvePublishedExercise(supabase: SupabaseClient, exerciseKey: string) {
  let query = supabase.from("exercises").select("id, source, source_id, status").eq("status", "Published");
  const sourceMatch = sourceKeyPattern.exec(exerciseKey);

  if (uuidPattern.test(exerciseKey)) {
    query = query.eq("id", exerciseKey);
  } else if (sourceMatch) {
    query = query.eq("source", "musclewiki").eq("source_id", Number(sourceMatch[1]));
  } else {
    throw new Error("Invalid exercise ID");
  }

  const { data, error } = await query.maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Published exercise not found");
  return data as FavoriteExerciseKeyRow;
}

export async function readExerciseKey(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new Error("Invalid request data");
  }

  const exerciseId = body && typeof body === "object" && "exerciseId" in body
    ? String((body as { exerciseId?: unknown }).exerciseId ?? "").trim()
    : "";
  if (!exerciseId) throw new Error("Exercise ID is required");
  return exerciseId;
}
