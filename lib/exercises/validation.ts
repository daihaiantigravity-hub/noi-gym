import { z } from "zod";
import { EXERCISE_ANGLES, EXERCISE_CATEGORIES, EXERCISE_DIFFICULTIES, EXERCISE_GENDERS, EXERCISE_FORCES, EXERCISE_GRIPS, EXERCISE_MECHANICS, EXERCISE_SOURCES, EXERCISE_STATUSES } from "./constants";
import type { ExerciseFormValues } from "./types";

const httpUrl = z.string().refine((value) => {
  if (!value) return true;

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}, "URL must start with http:// or https://");

const mediaSchema = z.object({
  gender: z.enum(EXERCISE_GENDERS),
  angle: z.enum(EXERCISE_ANGLES),
  videoUrl: httpUrl,
  posterUrl: httpUrl.optional(),
  posterStoragePath: z.string().trim().max(500).optional(),
  duration: z.number().finite().positive().max(15).optional(),
  storagePath: z.string().trim().max(500).optional(),
});

export const exerciseInputSchema = z
  .object({
    id: z.string().uuid().nullable().optional(),
    source: z.enum(EXERCISE_SOURCES),
    sourceId: z.number().int().positive().nullable(),
    name: z.string().trim().min(2, "Exercise name must contain at least 2 characters").max(160),
    slug: z.string().trim().min(2, "Slug cannot be empty").max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug may contain only lowercase letters, numbers, and hyphens"),
    description: z.string().trim().max(2000),
    primaryMuscles: z.array(z.string().trim().min(1)).default([]),
    category: z.enum(EXERCISE_CATEGORIES).or(z.literal("")),
    force: z.enum(EXERCISE_FORCES).or(z.literal("")),
    grips: z.enum(EXERCISE_GRIPS).or(z.literal("")),
    mechanic: z.enum(EXERCISE_MECHANICS).or(z.literal("")),
    difficulty: z.enum(EXERCISE_DIFFICULTIES).or(z.literal("")),
    status: z.enum(EXERCISE_STATUSES),
    steps: z.array(z.string().trim().max(1000)).default([]),
    media: z.array(mediaSchema).default([]),
    sourceSnapshot: z.record(z.string(), z.unknown()).nullable().optional(),
  })
  .superRefine((value, context) => {
    if (value.source === "musclewiki" && !value.sourceId) {
      context.addIssue({ code: "custom", path: ["sourceId"], message: "MuscleWiki exercises require a source ID" });
    }

    const jointOnlyMuscleWiki = value.source === "musclewiki"
      && Array.isArray(value.sourceSnapshot?.joint_targets)
      && value.sourceSnapshot.joint_targets.length > 0
      && Array.isArray(value.sourceSnapshot?.listed_in)
      && value.sourceSnapshot.listed_in.length === 0;
    if (value.status === "Published" && value.primaryMuscles.length === 0 && !jointOnlyMuscleWiki) {
      context.addIssue({ code: "custom", path: ["primaryMuscles"], message: "Published exercises require at least one muscle group" });
    }

    if (value.status === "Published" && !value.category) {
      context.addIssue({ code: "custom", path: ["category"], message: "Published exercises require equipment" });
    }

    if (value.status === "Published" && !value.difficulty) {
      context.addIssue({ code: "custom", path: ["difficulty"], message: "Published exercises require a difficulty level" });
    }

    const steps = value.steps.filter(Boolean);
    if (value.status === "Published" && steps.length === 0) {
      context.addIssue({ code: "custom", path: ["steps"], message: "Published exercises require at least one instruction step" });
    }
  });

export type ValidatedExerciseInput = z.infer<typeof exerciseInputSchema>;

export function parseExercisePayload(payload: string) {
  let parsed: unknown;

  try {
    parsed = JSON.parse(payload);
  } catch {
    return { success: false as const, error: "Invalid form data" };
  }

  const result = exerciseInputSchema.safeParse(parsed);
  if (!result.success) {
    const firstIssue = result.error.issues[0];
    return { success: false as const, error: firstIssue?.message ?? "Invalid exercise data" };
  }

  return { success: true as const, data: result.data };
}

export function formValuesFromInput(input: ValidatedExerciseInput): ExerciseFormValues {
  return {
    source: input.source,
    sourceId: input.sourceId,
    name: input.name,
    slug: input.slug,
    description: input.description,
    primaryMuscles: input.primaryMuscles,
    category: input.category,
    force: input.force,
    grips: input.grips,
    mechanic: input.mechanic,
    difficulty: input.difficulty,
    status: input.status,
    steps: input.steps.filter(Boolean),
    media: input.media,
    sourceSnapshot: input.sourceSnapshot,
  };
}
