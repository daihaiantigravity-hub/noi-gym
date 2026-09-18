import "server-only";

import crypto from "node:crypto";
import type { MuscleWikiExercise, MuscleWikiVideo } from "@/lib/musclewiki";
import bicepsDumbbellRecords from "@/scripts/migration/data/musclewiki-biceps-dumbbells.json";
import bicepsDumbbellCheckpoint from "@/scripts/migration/data/musclewiki-biceps-dumbbells.checkpoint.json";
import chestDumbbellRecords from "@/scripts/migration/data/musclewiki-chest-dumbbells.json";
import { EMPTY_EXERCISE_FORM } from "./constants";
import { getExerciseCategoryOrder } from "./category-order";
import { slugify } from "./slug";
import type { ExerciseDifficulty, ExerciseFormValues, ExerciseListItem, ExerciseMediaValue, ExerciseSourceOption, PublicExercise } from "./types";

type DomMediaRecord = {
  type?: string;
  url?: string;
};

type DomExerciseRecord = {
  name: string;
  sourceUrl: string;
  difficulty?: string | null;
  primaryMuscle?: string | null;
  equipment?: string | null;
  instructions?: string[] | null;
  cardText?: string | null;
  media?: DomMediaRecord[] | null;
  force?: string | null;
  grip?: string | null;
  mechanic?: string | null;
};

type CheckpointCandidate = Pick<DomExerciseRecord, "sourceUrl" | "cardText">;

const registeredDatasets: Array<{ records: DomExerciseRecord[]; primaryMuscle: string; equipment: string }> = [
  {
    records: bicepsDumbbellRecords as unknown as DomExerciseRecord[],
    primaryMuscle: "Biceps",
    equipment: "Dumbbells",
  },
  {
    records: chestDumbbellRecords as unknown as DomExerciseRecord[],
    primaryMuscle: "Chest",
    equipment: "Dumbbells",
  },
];

const bicepsCheckpointCandidates = new Map(
  ((bicepsDumbbellCheckpoint as unknown as { candidates?: CheckpointCandidate[] }).candidates ?? [])
    .filter((candidate) => candidate?.sourceUrl)
    .map((candidate) => [candidate.sourceUrl, candidate]),
);

const cleanText = (value: unknown) => String(value ?? "").replace(/\u00a0/g, " ").replace(/[ \t]+/g, " ").trim();

function stableSourceId(sourceUrl: string) {
  // Keep this algorithm identical to the migration converter so local and
  // imported MuscleWiki records resolve to the same source-${id} key.
  const digest = crypto.createHash("sha256").update(sourceUrl).digest("hex").slice(0, 12);
  return Number.parseInt(digest, 16) + 1;
}

function extractSteps(cardText: string | null | undefined, fallback: string[] | null | undefined) {
  const text = cleanText(cardText);
  const numberedSteps = [...text.matchAll(/(?:^|\s)\d+[.)]?\s+(.+?)(?=\s+\d+[.)]?\s+|$)/g)]
    .map((match) => cleanText(match[1]).replace(/\s+Remove Ads(?:\s+Remove Ads)*$/i, ""))
    .filter(Boolean);
  const values = numberedSteps.length ? numberedSteps : (fallback ?? []);

  return [...new Set(values
    .map(cleanText)
    .filter((value) => value && !/^\/?(?:Exercises|Biceps|Chest|Dumbbell Curl)$/i.test(value)))];
}

function convertDomRecord(record: DomExerciseRecord, defaults: { primaryMuscle: string; equipment: string }): MuscleWikiExercise {
  const checkpoint = bicepsCheckpointCandidates.get(record.sourceUrl);
  const sourceId = stableSourceId(record.sourceUrl);
  const posterByAngle = new Map(
    (record.media ?? [])
      .filter((media) => media.type === "image" && media.url)
      .map((media) => [/-side(?:[_./?]|$)/i.test(media.url ?? "") ? "side" : "front", media.url] as const),
  );
  const videos = (record.media ?? [])
    .filter((media) => media.type === "video" && media.url)
    .map((media) => ({
      gender: "male",
      angle: /-side(?:[_./?]|$)/i.test(media.url ?? "") ? "side" : "front",
      url: media.url,
      og_image: posterByAngle.get(/-side(?:[_./?]|$)/i.test(media.url ?? "") ? "side" : "front"),
    }));

  return {
    id: sourceId,
    name: record.name,
    primary_muscles: [record.primaryMuscle || defaults.primaryMuscle],
    category: record.equipment || defaults.equipment,
    force: record.force ?? undefined,
    grips: record.grip ?? undefined,
    mechanic: record.mechanic ?? undefined,
    difficulty: record.difficulty ?? undefined,
    steps: extractSteps(checkpoint?.cardText || record.cardText, record.instructions),
    videos,
  };
}

const collectedExercises: MuscleWikiExercise[] = Array.from(
  new Map(
    registeredDatasets
      .flatMap((dataset) => dataset.records.map((record) => [record.sourceUrl, convertDomRecord(record, dataset)] as const)),
  ).values(),
);
const sourceMuscleNameBySlug: Record<string, string> = {
  abdominals: "Abdominals",
  biceps: "Biceps",
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
  const normalizedMuscle = muscle.trim().toLowerCase();
  return sourceMuscleNameBySlug[normalizedMuscle] ?? muscle;
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
    ...(video.og_image ? { posterUrl: video.og_image } : {}),
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

export function getLocalPublicExercises(muscle: string, options: { category?: string } = {}): PublicExercise[] {
  const targetMuscle = getSourceMuscleName(muscle).toLowerCase();
  const targetCategory = options.category?.trim().toLowerCase();

  const exercises = collectedExercises
    .filter((exercise) => exercise.primary_muscles?.some((group) => group.toLowerCase() === targetMuscle))
    .filter((exercise) => !targetCategory || exercise.category?.toLowerCase() === targetCategory)
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

  return targetCategory
    ? exercises
    : [...exercises].sort((first, second) => getExerciseCategoryOrder(first.category) - getExerciseCategoryOrder(second.category));
}

export function getLocalPublicExerciseBySourceId(sourceId: number): PublicExercise | null {
  return getLocalPublicExerciseById(`source-${sourceId}`);
}

export function getLocalPublicExerciseBySourceUrl(sourceUrl: string): PublicExercise | null {
  const sourceId = stableSourceId(sourceUrl);
  return getLocalPublicExerciseBySourceId(sourceId);
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
