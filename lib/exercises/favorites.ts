import "server-only";

import { requireAdmin } from "@/lib/admin-auth";
import { requireUser } from "@/lib/user-auth";
import { slugify } from "./slug";
import { localizeExercises } from "./translations";
import type { ExerciseDifficulty, ExerciseGender, ExerciseMediaValue, ExerciseStatus } from "./types";

type FavoriteExerciseRelation = {
  id: string;
  name: string;
  primary_muscles: string[] | null;
  category: string;
  difficulty: ExerciseDifficulty | null;
  status: ExerciseStatus;
  media: ExerciseMediaValue[] | null;
};

type FavoriteRow = {
  created_at: string;
  exercises: FavoriteExerciseRelation | FavoriteExerciseRelation[] | null;
};

type FeaturedRow = {
  featured_at: string;
  exercises: FavoriteExerciseRelation | FavoriteExerciseRelation[] | null;
};

export type FavoriteExercise = {
  id: string;
  name: string;
  primaryMuscles: string[];
  category: string;
  difficulty: ExerciseDifficulty | "";
  status: ExerciseStatus;
  gender?: ExerciseGender;
  mediaLabel: string;
  publicHref: string;
  posterUrl?: string;
  savedAt: string;
  isTranslationFallback?: boolean;
};

export const USER_FAVORITES_PAGE_SIZE = 12;

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

function getRelation(row: FavoriteRow | FeaturedRow) {
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
  if (hasMale && hasFemale) return "Male and female videos";
  if (hasMale) return "Male video";
  if (hasFemale) return "Female video";
  return "No video";
}

function getPublicHref(exercise: FavoriteExerciseRelation, gender?: ExerciseGender) {
  const primaryMuscle = exercise.primary_muscles?.[0] || "shoulders";
  const muscleSlug = muscleSlugByName[primaryMuscle] ?? slugify(primaryMuscle);
  const params = gender ? `?gender=${gender}` : "";
  return `/exercises/${muscleSlug}/${exercise.id}${params}`;
}

function mapFavoriteExercise(exercise: FavoriteExerciseRelation, savedAt: string): FavoriteExercise {
  const gender = getGender(exercise.media);
  return {
    id: exercise.id,
    name: exercise.name,
    primaryMuscles: exercise.primary_muscles ?? [],
    category: exercise.category,
    difficulty: exercise.difficulty ?? "",
    status: exercise.status,
    gender,
    mediaLabel: getMediaLabel(exercise.media),
    publicHref: getPublicHref(exercise, gender),
    posterUrl: exercise.media?.find((item) => item.posterUrl)?.posterUrl,
    savedAt,
  };
}

export async function listAdminFavoriteExercises() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("admin_featured_exercises")
    .select("featured_at, exercises!inner(id, name, primary_muscles, category, difficulty, status, media)")
    .order("featured_at", { ascending: false });
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as unknown as FeaturedRow[];
  return rows.flatMap((row): FavoriteExercise[] => {
    const exercise = getRelation(row);
    if (!exercise) return [];
    return [mapFavoriteExercise(exercise, row.featured_at)];
  });
}

export async function listUserFavoriteExercises(page = 1, pageSize = USER_FAVORITES_PAGE_SIZE) {
  const { user, supabase } = await requireUser();
  const safePage = Math.max(page, 1);
  const safePageSize = Math.min(Math.max(pageSize, 1), 48);
  const start = (safePage - 1) * safePageSize;
  const { data, error, count } = await supabase
    .from("user_favorite_exercises")
    .select("created_at, exercises!inner(id, name, primary_muscles, category, difficulty, status, media)", { count: "exact" })
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .range(start, start + safePageSize - 1);
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as unknown as FavoriteRow[];
  const items = rows.flatMap((row): FavoriteExercise[] => {
    const exercise = getRelation(row);
    if (!exercise) return [];
    return [mapFavoriteExercise(exercise, row.created_at)];
  });

  return { items: await localizeExercises(items), total: count ?? items.length, page: safePage, pageSize: safePageSize };
}
