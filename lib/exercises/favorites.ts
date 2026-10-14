import "server-only";

import { requireAdmin } from "@/lib/admin-auth";
import { slugify } from "./slug";
import type { ExerciseDifficulty, ExerciseGender, ExerciseStatus } from "./types";

type FavoriteExerciseRelation = {
  id: string;
  name: string;
  primary_muscles: string[] | null;
  category: string;
  difficulty: ExerciseDifficulty | null;
  status: ExerciseStatus;
  media: Array<{ gender?: string }> | null;
};

type FavoriteRow = {
  created_at: string;
  exercises: FavoriteExerciseRelation | FavoriteExerciseRelation[] | null;
};

export type AdminFavoriteExercise = {
  id: string;
  name: string;
  primaryMuscles: string[];
  category: string;
  difficulty: ExerciseDifficulty | "";
  status: ExerciseStatus;
  gender?: ExerciseGender;
  mediaLabel: string;
  publicHref: string;
  savedAt: string;
};

const muscleSlugByName: Record<string, string> = {
  Abdominals: "abdominals",
  Biceps: "biceps",
  Calves: "calves",
  Chest: "chest",
  Forearms: "forearms",
  "Front Shoulders": "front-shoulders",
  Glutes: "glutes",
  Hamstrings: "hamstrings",
  Lats: "lats",
  "Lower Back": "lowerback",
  "Lower back": "lowerback",
  "Middle Traps": "traps-middle",
  Obliques: "obliques",
  Quads: "quads",
  "Rear Shoulders": "rear-shoulders",
  Shoulders: "shoulders",
  Traps: "traps",
  Triceps: "triceps",
};

function getRelation(row: FavoriteRow) {
  return Array.isArray(row.exercises) ? row.exercises[0] : row.exercises;
}

function getGender(media: FavoriteExerciseRelation["media"]): ExerciseGender | undefined {
  if (media?.some((item) => item.gender === "male")) return "male";
  if (media?.some((item) => item.gender === "female")) return "female";
  return undefined;
}

function getMediaLabel(media: FavoriteExerciseRelation["media"]) {
  const hasMale = media?.some((item) => item.gender === "male") ?? false;
  const hasFemale = media?.some((item) => item.gender === "female") ?? false;
  if (hasMale && hasFemale) return "Video nam và nữ";
  if (hasMale) return "Video nam";
  if (hasFemale) return "Video nữ";
  return "Chưa có video";
}

function getPublicHref(exercise: FavoriteExerciseRelation, gender?: ExerciseGender) {
  const primaryMuscle = exercise.primary_muscles?.[0] || "shoulders";
  const muscleSlug = muscleSlugByName[primaryMuscle] ?? slugify(primaryMuscle);
  const params = gender ? `?gender=${gender}` : "";
  return `/exercises/${muscleSlug}/${exercise.id}${params}`;
}

export async function listAdminFavoriteExercises() {
  const { user, supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("user_favorite_exercises")
    .select("created_at, exercises!inner(id, name, primary_muscles, category, difficulty, status, media)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as unknown as FavoriteRow[];
  const items = rows.flatMap((row): AdminFavoriteExercise[] => {
    const exercise = getRelation(row);
    if (!exercise) return [];
    const gender = getGender(exercise.media);
    return [{
      id: exercise.id,
      name: exercise.name,
      primaryMuscles: exercise.primary_muscles ?? [],
      category: exercise.category,
      difficulty: exercise.difficulty ?? "",
      status: exercise.status,
      gender,
      mediaLabel: getMediaLabel(exercise.media),
      publicHref: getPublicHref(exercise, gender),
      savedAt: row.created_at,
    }];
  });

  return items;
}
