import "server-only";

import sourceData from "@/data/musclewiki-exercises-collected.json";
import type { MuscleWikiExercise, MuscleWikiVideo } from "@/lib/musclewiki";
import { EMPTY_EXERCISE_FORM } from "./constants";
import { slugify } from "./slug";
import type { ExerciseDifficulty, ExerciseFormValues, ExerciseListItem, ExerciseMediaValue, ExerciseSourceOption, PublicExercise } from "./types";

const collectedExercises = sourceData.results as MuscleWikiExercise[];
const sourceMuscleNameBySlug: Record<string, string> = {
  abdominals: "Abdominals",
  calves: "Calves",
  chest: "Chest",
  glutes: "Glutes",
  hamstrings: "Hamstrings",
  lats: "Lats",
  lowerback: "Lower back",
  obliques: "Obliques",
  quads: "Quads",
  shoulders: "Shoulders",
  traps: "Traps",
  triceps: "Triceps",
};

export function getSourceMuscleName(muscle: string) {
  return sourceMuscleNameBySlug[muscle] ?? muscle;
}

function normalizeDifficulty(value: string | undefined): ExerciseDifficulty | "" {
  if (value === "Beginner" || value === "Novice" || value === "Intermediate" || value === "Advanced") {
    return value;
  }

  return "";
}

function normalizeVideo(video: MuscleWikiVideo): ExerciseMediaValue | null {
  if (video.gender !== "male" && video.gender !== "female") return null;
  if (video.angle !== "front" && video.angle !== "side") return null;
  if (!video.url && !video.og_image) return null;

  return {
    gender: video.gender,
    angle: video.angle,
    videoUrl: video.url ?? "",
    posterUrl: video.og_image ?? "",
  };
}

function toFormValues(exercise: MuscleWikiExercise): ExerciseFormValues {
  const media = (exercise.videos ?? [])
    .map(normalizeVideo)
    .filter((item): item is NonNullable<ReturnType<typeof normalizeVideo>> => Boolean(item));

  return {
    ...EMPTY_EXERCISE_FORM,
    source: "musclewiki",
    sourceId: exercise.id,
    name: exercise.name,
    slug: slugify(exercise.name),
    primaryMuscles: exercise.primary_muscles ?? [],
    category: exercise.category ?? "",
    force: exercise.force === "Push" || exercise.force === "Pull" || exercise.force === "Hold" ? exercise.force : "",
    grips:
      exercise.grips === "Mixed" || exercise.grips === "Neutral" || exercise.grips === "None" || exercise.grips === "Overhand" || exercise.grips === "Underhand"
        ? exercise.grips
        : "",
    mechanic: exercise.mechanic === "Compound" || exercise.mechanic === "Isolation" ? exercise.mechanic : "",
    difficulty: normalizeDifficulty(exercise.difficulty),
    steps: exercise.steps?.filter(Boolean) ?? [""],
    media,
    sourceSnapshot: exercise as unknown as Record<string, unknown>,
  };
}

export function getSourceExerciseOptions(): ExerciseSourceOption[] {
  return collectedExercises.map((exercise) => ({
    id: exercise.id,
    name: exercise.name,
    category: exercise.category ?? "",
    primaryMuscles: exercise.primary_muscles ?? [],
    difficulty: normalizeDifficulty(exercise.difficulty),
  }));
}

export function getSourceExerciseById(id: number): ExerciseFormValues | null {
  const exercise = collectedExercises.find((item) => item.id === id);
  if (!exercise) return null;

  return toFormValues(exercise);
}

export function normalizeSourcePayload(payload: unknown): ExerciseFormValues[] {
  if (!payload || typeof payload !== "object") return [];

  const root = payload as { data?: unknown; results?: unknown };
  const nested = root.data && typeof root.data === "object" ? (root.data as { results?: unknown }) : null;
  const results = nested?.results ?? root.results;
  if (!Array.isArray(results)) return [];

  return results.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const raw = item as Record<string, unknown>;
    const id = typeof raw.id === "number" ? raw.id : Number(raw.id);
    const name = typeof raw.name === "string" ? raw.name : "";
    if (!Number.isInteger(id) || id <= 0 || !name) return [];

    return [toFormValues({ ...raw, id, name } as unknown as MuscleWikiExercise)];
  });
}

export function getLocalExerciseList(filters: { query?: string; status?: string; category?: string }): ExerciseListItem[] {
  const query = filters.query?.trim().toLowerCase();

  return collectedExercises
    .filter((exercise) => !query || exercise.name.toLowerCase().includes(query))
    .filter((exercise) => !filters.category || exercise.category === filters.category)
    .map((exercise) => ({
      id: `source-${exercise.id}`,
      source: "musclewiki" as const,
      sourceId: exercise.id,
      name: exercise.name,
      slug: slugify(exercise.name),
      category: exercise.category ?? "",
      difficulty: normalizeDifficulty(exercise.difficulty),
      status: "Draft" as const,
      primaryMuscles: exercise.primary_muscles ?? [],
      stepsCount: exercise.steps?.filter(Boolean).length ?? 0,
      mediaCount: exercise.videos?.filter((video) => Boolean(video.url || video.og_image)).length ?? 0,
      updatedAt: "",
    }))
    .filter((exercise) => !filters.status || exercise.status === filters.status);
}

export function getLocalPublicExercises(muscle: string): PublicExercise[] {
  const targetMuscle = getSourceMuscleName(muscle).toLowerCase();

  return collectedExercises
    .filter((exercise) => exercise.primary_muscles?.some((group) => group.toLowerCase() === targetMuscle))
    .map((exercise) => {
      const form = toFormValues(exercise);
      return {
        id: `source-${exercise.id}`,
        name: form.name,
        description: form.description,
        primaryMuscles: form.primaryMuscles,
        category: form.category,
        difficulty: form.difficulty,
        steps: form.steps.filter(Boolean),
        media: form.media,
      };
    });
}

export function getLocalPublicExerciseById(id: string): PublicExercise | null {
  const sourceId = id.startsWith("source-") ? Number(id.slice("source-".length)) : Number(id);
  if (!Number.isInteger(sourceId) || sourceId <= 0) return null;

  const form = getSourceExerciseById(sourceId);
  if (!form) return null;

  return {
    id: `source-${sourceId}`,
    name: form.name,
    description: form.description,
    primaryMuscles: form.primaryMuscles,
    category: form.category,
    difficulty: form.difficulty,
    steps: form.steps.filter(Boolean),
    media: form.media,
  };
}
