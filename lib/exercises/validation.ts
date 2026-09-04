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
}, "URL phải bắt đầu bằng http:// hoặc https://");

const mediaSchema = z.object({
  gender: z.enum(EXERCISE_GENDERS),
  angle: z.enum(EXERCISE_ANGLES),
  videoUrl: httpUrl,
  duration: z.number().finite().positive().max(15).optional(),
  storagePath: z.string().trim().max(500).optional(),
});

export const exerciseInputSchema = z
  .object({
    id: z.string().uuid().nullable().optional(),
    source: z.enum(EXERCISE_SOURCES),
    sourceId: z.number().int().positive().nullable(),
    name: z.string().trim().min(2, "Tên bài tập phải có ít nhất 2 ký tự").max(160),
    slug: z.string().trim().min(2, "Slug không được để trống").max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug chỉ gồm chữ thường, số và dấu gạch ngang"),
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
      context.addIssue({ code: "custom", path: ["sourceId"], message: "Bài tập MuscleWiki cần source ID" });
    }

    if (value.status === "Published" && value.primaryMuscles.length === 0) {
      context.addIssue({ code: "custom", path: ["primaryMuscles"], message: "Bài tập publish cần ít nhất một nhóm cơ" });
    }

    if (value.status === "Published" && !value.category) {
      context.addIssue({ code: "custom", path: ["category"], message: "Bài tập publish cần chọn equipment" });
    }

    if (value.status === "Published" && !value.difficulty) {
      context.addIssue({ code: "custom", path: ["difficulty"], message: "Bài tập publish cần chọn độ khó" });
    }

    const steps = value.steps.filter(Boolean);
    if (value.status === "Published" && steps.length === 0) {
      context.addIssue({ code: "custom", path: ["steps"], message: "Bài tập publish cần ít nhất một bước hướng dẫn" });
    }
  });

export type ValidatedExerciseInput = z.infer<typeof exerciseInputSchema>;

export function parseExercisePayload(payload: string) {
  let parsed: unknown;

  try {
    parsed = JSON.parse(payload);
  } catch {
    return { success: false as const, error: "Dữ liệu form không hợp lệ" };
  }

  const result = exerciseInputSchema.safeParse(parsed);
  if (!result.success) {
    const firstIssue = result.error.issues[0];
    return { success: false as const, error: firstIssue?.message ?? "Dữ liệu bài tập không hợp lệ" };
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
